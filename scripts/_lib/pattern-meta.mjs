// scripts/_lib/pattern-meta.mjs
//
// The ONE parser for a pattern's YAML front matter. Used by kit-coverage, kit-ingest,
// kit-listing, kit-new-pattern and (wave 2) validate.mjs, so the five tools can never
// disagree about what a pattern file says (round-1 consistency H2).
//
// Zero dependencies (kit rule D3). This is NOT a YAML parser; it reads the restricted
// subset the kit documents:
//
//   ---
//   id: shortfall-pattern                 # plain scalar (a '#' preceded by a space starts a comment)
//   solves: "One sentence, quoted."       # "double" or 'single' quoted strings
//   triggers: [shortfall, "partial fulfilment"]   # inline list ...
//   assumes:                              # ... or block list
//     - TypeScript
//   not_when: []
//   artefact: prose                       # prose | template | module
//   derived_from: [jayshankar#8]
//   status: active                        # active | deprecated | retracted
//   superseded_by: null
//   verified: null                        # null | "YYYY-MM-DD: <command that was run>"
//   ---
//
// Also accepted: `>` / `|` block scalars and indented continuation lines for scalars.
// Not accepted: nested maps, anchors, multi-document, flow maps. Such input yields an error
// with a line number; it never throws.
//
// API (the contract other work packages rely on):
//   parsePatternFile(text) -> { meta: object|null, body: string, errors: string[], warnings: string[] }
//   loadPatterns(dir)      -> [{ file, id, meta, body, errors, warnings, hasFrontMatter }]
// Line numbers in messages are 1-based lines of the original file.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

export const KNOWN_KEYS = [
  'id', 'solves', 'triggers', 'assumes', 'not_when', 'artefact',
  'derived_from', 'status', 'superseded_by', 'verified',
];
export const LIST_KEYS = new Set(['triggers', 'assumes', 'not_when', 'derived_from']);
export const ARTEFACTS = ['prose', 'template', 'module'];
export const STATUSES = ['active', 'deprecated', 'retracted'];
// A pattern with front matter must say at least these (artefact etc. may be omitted).
export const REQUIRED_KEYS = ['id', 'solves', 'triggers', 'status'];

const KEY_RE = /^([A-Za-z_][\w-]*)\s*:(?:\s+(.*)|\s*)$/;

/** Split `inner` on commas that are outside quotes. */
function splitFlow(inner, errors, lineNo) {
  const out = [];
  let cur = '';
  let q = null;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (q) {
      cur += ch;
      if (q === '"' && ch === '\\' && i + 1 < inner.length) { cur += inner[++i]; continue; }
      if (ch === q) {
        if (q === "'" && inner[i + 1] === "'") { cur += inner[++i]; continue; }
        q = null;
      }
    } else if (ch === '"' || ch === "'") {
      q = ch; cur += ch;
    } else if (ch === ',') {
      out.push(cur); cur = '';
    } else if (ch === '[' || ch === ']' || ch === '{' || ch === '}') {
      errors.push(`line ${lineNo}: nested/flow-map syntax '${ch}' is not supported inside a list`);
      cur += ch;
    } else {
      cur += ch;
    }
  }
  if (q) errors.push(`line ${lineNo}: unterminated ${q === '"' ? 'double' : 'single'} quote in list`);
  if (cur.trim() !== '' || out.length > 0) out.push(cur);
  return out;
}

/** Parse one scalar (already trimmed). Returns string | null | boolean. */
function parseScalar(raw, errors, lineNo) {
  let s = raw.trim();
  if (s === '') return '';
  const c = s[0];
  if (c === '"') {
    let out = '';
    let i = 1;
    for (; i < s.length; i++) {
      const ch = s[i];
      if (ch === '\\' && i + 1 < s.length) {
        const n = s[++i];
        out += n === 'n' ? '\n' : n === 't' ? '\t' : n;
      } else if (ch === '"') break;
      else out += ch;
    }
    if (i >= s.length) { errors.push(`line ${lineNo}: unterminated double-quoted string`); return out; }
    const rest = s.slice(i + 1).trim();
    if (rest !== '' && !rest.startsWith('#')) errors.push(`line ${lineNo}: unexpected text after closing quote: ${rest.slice(0, 20)}`);
    return out;
  }
  if (c === "'") {
    let out = '';
    let i = 1;
    for (; i < s.length; i++) {
      const ch = s[i];
      if (ch === "'") {
        if (s[i + 1] === "'") { out += "'"; i++; continue; }
        break;
      }
      out += ch;
    }
    if (i >= s.length) { errors.push(`line ${lineNo}: unterminated single-quoted string`); return out; }
    const rest = s.slice(i + 1).trim();
    if (rest !== '' && !rest.startsWith('#')) errors.push(`line ${lineNo}: unexpected text after closing quote: ${rest.slice(0, 20)}`);
    return out;
  }
  // plain scalar: strip a trailing " # comment"
  const hash = s.search(/\s#/);
  if (hash !== -1) s = s.slice(0, hash).trim();
  if (s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  return s;
}

/** Parse the value that follows `key:` on the same line (may be '' meaning "see following lines"). */
function parseInline(raw, errors, lineNo) {
  const s = raw.trim();
  if (s.startsWith('[')) {
    // find the matching close bracket outside quotes
    let q = null; let end = -1;
    for (let i = 1; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (q === '"' && ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; continue; }
      if (ch === ']') { end = i; break; }
    }
    if (end === -1) { errors.push(`line ${lineNo}: unterminated '[' list`); return []; }
    const rest = s.slice(end + 1).trim();
    if (rest !== '' && !rest.startsWith('#')) errors.push(`line ${lineNo}: unexpected text after ']'`);
    return splitFlow(s.slice(1, end), errors, lineNo)
      .map((p) => parseScalar(p, errors, lineNo))
      .filter((v) => v !== '');
  }
  if (s.startsWith('{')) { errors.push(`line ${lineNo}: '{...}' maps are not supported`); return null; }
  return parseScalar(s, errors, lineNo);
}

function checkEnums(meta, errors) {
  if (meta.artefact != null && !ARTEFACTS.includes(meta.artefact)) {
    errors.push(`artefact must be one of ${ARTEFACTS.join('|')} (got ${JSON.stringify(meta.artefact)})`);
  }
  if (meta.status != null && !STATUSES.includes(meta.status)) {
    errors.push(`status must be one of ${STATUSES.join('|')} (got ${JSON.stringify(meta.status)})`);
  }
  if (meta.verified != null && !(typeof meta.verified === 'string' && /^\d{4}-\d{2}-\d{2}:\s*\S/.test(meta.verified))) {
    errors.push('verified must be null or "YYYY-MM-DD: <command that was run>" (null beats a guess)');
  }
  if (meta.superseded_by != null && typeof meta.superseded_by !== 'string') {
    errors.push('superseded_by must be null or a pattern id');
  }
  if (meta.status === 'retracted' || meta.status === 'deprecated') {
    // not an error: superseded_by is optional, but retraction without a reason is worth a nudge elsewhere
  }
}

/**
 * Parse a pattern file's text.
 * - No front matter (text does not start with a `---` line): meta = null, body = text, errors = [].
 * - Front matter present but malformed: meta = whatever parsed (or null when unterminated), errors non-empty.
 */
export function parsePatternFile(text) {
  const errors = [];
  const warnings = [];
  if (typeof text !== 'string') return { meta: null, body: '', errors: ['input is not a string'], warnings };
  let src = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = src.split('\n');
  if (lines[0].trimEnd() !== '---') return { meta: null, body: src, errors, warnings };

  let close = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === '---') { close = i; break; }
  }
  if (close === -1) {
    return { meta: null, body: src, errors: ['line 1: front matter opens with --- but is never closed'], warnings };
  }
  const body = lines.slice(close + 1).join('\n');

  const meta = {};
  let cur = null; // { key, line, kind: 'pending'|'list'|'scalar'|'block', items?, text?, style? }
  const finish = () => {
    if (!cur) return;
    const { key } = cur;
    let value;
    if (cur.kind === 'pending') value = LIST_KEYS.has(key) ? [] : null;
    else if (cur.kind === 'list') value = cur.items;
    else if (cur.kind === 'block') {
      value = cur.style === '>' ? cur.parts.join(' ').trim() : cur.parts.join('\n').trim();
    } else if (cur.kind === 'scalar') {
      value = cur.parts.length ? [cur.value, ...cur.parts].join(' ') : cur.value;
    } else value = cur.value;
    meta[key] = value;
    cur = null;
  };

  for (let i = 1; i < close; i++) {
    const raw = lines[i];
    const lineNo = i + 1;
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      if (cur && cur.kind === 'block' && trimmed === '') cur.parts.push('');
      continue;
    }
    const indented = /^[ \t]/.test(raw);
    if (!indented) {
      finish();
      const m = raw.match(KEY_RE);
      if (!m) { errors.push(`line ${lineNo}: expected "key: value", got: ${trimmed.slice(0, 40)}`); continue; }
      const key = m[1];
      const rest = (m[2] || '').trim();
      if (Object.prototype.hasOwnProperty.call(meta, key)) {
        errors.push(`line ${lineNo}: duplicate key "${key}"`);
      }
      if (!KNOWN_KEYS.includes(key)) {
        warnings.push(`line ${lineNo}: unknown top-level key "${key}" (ignored by kit tools; known: ${KNOWN_KEYS.join(', ')})`);
      }
      if (rest === '' || rest.startsWith('#')) {
        cur = { key, line: lineNo, kind: 'pending' };
      } else if (rest === '>' || rest === '|' || /^[>|][+-]?$/.test(rest)) {
        cur = { key, line: lineNo, kind: 'block', style: rest[0], parts: [] };
      } else {
        const v = parseInline(rest, errors, lineNo);
        if (Array.isArray(v)) cur = { key, line: lineNo, kind: 'list', items: v, closed: true };
        else cur = { key, line: lineNo, kind: 'scalar', value: v, parts: [] };
      }
      continue;
    }
    // indented line: belongs to cur
    if (!cur) { errors.push(`line ${lineNo}: indented line with no key above it`); continue; }
    const item = trimmed.match(/^-(?:\s+(.*))?$/);
    if (item && (cur.kind === 'pending' || (cur.kind === 'list' && !cur.closed))) {
      if (cur.kind === 'pending') { cur = { key: cur.key, line: cur.line, kind: 'list', items: [], closed: false }; }
      const v = parseScalar(item[1] || '', errors, lineNo);
      if (v === '' || v === null) errors.push(`line ${lineNo}: empty list item under "${cur.key}"`);
      else cur.items.push(v);
    } else if (cur.kind === 'block') {
      cur.parts.push(trimmed);
    } else if (cur.kind === 'scalar' && typeof cur.value === 'string' && !LIST_KEYS.has(cur.key)) {
      // plain/quoted scalar continuation line (folded with a space)
      if (item) errors.push(`line ${lineNo}: list item under scalar key "${cur.key}"`);
      else cur.parts.push(trimmed);
    } else if (cur.kind === 'pending' && /^[A-Za-z_][\w-]*:(\s|$)/.test(trimmed)) {
      errors.push(`line ${lineNo}: nested maps are not supported ("${cur.key}" has a "${trimmed.split(':')[0]}:" child)`);
    } else if (cur.kind === 'pending') {
      // value on the next line, plain scalar
      cur = { key: cur.key, line: cur.line, kind: 'scalar', value: parseScalar(trimmed, errors, lineNo), parts: [] };
    } else if (cur.kind === 'list' && cur.closed) {
      errors.push(`line ${lineNo}: unexpected indented line after inline list "${cur.key}"`);
    } else {
      errors.push(`line ${lineNo}: cannot parse indented line (nested maps are not supported): ${trimmed.slice(0, 40)}`);
    }
  }
  finish();

  // Type checks
  for (const key of Object.keys(meta)) {
    const v = meta[key];
    if (LIST_KEYS.has(key)) {
      if (!Array.isArray(v)) {
        errors.push(`"${key}" must be a list ([a, b] or "- x" lines)`);
        meta[key] = v == null || v === '' ? [] : [String(v)];
      } else {
        meta[key] = v.map((x) => (typeof x === 'string' ? x : String(x)));
      }
    } else if (KNOWN_KEYS.includes(key) && Array.isArray(v)) {
      errors.push(`"${key}" must be a single value, not a list`);
      meta[key] = v.join(', ');
    }
  }
  checkEnums(meta, errors);
  return { meta, body, errors, warnings };
}

/** Title of a pattern body: first `# ` heading, else null. Front matter must already be stripped. */
export function titleOf(body) {
  const m = String(body).replace(/\r/g, '').match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

/**
 * Load every `*.md` in `dir` (non-recursive, sorted). `errors` combines parse errors with the
 * checks that need the filename/required keys; a file with NO front matter yields meta = null and no
 * errors (legacy pattern; callers decide whether that is acceptable).
 */
export function loadPatterns(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const out = [];
  for (const f of readdirSync(dir).filter((x) => x.toLowerCase().endsWith('.md')).sort()) {
    const text = readFileSync(join(dir, f), 'utf8');
    const { meta, body, errors, warnings } = parsePatternFile(text);
    const stem = basename(f, '.md');
    const errs = [...errors];
    if (meta) {
      for (const k of REQUIRED_KEYS) {
        if (!(k in meta) || meta[k] == null || meta[k] === '' || (Array.isArray(meta[k]) && meta[k].length === 0 && k === 'triggers')) {
          errs.push(`missing required key "${k}"`);
        }
      }
      if (typeof meta.id === 'string' && meta.id !== stem) errs.push(`id "${meta.id}" does not match file name "${stem}"`);
    }
    out.push({
      file: f,
      id: (meta && typeof meta.id === 'string' && meta.id) || stem,
      meta,
      body,
      errors: errs,
      warnings,
      hasFrontMatter: meta !== null,
    });
  }
  return out;
}

/**
 * Which of `project`'s decisions is this pattern derived from? -> Set of decision numbers (as strings, "8").
 * Sources: `derived_from` entries shaped `project#8` / `project#D8` (authoritative); when a pattern has none for
 * this project, the numbers in "decision(s) 8, 10 and 11" within its `> **Source:**` paragraph, if that paragraph
 * names the project. Used only to EXCLUDE a pattern's own source decisions from duplicate hints, never as a gate.
 */
export function decisionsDerivedFrom(pattern, project) {
  const proj = String(project || '').toLowerCase();
  const out = new Set();
  if (!proj) return out;
  const meta = pattern.meta;
  if (meta && Array.isArray(meta.derived_from)) {
    for (const ref of meta.derived_from) {
      const m = String(ref).match(/^(.+?)#D?(\d+)$/i);
      if (m && m[1].trim().toLowerCase() === proj) out.add(String(parseInt(m[2], 10)));
    }
  }
  if (out.size > 0) return out;
  const lines = String(pattern.body || '').replace(/\r/g, '').split('\n').slice(0, 40);
  const start = lines.findIndex((l) => /\*\*Source:?\*\*/i.test(l));
  if (start === -1) return out;
  const para = [];
  for (let i = start; i < lines.length; i++) {
    if (i > start && (lines[i].replace(/^\s*>\s?/, '').trim() === '' || /^---/.test(lines[i]))) break;
    para.push(lines[i].replace(/^\s*>\s?/, ''));
  }
  const text = para.join(' ');
  if (!text.toLowerCase().includes(proj)) return out;
  for (const m of text.matchAll(/decisions?\s+#?(\d+(?:\s*(?:,|and|&|\/)\s*#?\d+)*)/gi)) {
    for (const n of m[1].match(/\d+/g)) out.add(String(parseInt(n, 10)));
  }
  return out;
}
