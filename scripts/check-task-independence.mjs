#!/usr/bin/env node
// scripts/check-task-independence.mjs
//
// Checks whether the tasks of a round are truly independent BEFORE any task packet is built or
// handed out (DELEGATE-WORK.md Step 4). Two sources are read and merged:
//   1. delegation/LEDGER.md   (the author's task table; untracked in many projects, so it only
//                              exists in the main checkout), and
//   2. sessions/*.md          (OPEN session records written by `session.mjs start`; these are
//                              tracked, so they are visible from any worktree/clone).
//
// Independence rule (D29): two tasks are independent if (a) their touched-file sets don't
// intersect, and (b) neither task's interface contract depends on an artefact the other produces.
// This script checks (a) mechanically; (b) is judgment.
//
// Round-1 hardening (ledger finding H1). The old check only did exact / trailing-`*` string matches, so
// it missed: `src/App.tsx` vs `./src/app.tsx` (case-insensitive FS), `src\x.ts` backslashes, two different
// files both numbered `0037_*.sql`, `package.json` vs `package-lock.json`, migrations vs the generated schema
// doc -- and it was permanently red on the append-only decision log every task touches. Now:
//   * paths are normalised (case, slashes, leading `./`, backticks);
//   * globs: `*`, `**`, `?`, trailing `/` (a directory), and a bare directory name overlapping a file under it;
//   * SHARED / append-only exemptions (sessions/config.json `independence.shared`, or --shared=a,b): overlap on
//     these is reported as "shared", not as a conflict;
//   * COUPLED groups: touching any member counts as touching all (default: manifest + lockfile; migrations +
//     generated schema doc; extend/replace in config `independence.coupled`);
//   * CLAIMS: a task may declare `claims` ("migration-number:0037", "db:supabase-live"); two tasks claiming
//     the same key conflict. Claims are also IMPLIED by paths (`migrations/0037_x.sql` -> migration-number:0037),
//     and claim files created by `session.mjs claim` under sessions/claims/ are honoured.
//
// Usage:
//   node scripts/check-task-independence.mjs
//   node scripts/check-task-independence.mjs --ledger=delegation/LEDGER.md [--json]
//   node scripts/check-task-independence.mjs --sessions=sessions --shared=BUILDER-DECISIONS-REVIEW.md
//   options: --root=<dir> (project root; default cwd) --case-sensitive --no-sessions
//
// LEDGER.md may carry an optional `Claims` column (`;`-separated keys).
//
// Exit 0: every pair of tasks is disjoint (shared files may be listed).
// Exit 1: a file or a claim is held by 2+ tasks. Do NOT build or hand out packets.
// Exit 2: no ledger and no open session records, or no parseable task rows.
//
// Zero-dep Node ESM (D3). Exports its pure functions for tests; runs only when invoked directly.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

// ── path handling ───────────────────────────────────────────────────────────────────────────────
export function normalizePath(p, { caseSensitive = false } = {}) {
  let s = String(p).trim().replace(/^[`'"]+|[`'"]+$/g, '').trim();
  s = s.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  while (s.startsWith('./')) s = s.slice(2);
  s = s.replace(/\/\.\//g, '/');
  if (!caseSensitive) s = s.toLowerCase();
  return s;
}

// A directory entry (`src/admin/`) means everything under it.
function expandDir(p) {
  if (p.endsWith('/')) return p + '**';
  // legacy contract: a trailing single `*` meant "this path and anything under it" (`src/admin/*`)
  if (p.endsWith('*') && !p.endsWith('**')) return p + '*';
  return p;
}

export function hasWild(p) {
  return /[*?]/.test(p);
}

export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') {
          i++;
          re += '(?:.*/)?'; // `**/` = zero or more directories
        } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}

function staticPrefix(p) {
  const m = p.search(/[*?]/);
  return m === -1 ? p : p.slice(0, m);
}

// Do two (already normalised) path specs possibly name the same file?
export function pathsOverlap(a, b) {
  a = expandDir(a);
  b = expandDir(b);
  if (a === b) return true;
  const wa = hasWild(a);
  const wb = hasWild(b);
  if (!wa && !wb) return a.startsWith(b + '/') || b.startsWith(a + '/'); // a bare dir vs a file under it
  if (wa && !wb) return globToRegExp(a).test(b) || staticPrefix(a).startsWith(b + '/'); // literal may be a bare directory
  if (!wa && wb) return pathsOverlap(b, a);
  // both globs: cannot decide exactly without a full automaton; be conservative on the static prefixes
  const pa = staticPrefix(a);
  const pb = staticPrefix(b);
  return pa.startsWith(pb) || pb.startsWith(pa);
}

// ── config ──────────────────────────────────────────────────────────────────────────────────────
const DEFAULT_COUPLED = [
  ['package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock'],
  ['**/migrations/**', 'docs/schema.md'], // migrations + the generated schema doc
];
const DEFAULT_CLAIMS_FROM_PATHS = [
  { ns: 'migration-number', pattern: '(?:^|/)migrations/(\\d{3,})[_-]' },
  { ns: 'decision-number', pattern: '(?:^|/)decisions?/d?(\\d+)[_.-]' },
];

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
  } catch {
    return null;
  }
}

// ── LEDGER.md parsing (unchanged table contract) ────────────────────────────────────────────────
function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

// Take only the FIRST contiguous markdown table whose header carries the required columns (a ledger may
// grow a second, outcome table -- found by running a real autonomous round).
export function firstTableBlock(text, requiredCols) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) continue;
    const head = splitRow(lines[i]).map((c) => c.toLowerCase());
    if (!requiredCols.every((c) => head.some((h) => h.includes(c)))) continue;
    const block = [];
    for (let j = i; j < lines.length && lines[j].trim().startsWith('|'); j++) block.push(lines[j]);
    return block;
  }
  return [];
}

export function parseLedgerTasks(rawText) {
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const tableLines = firstTableBlock(text, ['task', 'touched']);
  if (tableLines.length < 3) return { error: 'no task table found (need a table with Task and Touched files columns).', tasks: [] };
  const header = splitRow(tableLines[0]).map((h) => h.toLowerCase());
  const taskCol = header.findIndex((h) => h.includes('task'));
  const touchedCol = header.findIndex((h) => h.includes('touched'));
  const claimsCol = header.findIndex((h) => h.includes('claim'));
  if (taskCol === -1 || touchedCol === -1) return { error: 'LEDGER.md table must have a "Task" column and a "Touched files" column.', tasks: [] };
  const dataRows = tableLines.slice(1).filter((l) => !/^\|[\s\-:|]+\|$/.test(l));
  const tasks = dataRows
    .map((l) => {
      const cells = splitRow(l);
      const split = (s) => (s || '').split(';').map((f) => f.trim()).filter(Boolean);
      return {
        id: cells[taskCol] || '(unnamed)',
        files: split(cells[touchedCol]),
        claims: claimsCol === -1 ? [] : split(cells[claimsCol]).map((c) => c.replace(/^`|`$/g, '')),
        source: 'ledger',
      };
    })
    .filter((t) => t.files.length > 0);
  return { tasks };
}

// ── session records (tracked sessions/*.md) ─────────────────────────────────────────────────────
// A deliberately tiny front-matter reader: `key: value`, JSON scalars/arrays, and block lists (`- x`).
export function parseFrontMatter(text) {
  const t = text.replace(/\r\n/g, '\n');
  if (!t.startsWith('---\n')) return { fm: null, body: t };
  const end = t.indexOf('\n---', 4);
  if (end === -1) return { fm: null, body: t };
  const head = t.slice(4, end).split('\n');
  const body = t.slice(end + 4).replace(/^\n/, '');
  const fm = {};
  let curList = null;
  for (const raw of head) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const item = /^\s+-\s+(.*)$/.exec(raw);
    if (item && curList) {
      curList.push(parseScalar(item[1]));
      continue;
    }
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(raw);
    if (!m) continue;
    if (m[2] === '') {
      curList = [];
      fm[m[1]] = curList;
    } else {
      curList = null;
      fm[m[1]] = parseScalar(m[2]);
    }
  }
  return { fm, body };
}

function parseScalar(v) {
  const s = v.trim();
  if (/^["\[]/.test(s) || /^(null|true|false|-?\d+(\.\d+)?)$/.test(s)) {
    try {
      return JSON.parse(s);
    } catch {
      return s;
    }
  }
  return s;
}

function gitLsFiles(root, dir) {
  const r = spawnSync('git', ['-C', root, 'ls-files', '-z', '--', dir], { encoding: 'utf8' });
  if (r.error || r.status !== 0) return null; // git absent / not a repo / unreadable config: fall back to the directory scan
  return r.stdout.split('\0').filter(Boolean);
}

// Open records. Tracked ones when git answers; otherwise a plain directory scan.
export function readOpenSessions(root, sessionsDir = 'sessions') {
  const dirAbs = resolve(root, sessionsDir);
  if (!existsSync(dirAbs)) return [];
  let files = gitLsFiles(root, sessionsDir);
  if (files) files = files.filter((f) => /^[^/]+\/[^/]+\.md$/.test(f.replace(/\\/g, '/')));
  else files = readdirSync(dirAbs).filter((f) => f.endsWith('.md')).map((f) => join(sessionsDir, f));
  const out = [];
  for (const rel of files) {
    const abs = resolve(root, rel);
    if (!existsSync(abs)) continue;
    let text;
    try {
      text = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    const { fm } = parseFrontMatter(text);
    if (!fm || fm.status !== 'open') continue;
    const list = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? v.split(';') : []).map((x) => String(x).trim()).filter(Boolean);
    out.push({
      id: String(fm.task || fm.id || rel),
      sid: String(fm.id || ''),
      files: list(fm.touched),
      claims: list(fm.claims),
      source: 'session:' + rel.replace(/\\/g, '/'),
    });
  }
  return out;
}

// Claim files created by `session.mjs claim` (sessions/claims/<ns>/<key>); the main-worktree root may differ
// from this root, so --claims-dir can point at it.
export function readClaimFiles(claimsDir) {
  const out = [];
  if (!existsSync(claimsDir)) return out;
  for (const ns of readdirSync(claimsDir)) {
    const nsDir = join(claimsDir, ns);
    let st;
    try {
      st = statSync(nsDir);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    for (const key of readdirSync(nsDir)) {
      const meta = readJson(join(nsDir, key)) || {};
      out.push({ key: `${ns}:${key}`, owner: meta.session || meta.owner || '(unknown)', task: meta.task || null });
    }
  }
  return out;
}

// ── analysis ────────────────────────────────────────────────────────────────────────────────────
// `migration-number:0037` and `migration-number:37` are the same claim.
export function normClaim(c) {
  return String(c).trim().toLowerCase().replace(/^([^:]+):0+(?=\d)/, '$1:');
}

function sameTask(a, b) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.startsWith(y + '-') || y.startsWith(x + '-');
}

function mergeTasks(list) {
  const merged = [];
  for (const t of list) {
    const hit = merged.find((m) => sameTask(m.id, t.id));
    if (hit) {
      hit.files.push(...t.files);
      hit.claims.push(...t.claims);
      hit.sources.push(t.source);
      if (t.source.startsWith('session:')) hit.sessions = (hit.sessions || 0) + 1;
    } else merged.push({ id: t.id, files: [...t.files], claims: [...t.claims], sources: [t.source], sessions: t.source.startsWith('session:') ? 1 : 0 });
  }
  return merged;
}

/**
 * @param {Array<{id,files,claims,source}>} rawTasks
 * @param {{shared?:string[], coupled?:string[][], defaultCoupled?:boolean, claimsFromPaths?:Array, caseSensitive?:boolean, claimFiles?:Array}} opts
 */
export function analyse(rawTasks, opts = {}) {
  const cs = !!opts.caseSensitive;
  const norm = (p) => normalizePath(p, { caseSensitive: cs });
  const shared = (opts.shared || []).map(norm);
  const coupled = [...(opts.defaultCoupled === false ? [] : DEFAULT_COUPLED), ...(opts.coupled || [])].map((g) => g.map(norm));
  const claimRules = (opts.claimsFromPaths || DEFAULT_CLAIMS_FROM_PATHS).map((r) => ({ ns: r.ns, re: new RegExp(r.pattern, cs ? '' : 'i') }));

  const tasks = mergeTasks(rawTasks).map((t) => {
    const declared = [...new Set(t.files.map(norm).filter(Boolean))];
    const implied = [];
    for (const g of coupled) {
      if (declared.some((f) => g.some((m) => pathsOverlap(f, m)))) {
        for (const m of g) if (!declared.some((f) => pathsOverlap(f, m)) && !implied.includes(m)) implied.push(m);
      }
    }
    const claims = new Map(); // key -> reason
    for (const c of t.claims) {
      const k = normClaim(c);
      if (k) claims.set(k, 'declared');
    }
    for (const f of declared) {
      for (const r of claimRules) {
        const m = r.re.exec(f);
        if (m) claims.set(normClaim(`${r.ns}:${m[1]}`), 'implied by ' + f);
      }
    }
    return { id: t.id, sources: t.sources, declared, implied, claims, doubled: t.sessions > 1 };
  });
  // Claim files on disk are owned by a task (when recorded); add them as declared claims.
  for (const cf of opts.claimFiles || []) {
    if (!cf.task) continue;
    const t = tasks.find((x) => sameTask(x.id, cf.task));
    if (t) t.claims.set(normClaim(cf.key), 'claim file');
  }

  const conflicts = [];
  const sharedHits = [];
  const claimConflicts = [];
  const isShared = (p) => shared.some((s) => pathsOverlap(s, p));
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const A = tasks[i];
      const B = tasks[j];
      const found = [];
      const sharedFound = [];
      const pairs = (xs, ys, via) => {
        for (const fa of xs) for (const fb of ys) {
          if (!pathsOverlap(fa, fb)) continue;
          const label = (fa === fb ? fa : `${fa} ~ ${fb}`) + (via ? ` (${via})` : '');
          const bucket = isShared(fa) && isShared(fb) ? sharedFound : found;
          if (!bucket.includes(label)) bucket.push(label);
        }
      };
      pairs(A.declared, B.declared, '');
      pairs(A.implied, B.declared, 'coupled file of ' + A.id);
      pairs(A.declared, B.implied, 'coupled file of ' + B.id);
      if (found.length) conflicts.push({ a: A.id, b: B.id, files: found });
      if (sharedFound.length) sharedHits.push({ a: A.id, b: B.id, files: sharedFound });
      for (const [k, why] of A.claims) {
        if (B.claims.has(k)) claimConflicts.push({ a: A.id, b: B.id, claim: k, why: `${why} / ${B.claims.get(k)}` });
      }
    }
  }
  const duplicateOpen = tasks.filter((t) => t.doubled).map((t) => t.id); // 2+ open sessions on one task
  return { tasks, conflicts, sharedHits, claimConflicts, duplicateOpen };
}

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────────
function argVal(args, name) {
  const f = args.find((a) => a.startsWith(`--${name}=`));
  return f ? f.slice(name.length + 3) : null;
}

export function main(args) {
  const jsonOut = args.includes('--json');
  const root = resolve(process.cwd(), argVal(args, 'root') || '.');
  const ledgerArg = argVal(args, 'ledger');
  const ledgerPath = resolve(root, ledgerArg || 'delegation/LEDGER.md');
  const sessionsDir = argVal(args, 'sessions') || 'sessions';
  const cfg = (readJson(resolve(root, sessionsDir, 'config.json')) || {}).independence || {};

  const tasks = [];
  const sources = [];
  let sessions = [];
  if (!args.includes('--no-sessions')) sessions = readOpenSessions(root, sessionsDir);
  if (existsSync(ledgerPath)) {
    const parsed = parseLedgerTasks(readFileSync(ledgerPath, 'utf8'));
    if (parsed.error && sessions.length === 0) {
      console.error(`ERROR: ${parsed.error} (${ledgerPath})`);
      return 2;
    }
    if (parsed.error) console.error(`WARN: ${parsed.error} (${ledgerPath}) -- using open session records only.`);
    tasks.push(...parsed.tasks);
    sources.push(ledgerPath);
  }
  tasks.push(...sessions);
  if (!existsSync(ledgerPath) && sessions.length === 0) {
    console.error(`ERROR: ${ledgerPath} not found and no open session records under ${sessionsDir}/.`);
    console.error('Run DELEGATE-WORK.md Step 3 first to create delegation/LEDGER.md');
    console.error('from templates/DELEGATION-LEDGER.md (or start sessions with scripts/session.mjs).');
    return 2;
  }
  if (tasks.length === 0) {
    console.error('ERROR: no task rows with a non-empty "Touched files" cell found.');
    console.error('Every task in LEDGER.md needs its touched-file list filled in before this check means anything.');
    return 2;
  }

  const sharedCli = (argVal(args, 'shared') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const claimsDir = resolve(root, argVal(args, 'claims-dir') || join(sessionsDir, 'claims'));
  const res = analyse(tasks, {
    shared: [...(cfg.shared || []), ...sharedCli],
    coupled: cfg.coupled || [],
    defaultCoupled: cfg.defaultCoupled,
    claimsFromPaths: cfg.claimsFromPaths,
    caseSensitive: args.includes('--case-sensitive'),
    claimFiles: readClaimFiles(claimsDir),
  });
  const bad = res.conflicts.length + res.claimConflicts.length;

  if (jsonOut) {
    console.log(JSON.stringify({
      ledgerPath,
      sources: [...sources, ...sessions.map((s) => s.source)],
      tasks: res.tasks.map((t) => t.id),
      conflicts: res.conflicts,
      claimConflicts: res.claimConflicts,
      shared: res.sharedHits,
      duplicateOpenSessions: res.duplicateOpen,
    }, null, 2));
  } else {
    console.log('');
    console.log(`Checked ${res.tasks.length} task(s) from ${[...sources, ...(sessions.length ? [`${sessions.length} open session record(s) in ${sessionsDir}/`] : [])].join(' + ')}`);
    console.log('');
    for (const c of res.conflicts) {
      console.log(`  X ${c.a}  <->  ${c.b}`);
      for (const f of c.files) console.log(`      shares: ${f}`);
      console.log(`      → Merge ${c.a} and ${c.b} into one task. Recommended delegate:`);
      console.log('        a senior engineer, or a frontier model run at the highest reasoning');
      console.log('        setting — not two independent contributors, since a shared');
      console.log('        file creates ordering risk between them.');
      console.log('');
    }
    for (const c of res.claimConflicts) {
      console.log(`  X ${c.a}  <->  ${c.b}`);
      console.log(`      both claim: ${c.claim}  (${c.why})`);
      console.log('      → Allocate numbers with `node scripts/session.mjs claim <ns>:next`, never "next free".');
      console.log('');
    }
    for (const s of res.sharedHits) {
      console.log(`  ~ ${s.a}  <->  ${s.b}  (shared / append-only, not a conflict)`);
      for (const f of s.files) console.log(`      shared: ${f}`);
    }
    for (const t of res.duplicateOpen) console.log(`  ! task ${t} has more than one OPEN session record`);
    if (res.sharedHits.length || res.duplicateOpen.length) console.log('');
    if (bad === 0) console.log('  ✓ No file overlaps. Every task is independent — safe to build packets.');
    else console.log(`  ${bad} conflict(s) found. Resolve before building any packet.`);
    console.log('');
  }
  return bad > 0 ? 1 : 0;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) process.exit(main(process.argv.slice(2)));
