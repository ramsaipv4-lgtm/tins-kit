// scripts/tests/independence.test.mjs -- the hardened scripts/check-task-independence.mjs (round-1 ledger finding H1).
// Throwaway directories/repos in os.tmpdir(); no project is touched.

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECK = join(KIT, 'scripts', 'check-task-independence.mjs');
const SESSION = join(KIT, 'scripts', 'session.mjs');
const haveGit = spawnSync('git', ['--version']).status === 0;

const TMP = mkdtempSync(join(tmpdir(), 'indep-test-'));
const EMPTY_CFG = join(TMP, 'empty.gitconfig');
writeFileSync(EMPTY_CFG, '');
const ENV = { ...process.env, GIT_CONFIG_GLOBAL: EMPTY_CFG, GIT_CONFIG_NOSYSTEM: '1', LC_ALL: 'C' };
let n = 0;

function mkDir() {
  const d = join(TMP, `p${++n}`);
  mkdirSync(join(d, 'delegation'), { recursive: true });
  return d;
}
function ledger(dir, rows, extraCols = '') {
  const head = `| Task | Mode | Status | Assignee | Depends | Touched files |${extraCols ? ' ' + extraCols.split(',')[0] + ' |' : ''}`;
  const sep = '|---|---|---|---|---|---|' + (extraCols ? '---|' : '');
  const body = rows.map((r) => `| ${r[0]} | auditor-local | ready | worker | — | ${r[1]} |${extraCols ? ` ${r[2] || ''} |` : ''}`);
  writeFileSync(join(dir, 'delegation', 'LEDGER.md'), ['# L', '', head, sep, ...body, ''].join('\n'));
}
function run(dir, args = []) {
  const r = spawnSync(process.execPath, [CHECK, ...args], { cwd: dir, encoding: 'utf8', env: ENV });
  return { code: r.status, out: r.stdout, err: r.stderr, all: r.stdout + r.stderr };
}
const ok = (r) => assert.equal(r.code, 0, r.all);
const bad = (r) => assert.equal(r.code, 1, r.all);

test('legacy behaviour: disjoint files pass; exact and trailing-* overlaps fail; message contract kept', () => {
  const d = mkDir();
  ledger(d, [['T1', '`src/a.ts`'], ['T2', '`src/b.ts`']]);
  const r = run(d);
  ok(r);
  assert.match(r.out, /Checked 2 task\(s\)/);
  assert.match(r.out, /No file overlaps/);
  ledger(d, [['T1', '`src/a.ts`'], ['T2', '`src/a.ts`; `x.ts`']]);
  bad(run(d));
  ledger(d, [['T1', '`src/admin/*`'], ['T2', '`src/admin/panel/deep.tsx`']]); // legacy: trailing * = anything under it (and the old code missed it behind backticks)
  const r2 = run(d);
  bad(r2);
  assert.match(r2.out, /Merge T1 and T2/);
  ledger(d, [['T1', 'src/foo*'], ['T2', 'src/foobar.ts']]);
  bad(run(d));
});

test('exit 2 when there is neither a ledger nor an open session record; and on a ledger without a task table', () => {
  const d = mkDir();
  assert.equal(run(d).code, 2);
  writeFileSync(join(d, 'delegation', 'LEDGER.md'), 'no table here\n');
  assert.equal(run(d).code, 2);
});

test('json output keeps the old keys and adds claimConflicts / shared', () => {
  const d = mkDir();
  ledger(d, [['T1', 'a.ts'], ['T2', 'a.ts']]);
  const j = JSON.parse(run(d, ['--json']).out);
  assert.deepEqual(j.tasks, ['T1', 'T2']);
  assert.equal(j.conflicts.length, 1);
  assert.ok(Array.isArray(j.claimConflicts) && Array.isArray(j.shared));
});

test('normalisation: case, backslashes and ./ no longer hide an overlap', () => {
  const d = mkDir();
  ledger(d, [['T1', 'src/App.tsx; src\\lib\\x.ts'], ['T2', './src/app.tsx']]);
  bad(run(d));
  ledger(d, [['T1', 'src\\lib\\x.ts'], ['T2', 'src//lib/./X.ts']]);
  bad(run(d));
  ledger(d, [['T1', 'src/App.tsx'], ['T2', './src/app.tsx']]);
  ok(run(d, ['--case-sensitive']));
});

test('globs: ** / ? / trailing slash / a bare directory over a file under it', () => {
  const d = mkDir();
  for (const [a, b, want] of [
    ['src/**', 'src/a/b/c.ts', 1],
    ['src/*.ts', 'src/a.ts', 1],
    ['src/*.ts', 'src/a/b.ts', 0],
    ['src/a?.ts', 'src/ab.ts', 1],
    ['src/admin/', 'src/admin/x.ts', 1],
    ['src/admin', 'src/admin/x.ts', 1],
    ['src/admin', 'src/administrator.ts', 0],
    ['src/**/*.test.ts', 'src/a/b/c.test.ts', 1],
  ]) {
    ledger(d, [['T1', a], ['T2', b]]);
    assert.equal(run(d).code, want, `${a} vs ${b}`);
  }
});

test('two DIFFERENT files both numbered 0037_*.sql conflict through the migration-number claim', () => {
  const d = mkDir();
  ledger(d, [['T1', 'supabase/migrations/0037_a_status.sql; supabase/migrations/0038_a_fn.sql'], ['T2', 'supabase/migrations/0037_b_other.sql']]);
  const r = run(d);
  bad(r);
  assert.match(r.out, /both claim: migration-number:37/);
  assert.match(r.out, /claim <ns>:next/);
  ledger(d, [['T1', 'supabase/migrations/0037_a.sql'], ['T2', 'supabase/migrations/0038_b.sql']]);
  ok(run(d)); // different numbers: independent (the generated schema doc is the coupled-file concern, below)
});

test('coupled groups: manifest + lockfile; migrations + generated schema doc', () => {
  const d = mkDir();
  ledger(d, [['T1', 'package.json'], ['T2', 'package-lock.json']]);
  const r = run(d);
  bad(r);
  assert.match(r.out, /coupled file/);
  ledger(d, [['T1', 'supabase/migrations/0037_a.sql'], ['T2', 'docs/SCHEMA.md']]);
  bad(run(d));
  ledger(d, [['T1', 'package.json'], ['T2', 'src/x.ts']]);
  ok(run(d));
  // a custom group from sessions/config.json
  mkdirSync(join(d, 'sessions'), { recursive: true });
  writeFileSync(join(d, 'sessions', 'config.json'), JSON.stringify({ independence: { coupled: [['openapi.yaml', 'src/api/client.gen.ts']] } }));
  ledger(d, [['T1', 'openapi.yaml'], ['T2', 'src/api/client.gen.ts']]);
  bad(run(d));
  writeFileSync(join(d, 'sessions', 'config.json'), JSON.stringify({ independence: { defaultCoupled: false } }));
  ledger(d, [['T1', 'package.json'], ['T2', 'package-lock.json']]);
  ok(run(d));
});

test('shared / append-only exemption: the decision log every task touches is reported, not a conflict', () => {
  const d = mkDir();
  ledger(d, [['T1', 'src/a.ts; BUILDER-DECISIONS-REVIEW.md'], ['T2', 'src/b.ts; BUILDER-DECISIONS-REVIEW.md']]);
  bad(run(d)); // without the exemption it is red, as the old check was
  const r = run(d, ['--shared=BUILDER-DECISIONS-REVIEW.md']);
  ok(r);
  assert.match(r.out, /shared \/ append-only/);
  mkdirSync(join(d, 'sessions'), { recursive: true });
  writeFileSync(join(d, 'sessions', 'config.json'), JSON.stringify({ independence: { shared: ['builder-decisions-review.md'] } }));
  ok(run(d));
  // a real overlap next to a shared one is still a conflict
  ledger(d, [['T1', 'src/a.ts; BUILDER-DECISIONS-REVIEW.md'], ['T2', 'src/a.ts; BUILDER-DECISIONS-REVIEW.md']]);
  bad(run(d));
});

test('claims column: two tasks claiming db:supabase-live conflict; distinct claims do not', () => {
  const d = mkDir();
  ledger(d, [['T1', 'a.ts', 'db:supabase-live'], ['T2', 'b.ts', 'db:supabase-live']], 'Claims');
  const r = run(d);
  bad(r);
  assert.match(r.out, /db:supabase-live/);
  ledger(d, [['T1', 'a.ts', 'db:supabase-live'], ['T2', 'b.ts', 'decision-number:99; migration-number:0040']], 'Claims');
  ok(run(d));
  ledger(d, [['T1', 'a.ts', 'migration-number:0037'], ['T2', 'b.ts', 'migration-number:37']], 'Claims');
  bad(run(d)); // 0037 and 37 are the same number
});

test('claim files created by session.mjs claim are honoured when they name a task', () => {
  const d = mkDir();
  ledger(d, [['T1', 'a.ts'], ['T2', 'b.ts']]);
  const nsDir = join(d, 'sessions', 'claims', 'migration-number');
  mkdirSync(nsDir, { recursive: true });
  writeFileSync(join(nsDir, '0037'), JSON.stringify({ session: 's-1', task: 'T1' }));
  ok(run(d));
  writeFileSync(join(nsDir, '0037'), JSON.stringify({ session: 's-1', task: 'T1' }));
  ledger(d, [['T1', 'a.ts', 'migration-number:0037'], ['T2', 'b.ts', 'x'], ['T3', 'c.ts', 'migration-number:37']], 'Claims');
  bad(run(d));
});

// ── tracked sessions/ open records ──────────────────────────────────────────────────────────────
function repo() {
  const d = mkDir();
  const g = (...a) => {
    const r = spawnSync('git', a, { cwd: d, encoding: 'utf8', env: ENV });
    if (r.status !== 0) throw new Error(r.stderr);
  };
  g('init', '-q', '-b', 'main');
  g('config', 'user.email', 't@example.invalid');
  g('config', 'user.name', 'T');
  mkdirSync(join(d, 'scripts'), { recursive: true });
  copyFileSync(SESSION, join(d, 'scripts', 'session.mjs'));
  writeFileSync(join(d, 'README.md'), 'x\n');
  g('add', '-A');
  g('commit', '-qm', 'base');
  return { d, g };
}
function startIn(cwd, task, touched, extra = []) {
  const r = spawnSync(process.execPath, [join(cwd, 'scripts', 'session.mjs'), 'start', '--task', task, '--harness', 'h', '--model', 'm', '--model-source', 'human', '--touched', touched, ...extra], { cwd, encoding: 'utf8', env: ENV });
  assert.equal(r.status, 0, r.stdout + r.stderr);
}

test('open tracked session records alone are enough (no LEDGER.md); overlapping declared files conflict', { skip: !haveGit && 'git not on PATH' }, () => {
  const { d, g } = repo();
  startIn(d, 'TA', 'src/shared.ts;src/a.ts');
  // second session on another branch/worktree of the SAME repo is not visible until it is merged; simulate by a second record on this branch
  g('checkout', '-q', '-b', 'second');
  // distinct worktree path so `start` does not refuse a second open session on one branch+worktree
  startIn(d, 'TB', './src/Shared.ts');
  const r = run(d);
  bad(r);
  assert.match(r.out, /open session record/);
  assert.match(r.out, /(TA\s+<->\s+TB|TB\s+<->\s+TA)/); // order follows the record file names (same-second starts tie)
});

test('closed records and UNTRACKED records are ignored; the same task in ledger and session does not self-conflict', { skip: !haveGit && 'git not on PATH' }, () => {
  const { d, g } = repo();
  startIn(d, 'T1', 'src/a.ts', ['--no-commit']); // untracked record
  ledger(d, [['T2', 'src/a.ts']]);
  ok(run(d)); // the untracked record is not visible: only the ledger task counts
  g('add', '-A');
  g('commit', '-qm', 'record');
  bad(run(d)); // now tracked and open: T1 vs T2 overlap
  ledger(d, [['T1-the-slug', 'src/a.ts; src/extra.ts']]);
  const r = run(d);
  ok(r); // the ledger row and its open session are ONE task
  assert.match(r.out, /Checked 1 task/);
});
