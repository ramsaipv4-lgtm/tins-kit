// scripts/_lib/kit-tree.mjs
// Shared helpers for the scripts that treat the kit as a tree of files: kit-version (identity
// hash), kit-sync (what is pushed to consumers), kit-new-project-shell / new-project (which
// scripts a scaffold receives) and kit-staging-export (is a consumer file identical to the kit's?).
//
// Why a shared module: round-1 consistency finding M1 — rosters were hand-kept in six places and
// drifted. The exclusion sets below are the single place that says what is "kit-only" and what is
// not part of the kit's identity. Zero-dep Node ESM, node: built-ins only, cross-OS (all keys are
// POSIX-style relative paths; hashes normalise CRLF so a Windows checkout hashes like a Linux one).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------------------------
// Paths and hashing
// ---------------------------------------------------------------------------------------------

export function toPosix(p) {
  return sep === '/' ? p : p.split(sep).join('/');
}

// Text files hash with CRLF normalised to LF; a file containing a NUL byte is binary and hashes raw.
export function normaliseBuffer(buf) {
  const probe = buf.subarray(0, 8000);
  if (probe.includes(0)) return buf;
  return Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
}

export function hashBuffer(buf) {
  return createHash('sha256').update(normaliseBuffer(buf)).digest('hex');
}

export function hashFile(path) {
  return hashBuffer(readFileSync(path));
}

export function hashText(text) {
  return hashBuffer(Buffer.from(text, 'utf8'));
}

// ---------------------------------------------------------------------------------------------
// What is part of the kit's identity, and what a sync pushes
// ---------------------------------------------------------------------------------------------

// Directory names skipped at any depth when walking a kit tree. `examples/` is reference material
// for a person (D36) and is never vendored, so it cannot be part of a vendored copy's identity.
export const SKIP_DIR_NAMES = new Set(['.git', 'node_modules', 'examples']);

// Top-level paths (POSIX, trailing slash = directory prefix) that are kit-machine bookkeeping:
// not vendored to consumers by kit-sync, not part of the identity hash.
export const KIT_LOCAL_PATHS = [
  'docs/changes/', // per-work-package change notes written while the kit is being edited
  'kit-staging/', // the inbox, triage reports and archive
  '_to_delete/',
  '.trash_kitstaging/',
];

// Generated files that live inside a vendored copy but are not kit content.
export function isGeneratedFile(rel) {
  return (
    rel === 'KIT-VERSION' ||
    rel === '.kit-sync.json' ||
    rel.startsWith('.kit-sync-backup/') ||
    rel.endsWith('.tombstone.md')
  );
}

export function isKitLocal(rel) {
  return KIT_LOCAL_PATHS.some((p) => rel === p.slice(0, -1) || rel.startsWith(p));
}

// True when `rel` belongs to the kit's identity (hashed, and compared across vendored copies).
export function isIdentityFile(rel) {
  return !isKitLocal(rel) && !isGeneratedFile(rel);
}

// Walk `root` and return sorted POSIX-relative file paths. `isSkippedDir(name)` may be overridden.
export function walkTree(root, { isSkippedDir = (name) => SKIP_DIR_NAMES.has(name) } = {}) {
  const out = [];
  function visit(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (isSkippedDir(name)) continue;
        visit(full);
      } else if (st.isFile()) {
        out.push(toPosix(relative(root, full)));
      }
    }
  }
  visit(root);
  return out.sort(cmp);
}

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0; // code-unit order: identical on every OS and locale
}

// ---------------------------------------------------------------------------------------------
// Kit identity (KIT-VERSION)
// ---------------------------------------------------------------------------------------------

export function computeKitHash(root) {
  const files = walkTree(root).filter(isIdentityFile);
  const h = createHash('sha256');
  for (const rel of files) h.update(`${rel}\0${hashFile(join(root, rel))}\n`);
  return { hash: h.digest('hex'), files: files.length };
}

const VERSION_FILE = 'KIT-VERSION';

// KIT-VERSION is line-oriented `key: value`; `#` lines are comments.
export function parseKitVersion(text) {
  const out = {};
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const m = /^([a-z]+):\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].trim();
  }
  if (!out.label || !out.hash) return null;
  return {
    label: out.label,
    hash: out.hash.replace(/^sha256:/, ''),
    date: out.date || null,
    files: out.files ? Number(out.files) : null,
  };
}

export function formatKitVersion({ label, hash, date, files }) {
  return [
    '# KIT-VERSION - generated by scripts/kit-version.mjs; do not edit by hand.',
    '# The kit has no git (VERSIONING.md Rule 5): this file is its identity. A proposal patch',
    '# names the label+hash it was made against.',
    `label: ${label}`,
    `hash: sha256:${hash}`,
    `date: ${date}`,
    `files: ${files}`,
    '',
  ].join('\n');
}

export function readKitVersion(root) {
  const p = join(root, VERSION_FILE);
  if (!existsSync(p)) return null;
  return parseKitVersion(readFileSync(p, 'utf8'));
}

// What a tool should record about "the kit it is working from". Never throws.
export function describeKit(root) {
  const stamped = readKitVersion(root);
  const actual = computeKitHash(root);
  if (!stamped) {
    return { label: 'unversioned', hash: actual.hash, date: null, stamped: false, stale: true, files: actual.files };
  }
  return { label: stamped.label, hash: actual.hash, date: stamped.date, stamped: true, stale: stamped.hash !== actual.hash, files: actual.files, stampedHash: stamped.hash };
}

export function shortHash(hash) {
  return String(hash).slice(0, 12);
}

// ---------------------------------------------------------------------------------------------
// Which scripts a consumer (scaffold or portable shell) receives
// ---------------------------------------------------------------------------------------------

// Kit-machine only: they act on the kit tree itself, on the inbox, or scaffold new projects.
export const KIT_ONLY_SCRIPTS = new Set([
  'kit-ingest.mjs',
  'kit-sync.mjs',
  'kit-new-project-shell.mjs',
  'new-project.mjs',
  'harness-test.mjs',
  'rmrf.mjs',
  'private-to-public.mjs',
]);

// The portable shell is for the spec -> build -> export loop, not for maintaining a kit or a stack:
// no kit selftest (it carries no kit tree), no pattern authoring/listing, no stack-specific tools.
export const SHELL_EXCLUDED_SCRIPTS = new Set([
  'selftest.mjs',
  'add-footers.mjs',
  'kit-listing.mjs',
  'kit-new-pattern.mjs',
  'migration-runner.mjs',
  'docs-guardian.mjs',
]);

// Kit-curriculum templates the shell does not need.
export const SHELL_EXCLUDED_TEMPLATES = new Set(['CURRICULUM-PROGRESS.md', 'TRAININGS.md']);

// Returns [{ src: <kit-relative>, dst: <kit-relative> }] for everything under scripts/ that a
// consumer should get: top-level *.mjs, all of scripts/_lib/, and (unless `shell`) every test file
// whose subject scripts are all shipped too (a test that imports a kit-only script would fail there).
export function listShippableScripts(kitRoot, { shell = false } = {}) {
  const dir = join(kitRoot, 'scripts');
  const out = [];
  if (!existsSync(dir)) return out;
  const topLevel = readdirSync(dir).filter((n) => n.endsWith('.mjs') && statSync(join(dir, n)).isFile()).sort(cmp);
  const shipped = new Set(topLevel.filter((n) => !KIT_ONLY_SCRIPTS.has(n) && !(shell && SHELL_EXCLUDED_SCRIPTS.has(n))));
  for (const n of topLevel) if (shipped.has(n)) out.push(`scripts/${n}`);
  const libDir = join(dir, '_lib');
  if (existsSync(libDir)) {
    for (const rel of walkTree(libDir)) out.push(`scripts/_lib/${rel}`);
  }
  if (!shell) {
    const testsDir = join(dir, 'tests');
    if (existsSync(testsDir)) {
      for (const rel of walkTree(testsDir)) {
        if (!rel.endsWith('.test.mjs') || testSubjectsShipped(readFileSync(join(testsDir, rel), 'utf8'), topLevel, shipped)) {
          out.push(`scripts/tests/${rel}`);
        }
      }
    }
  }
  return out;
}

// A test "refers to" a kit script when its text mentions that script's file name. It may be shipped
// only if every mentioned top-level kit script is itself shipped.
function testSubjectsShipped(text, allScripts, shipped) {
  for (const name of allScripts) {
    if (text.includes(name) && !shipped.has(name)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------------------------
// Pattern lifecycle status (front matter) - a minimal read of three keys
// ---------------------------------------------------------------------------------------------

// Not a YAML parser. The kit's shared parser is scripts/_lib/pattern-meta.mjs (built by another
// work package); sync must keep working on a copy that predates it, so it reads only the three
// scalar keys it acts on, from a leading `---` ... `---` block.
export function readPatternStatus(text) {
  const t = text.replace(/\r\n/g, '\n').replace(/^﻿/, '');
  if (!t.startsWith('---\n')) return { status: 'active' };
  const end = t.indexOf('\n---', 4);
  if (end === -1) return { status: 'active' };
  const out = { status: 'active' };
  for (const line of t.slice(4, end).split('\n')) {
    const m = /^(status|superseded_by|reason):\s*(.*?)\s*(#.*)?$/.exec(line);
    if (!m) continue;
    const v = m[2].replace(/^["']|["']$/g, '');
    if (m[1] === 'status') out.status = v || 'active';
    else out[m[1] === 'superseded_by' ? 'supersededBy' : 'reason'] = v === 'null' ? null : v;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------------------------

// Remove credentials from a remote URL (a URL carrying user:secret before the host becomes the bare host URL) before it is
// written anywhere. An `scp`-style git@host:path URL carries no secret and is left alone.
export function scrubUrl(url) {
  return String(url).trim().replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/@\s]*@/i, '$1');
}
