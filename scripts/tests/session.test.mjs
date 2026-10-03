// scripts/tests/session.test.mjs -- scripts/session.mjs against THROWAWAY git repos in os.tmpdir().
// Never touches the kit's or any project's .git. Every credential-shaped string here is invented.

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync, readdirSync, renameSync, rmSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SESSION_SRC = join(KIT, 'scripts', 'session.mjs');
const INDEP_SRC = join(KIT, 'scripts', 'check-task-independence.mjs');
const SCANNER_SRC = join(KIT, 'scripts', 'scan-secrets.mjs');

const haveGit = spawnSync('git', ['--version']).status === 0;
const T = (name, fn) => test(name, { skip: !haveGit && 'git not on PATH' }, fn);

const TMP = mkdtempSync(join(tmpdir(), 'session-test-'));
const EMPTY_CFG = join(TMP, 'empty.gitconfig');
writeFileSync(EMPTY_CFG, '');
const ENV = { ...process.env, GIT_CONFIG_GLOBAL: EMPTY_CFG, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' };
let counter = 0;

function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: ENV });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}: ${r.stderr}`);
  return r.stdout.trim();
}
function gitRaw(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: ENV });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
// scanner: 'real' | 'stub' | 'none'
function mkRepo(scanner = 'real') {
  const dir = join(TMP, `repo${++counter} with space`);
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.email', 't@example.invalid');
  git(dir, 'config', 'user.name', 'T');
  git(dir, 'config', 'commit.gpgsign', 'false');
  copyFileSync(SESSION_SRC, join(dir, 'scripts', 'session.mjs'));
  copyFileSync(INDEP_SRC, join(dir, 'scripts', 'check-task-independence.mjs'));
  if (scanner === 'real') copyFileSync(SCANNER_SRC, join(dir, 'scripts', 'scan-secrets.mjs'));
  if (scanner === 'stub') {
    writeFileSync(join(dir, 'scripts', 'scan-secrets.mjs'),
      "import {readFileSync} from 'node:fs'; const t=readFileSync(0,'utf8'); const i=t.split('\\n').findIndex(l=>l.includes('FAKE-SECRET-XYZ'));\n" +
      "if(i>=0){console.log('<stdin>:'+(i+1)+': stub-secret');process.exit(1)} process.exit(0)\n");
  }
  writeFileSync(join(dir, 'README.md'), 'base\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'base');
  return dir;
}
function ses(cwd, args, input) {
  const r = spawnSync(process.execPath, [join(cwd, 'scripts', 'session.mjs'), ...args], { cwd, encoding: 'utf8', env: ENV, input });
  return { code: r.status, out: r.stdout, err: r.stderr, all: r.stdout + r.stderr };
}
function start(cwd, task = 'T1', extra = []) {
  const r = ses(cwd, ['start', '--task', task, '--harness', 'test-harness', '--model', 'test/model:1', '--model-source', 'self-reported', ...extra]);
  assert.equal(r.code, 0, r.all);
  return /session (\S+) started/.exec(r.out)[1];
}
function commit(cwd, msg, sid) {
  git(cwd, 'add', '-A');
  if (sid) git(cwd, 'commit', '-qm', msg, '-m', `Session: ${sid}`);
  else git(cwd, 'commit', '-qm', msg);
}
function close(cwd, sid, outcome = 'passed', extra = []) {
  return ses(cwd, ['close', '--session', sid, '--outcome', outcome, '--body', 'Did the thing, because the task said so.', '--gate-cmd', 'node -e "process.exit(0)"', ...extra]);
}
function record(cwd, sid) {
  const f = readdirSync(join(cwd, 'sessions')).find((x) => x.endsWith(`-${sid}.md`));
  return readFileSync(join(cwd, 'sessions', f), 'utf8');
}
const fmList = (text, key) => {
  const m = new RegExp(`^${key}:(?: \\[\\])?\\n?((?:  - .*\\n?)*)`, 'm').exec(text);
  return m ? [...m[1].matchAll(/^  - "(.*)"$/gm)].map((x) => x[1]) : [];
};
const fmVal = (text, key) => {
  const m = new RegExp(`^${key}: (.*)$`, 'm').exec(text);
  return m ? JSON.parse(m[1]) : undefined;
};
function worktree(main, name, branch) {
  const wt = join(TMP, `wt-${++counter}-${name}`);
  git(main, 'worktree', 'add', '-q', wt, '-b', branch);
  return wt;
}
function merge(main, branch) {
  git(main, 'merge', '--no-ff', '-q', '-m', `merge ${branch}`, branch);
}

// ── happy path with two worktrees ───────────────────────────────────────────────────────────────
T('two worktrees: start/close/merge --no-ff, check passes, index maps path -> sessions', () => {
  const main = mkRepo();
  const wtA = worktree(main, 'a', 'task/a');
  const wtB = worktree(main, 'b', 'task/b');
  const a = start(wtA, 'TA');
  const b = start(wtB, 'TB');
  assert.notEqual(a, b);
  assert.ok(existsSync(join(wtA, 'sessions')) && existsSync(join(wtB, 'sessions')));
  writeFileSync(join(wtA, 'a.txt'), 'one\ntwo\n');
  commit(wtA, 'work a', a);
  writeFileSync(join(wtB, 'b.txt'), 'x\n');
  commit(wtB, 'work b', b);
  const ca = close(wtA, a);
  assert.equal(ca.code, 0, ca.all);
  assert.equal(close(wtB, b).code, 0);
  const ra = record(wtA, a);
  assert.deepEqual(fmList(ra, 'files_created'), ['a.txt']);
  assert.equal(fmVal(ra, 'lines_added'), 2);
  assert.equal(fmVal(ra, 'gate_exit'), 0);
  assert.equal(fmVal(ra, 'model_source'), 'self-reported');
  assert.ok(!/test\/model/.test(readdirSync(join(wtA, 'sessions')).join()), 'the model name must not be in the file name');
  merge(main, 'task/a');
  merge(main, 'task/b');
  const chk = ses(main, ['check']);
  assert.equal(chk.code, 0, chk.all);
  const idx = JSON.parse(ses(main, ['index']).out);
  assert.deepEqual(idx.paths['a.txt'], [a]);
  assert.deepEqual(idx.paths['b.txt'], [b]);
  assert.equal(idx.covers.records, 2);
  assert.equal(ses(main, ['index', '--format', 'md']).code, 0);
});

T('start: refuses a dirty tree, an invalid model-source, and a second open session on the same branch', () => {
  const main = mkRepo();
  writeFileSync(join(main, 'dirty.txt'), 'x');
  let r = ses(main, ['start', '--task', 'T', '--harness', 'h', '--model', 'm', '--model-source', 'human']);
  assert.notEqual(r.code, 0);
  assert.match(r.all, /dirty/);
  assert.equal(ses(main, ['start', '--task', 'T', '--harness', 'h', '--model', 'm', '--model-source', 'human', '--allow-untracked']).code, 0);
  rmSync(join(main, 'dirty.txt'));
  r = ses(main, ['start', '--task', 'T2', '--harness', 'h', '--model', 'm', '--model-source', 'bogus']);
  assert.equal(r.code, 2);
  r = ses(main, ['start', '--task', 'T3', '--harness', 'h', '--model', 'm', '--model-source', 'human']);
  assert.notEqual(r.code, 0);
  assert.match(r.all, /already exists|OPEN session/);
});

T('start prints the reading list it was given and records it', () => {
  const main = mkRepo();
  const r = ses(main, ['start', '--task', 'T', '--harness', 'h', '--model', 'm', '--model-source', 'launcher', '--reading', 'AGENTS.md:1-40;HANDOVER.md:200-282']);
  assert.equal(r.code, 0, r.all);
  assert.match(r.out, /1\. AGENTS\.md:1-40/);
  assert.match(r.out, /2\. HANDOVER\.md:200-282/);
});

// ── git config that git itself rejects ──────────────────────────────────────────────────────────
T('a .git/config git rejects: start refuses, doctor names the offending line', () => {
  const main = mkRepo();
  const cfg = join(main, '.git', 'config');
  const text = readFileSync(cfg, 'utf8');
  writeFileSync(cfg, text.replace(/\[core\]\n/, '[core]\n\tfilemode = core.autocrlf\n'));
  const r = ses(main, ['start', '--task', 'T', '--harness', 'h', '--model', 'm', '--model-source', 'human']);
  assert.notEqual(r.code, 0);
  assert.match(r.all, /rejects/);
  assert.ok(!existsSync(join(main, 'sessions')), 'nothing may be written');
  const d = ses(main, ['doctor']);
  assert.equal(d.code, 1);
  assert.match(d.all, /filemode/);
  assert.match(d.all, /line \d+/);
  writeFileSync(cfg, text); // repair, then doctor is green
  assert.equal(ses(main, ['doctor']).code, 0, ses(main, ['doctor']).all);
});

T('doctor: a worktree whose directory moved is reported with the exact repair command', () => {
  const main = mkRepo();
  const wt = worktree(main, 'moved', 'task/moved');
  const moved = wt + '-moved';
  renameSync(wt, moved);
  const d = ses(main, ['doctor']);
  assert.match(d.all, /not reachable/);
  assert.match(d.all, /git worktree repair/);
  git(main, 'worktree', 'repair', moved);
  assert.ok(!/not reachable/.test(ses(main, ['doctor']).all));
});

// ── close: derivations ──────────────────────────────────────────────────────────────────────────
T('CRLF-inflated line counts: a whole-file CRLF->LF rewrite plus one real line counts as 1 line', () => {
  const main = mkRepo();
  writeFileSync(join(main, 'win.txt'), Array.from({ length: 200 }, (_, i) => `line ${i}`).join('\r\n') + '\r\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'crlf file');
  const sid = start(main);
  writeFileSync(join(main, 'win.txt'), Array.from({ length: 200 }, (_, i) => `line ${i}`).join('\n') + '\nreal new line\n');
  commit(main, 'normalise + one line', sid);
  assert.equal(close(main, sid).code, 0);
  const rec = record(main, sid);
  assert.equal(fmVal(rec, 'lines_added'), 1, 'CR-at-eol noise must not count');
  assert.equal(fmVal(rec, 'lines_removed'), 0);
});

T('generated paths are separated from the human line total (default list and sessions/config.json)', () => {
  const main = mkRepo();
  mkdirSync(join(main, 'docs'));
  mkdirSync(join(main, 'gen'));
  mkdirSync(join(main, 'sessions'));
  writeFileSync(join(main, 'sessions', 'config.json'), JSON.stringify({ generated: ['gen/'], gateCmd: null }));
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'config');
  const sid = start(main);
  writeFileSync(join(main, 'package-lock.json'), '{}\n'.repeat(500)); // NOT in the overridden list -> counts as human
  writeFileSync(join(main, 'gen', 'out.ts'), 'x\n'.repeat(300));
  writeFileSync(join(main, 'src.ts'), 'a\nb\nc\n');
  commit(main, 'work', sid);
  assert.equal(close(main, sid).code, 0);
  const rec = record(main, sid);
  assert.deepEqual(fmList(rec, 'generated_files'), ['gen/out.ts']);
  assert.equal(fmVal(rec, 'generated_lines'), 300);
  assert.equal(fmVal(rec, 'lines_added'), 503);
  // and the default list, with no config
  const main2 = mkRepo();
  const s2 = start(main2);
  writeFileSync(join(main2, 'package-lock.json'), '{}\n'.repeat(500));
  mkdirSync(join(main2, 'docs'));
  writeFileSync(join(main2, 'docs', 'SCHEMA.md'), 's\n'.repeat(100));
  writeFileSync(join(main2, 'x.ts'), 'one\n');
  commit(main2, 'w', s2);
  assert.equal(close(main2, s2).code, 0);
  const r2 = record(main2, s2);
  assert.equal(fmVal(r2, 'lines_added'), 1);
  assert.equal(fmVal(r2, 'generated_lines'), 600);
});

T('renames and deletions use -z -M: a path with spaces and a rename are reported exactly', () => {
  const main = mkRepo();
  writeFileSync(join(main, 'old name.txt'), 'content that is long enough to be detected as a rename\n'.repeat(5));
  writeFileSync(join(main, 'gone.txt'), 'bye\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'files');
  const sid = start(main);
  git(main, 'mv', 'old name.txt', 'new name.txt');
  git(main, 'rm', '-q', 'gone.txt');
  commit(main, 'mv+rm', sid);
  assert.equal(close(main, sid).code, 0);
  const rec = record(main, sid);
  assert.deepEqual(fmList(rec, 'files_renamed'), ['old name.txt -> new name.txt']);
  assert.deepEqual(fmList(rec, 'files_deleted'), ['gone.txt']);
  assert.deepEqual(fmList(rec, 'files_created'), ['new name.txt']);
});

T('close: refuses an empty body, a shell fence, too many learnings; and a passing outcome with a red or missing gate', () => {
  const main = mkRepo();
  const sid = start(main);
  writeFileSync(join(main, 'f.txt'), 'x\n');
  commit(main, 'w', sid);
  const base = ['close', '--outcome', 'passed', '--gate-cmd', 'node -e "process.exit(0)"'];
  assert.match(ses(main, [...base, '--body', '   ']).all, /body is empty/);
  assert.match(ses(main, [...base, '--body', '<!-- only a placeholder -->']).all, /body is empty/);
  assert.match(ses(main, [...base, '--body', 'x\n```bash\nrm -rf /\n```']).all, /fenced shell/);
  const six = '## Learnings\n' + Array.from({ length: 6 }, (_, i) => `- l${i}`).join('\n');
  assert.match(ses(main, [...base, '--body', six]).all, /limit is 5/);
  assert.match(ses(main, ['close', '--outcome', 'passed', '--body', 'done fine']).all, /gate/);
  const red = ses(main, ['close', '--outcome', 'passed', '--body', 'done', '--gate-cmd', 'node -e "process.exit(3)"']);
  assert.notEqual(red.code, 0);
  assert.match(red.all, /exited 3/);
  assert.ok(readFileSync(join(main, 'sessions', readdirSync(join(main, 'sessions'))[0]), 'utf8').includes('status: "open"'), 'a refused close leaves the record open');
  // red gate is recordable as failed, with the output tail, and the failure is a FACT
  const f = ses(main, ['close', '--outcome', 'failed', '--body', 'gate went red', '--gate-cmd', 'node -e "console.log(\'boom line\');process.exit(3)"']);
  assert.equal(f.code, 0, f.all);
  const rec = record(main, sid);
  assert.equal(fmVal(rec, 'gate_exit'), 3);
  assert.equal(fmVal(rec, 'outcome'), 'failed');
  assert.match(rec, /boom line/);
});

T('close: gate-broken and abandoned outcomes are recordable; abandoned tolerates a dirty tree', () => {
  const main = mkRepo();
  const sid = start(main);
  writeFileSync(join(main, 'wip.txt'), 'uncommitted\n');
  const r = ses(main, ['close', '--session', sid, '--outcome', 'abandoned', '--body', 'ran out of budget']);
  assert.equal(r.code, 0, r.all);
  assert.equal(fmVal(record(main, sid), 'dirty'), true);
  const main2 = mkRepo();
  const s2 = start(main2);
  const g = ses(main2, ['close', '--outcome', 'gate-broken', '--body', 'validate.mjs crashes on a clean tree', '--gate-cmd', 'node -e "process.exit(2)"']);
  assert.equal(g.code, 0, g.all);
  assert.equal(fmVal(record(main2, s2), 'outcome'), 'gate-broken');
});

// ── --no-verify / amend / forged / orphan ───────────────────────────────────────────────────────
T('--no-verify: a commit that skipped the trailer is caught at close (passed refused) and recorded when allowed', () => {
  const main = mkRepo();
  mkdirSync(join(main, '.git', 'hooks'), { recursive: true });
  writeFileSync(join(main, '.git', 'hooks', 'commit-msg'), '#!/bin/sh\ngrep -q "^Session:" "$1" || { echo "no trailer"; exit 1; }\n', { mode: 0o755 });
  const sid = start(main);
  writeFileSync(join(main, 'a.txt'), 'a\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'good', '-m', `Session: ${sid}`);
  writeFileSync(join(main, 'b.txt'), 'b\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'sneaky', '--no-verify');
  const r = close(main, sid);
  assert.notEqual(r.code, 0);
  assert.match(r.all, /no `Session: .*` trailer|carry no/);
  const ok = close(main, sid, 'passed', ['--allow-untrailed']);
  assert.equal(ok.code, 0, ok.all);
  assert.equal(fmVal(record(main, sid), 'untrailed_commits'), 1);
});

T('amend after close (real scenario): head rewritten with different content -> check FAILS', () => {
  const main = mkRepo();
  const sid = start(main);
  writeFileSync(join(main, 'a.txt'), 'a\n');
  commit(main, 'work', sid);
  writeFileSync(join(main, 'b.txt'), 'b\n');
  commit(main, 'work2', sid);
  assert.equal(close(main, sid).code, 0);
  assert.equal(ses(main, ['check']).code, 0, ses(main, ['check']).all);
  // work2 is HEAD~1 (the close commit is HEAD). Rewrite history underneath: rebase --onto dropping nothing, amending work2's content.
  git(main, 'checkout', '-q', '-b', 'rewrite', 'HEAD~1');
  writeFileSync(join(main, 'b.txt'), 'b changed after close\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-q', '--amend', '--no-verify', '-m', 'work2', '-m', `Session: ${sid}`);
  git(main, 'cherry-pick', 'main'); // re-apply the close commit (only touches sessions/)
  const r = ses(main, ['check']);
  assert.equal(r.code, 1, r.all);
  assert.match(r.all, /late-or-forged-commit|head-not-ancestor/);
  assert.match(r.all, /head-not-ancestor/);
});

T('a rebase keeps patch-ids: check only WARNS that hashes are stale', () => {
  const main = mkRepo();
  const wt = worktree(main, 'rb', 'task/rb');
  const sid = start(wt);
  writeFileSync(join(wt, 'a.txt'), 'a\n');
  commit(wt, 'work', sid);
  assert.equal(close(wt, sid).code, 0);
  writeFileSync(join(main, 'other.txt'), 'o\n'); // main moves on
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'main moved');
  git(wt, 'rebase', '-q', 'main');
  merge(main, 'task/rb');
  const r = ses(main, ['check']);
  assert.equal(r.code, 0, r.all);
  assert.match(r.all, /head-rewritten/);
});

T('orphan session: trailer commits without a record -> check fails; reap writes an abandoned stub; check then passes after merge', () => {
  const main = mkRepo();
  const wt = worktree(main, 'orph', 'task/orph');
  writeFileSync(join(wt, 'crash.txt'), 'x\n');
  commit(wt, 'crashed session work', 's-crashed-1');
  merge(main, 'task/orph');
  const bad = ses(main, ['check']);
  assert.equal(bad.code, 1);
  assert.match(bad.all, /orphan-session/);
  assert.match(bad.all, /s-crashed-1/);
  const dry = ses(main, ['reap', '--dry-run']);
  assert.match(dry.out, /orphan s-crashed-1/);
  assert.ok(!existsSync(join(main, 'sessions')));
  const r = ses(main, ['reap']);
  assert.equal(r.code, 0, r.all);
  const rec = record(main, 's-crashed-1');
  assert.equal(fmVal(rec, 'outcome'), 'abandoned');
  assert.equal(fmVal(rec, 'reaped'), true);
  assert.deepEqual(fmList(rec, 'files_created'), ['crash.txt']);
  assert.equal(ses(main, ['check']).code, 0, ses(main, ['check']).all);
  assert.match(ses(main, ['reap']).out, /no orphaned/);
});

T('reap finds an orphan that lives only on an unmerged branch, and does not stub one that has a record there', () => {
  const main = mkRepo();
  const wt = worktree(main, 'o2', 'task/o2');
  writeFileSync(join(wt, 'x.txt'), 'x\n');
  commit(wt, 'orphan', 's-orphan-2');
  const wt2 = worktree(main, 'ok', 'task/ok');
  const sid = start(wt2);
  writeFileSync(join(wt2, 'y.txt'), 'y\n');
  commit(wt2, 'fine', sid);
  const r = ses(main, ['reap', '--dry-run']);
  assert.match(r.out, /s-orphan-2/);
  assert.ok(!r.out.includes(sid), 'a session whose record exists on its own branch is not an orphan');
});

T('forged trailer: a commit claiming a CLOSED session after the fact is flagged; a fake session id is an orphan', () => {
  const main = mkRepo();
  const sid = start(main);
  writeFileSync(join(main, 'a.txt'), 'a\n');
  commit(main, 'work', sid);
  assert.equal(close(main, sid).code, 0);
  writeFileSync(join(main, 'evil.txt'), 'attributed to someone else\n');
  commit(main, 'smuggled', sid);
  let r = ses(main, ['check']);
  assert.equal(r.code, 1, r.all);
  assert.match(r.all, /late-or-forged-commit/);
  writeFileSync(join(main, 'fake.txt'), 'f\n');
  commit(main, 'fake', 's-fake');
  r = ses(main, ['check']);
  assert.match(r.all, /orphan-session[^\n]*s-fake/);
});

T('check: an open record is a WARN by default and a FAIL under --strict (merge-time)', () => {
  const main = mkRepo();
  const wtB = worktree(main, 'fb', 'task/fb');
  const b = start(wtB, 'TB');
  writeFileSync(join(wtB, 'x.txt'), 'x\n');
  commit(wtB, 'w', b);
  merge(main, 'task/fb'); // merged while still open
  const lenient = ses(main, ['check']);
  assert.equal(lenient.code, 0, lenient.all);
  assert.match(lenient.all, /WARN \[open-record\]/);
  assert.equal(ses(main, ['check', '--strict']).code, 1);
});

T('check: a commit of session B that edits the record of session A is FLAGGED (foreign-record-edit)', () => {
  const main = mkRepo();
  const a = start(main, 'TA');
  assert.equal(ses(main, ['close', '--outcome', 'abandoned', '--body', 'parked']).code, 0);
  const wtB = worktree(main, 'fb2', 'task/fb2');
  const b = start(wtB, 'TB');
  const recA = readdirSync(join(wtB, 'sessions')).find((f) => f.includes(a));
  appendFileSync(join(wtB, 'sessions', recA), '\nsneaky edit of another session\n');
  commit(wtB, 'edit a record', b);
  assert.equal(close(wtB, b).code, 0);
  const r = ses(wtB, ['check']);
  assert.equal(r.code, 3, r.all);
  assert.match(r.all, /FLAG \[foreign-record-edit\]/);
});

// ── claims ──────────────────────────────────────────────────────────────────────────────────────
T('claims: next allocates distinct numbers across worktrees and parallel processes; explicit duplicates are refused', async () => {
  const main = mkRepo();
  mkdirSync(join(main, 'supabase', 'migrations'), { recursive: true });
  writeFileSync(join(main, 'supabase', 'migrations', '0036_prev.sql'), '-- x\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'mig');
  const wtA = worktree(main, 'ca', 'task/ca');
  const wtB = worktree(main, 'cb', 'task/cb');
  const a = ses(wtA, ['claim', 'migration-number:next']);
  const b = ses(wtB, ['claim', 'migration-number:next']);
  assert.equal(a.out.trim(), '0037');
  assert.equal(b.out.trim(), '0038', 'the second worktree must see the first one\'s claim (claims live in the MAIN worktree)');
  assert.ok(existsSync(join(main, 'sessions', 'claims', 'migration-number', '0037')));
  const dup = ses(wtB, ['claim', 'migration-number:0037']);
  assert.equal(dup.code, 1);
  assert.match(dup.all, /ALREADY HELD/);
  // parallel allocation: every process wins a distinct number
  const procs = Array.from({ length: 6 }, () => new Promise((res) => {
    import('node:child_process').then(({ execFile }) => execFile(process.execPath, [join(main, 'scripts', 'session.mjs'), 'claim', 'decision-number:next', '--width', '3'], { cwd: main, env: ENV }, (e, out) => res(out.trim())));
  }));
  const got = await Promise.all(procs);
  assert.equal(new Set(got).size, 6, `parallel claims collided: ${got}`);
  // db claim, idempotent for the owner, release
  const sid = start(wtA);
  assert.equal(ses(wtA, ['claim', 'db:supabase-live']).code, 0);
  assert.match(ses(wtA, ['claim', 'db:supabase-live']).out, /already yours/);
  assert.equal(ses(wtB, ['claim', 'db:supabase-live']).code, 1);
  assert.equal(ses(wtA, ['claim', 'db:supabase-live', '--release']).code, 0);
  assert.equal(ses(wtB, ['claim', 'db:supabase-live']).code, 0);
  void sid;
});

T('claims: path traversal and bad namespaces are rejected', () => {
  const main = mkRepo();
  assert.notEqual(ses(main, ['claim', 'db:../../etc']).code, 0);
  assert.notEqual(ses(main, ['claim', 'DB:x']).code, 0);
  assert.notEqual(ses(main, ['claim', 'nocolon']).code, 0);
  assert.ok(!existsSync(join(main, 'etc')));
});

T('the duplicate-0037 migration collision is caught by check even when claims were skipped', () => {
  const main = mkRepo();
  mkdirSync(join(main, 'supabase', 'migrations'), { recursive: true });
  writeFileSync(join(main, 'supabase', 'migrations', '0036_prev.sql'), '-- x\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'mig');
  const wtA = worktree(main, 'ma', 'task/ma');
  const wtB = worktree(main, 'mb', 'task/mb');
  const a = start(wtA, 'TA');
  const b = start(wtB, 'TB');
  writeFileSync(join(wtA, 'supabase', 'migrations', '0037_a_status.sql'), 'alter table a add column s int;\n');
  commit(wtA, 'mig a', a);
  writeFileSync(join(wtB, 'supabase', 'migrations', '0037_b_other.sql'), 'alter table a add column s int;\n');
  commit(wtB, 'mig b', b);
  assert.equal(close(wtA, a).code, 0);
  assert.equal(close(wtB, b).code, 0);
  merge(main, 'task/ma');
  assert.equal(ses(main, ['check']).code, 0);
  merge(main, 'task/mb'); // git merges cleanly: different file names
  const r = ses(main, ['check']);
  assert.equal(r.code, 1, r.all);
  assert.match(r.all, /duplicate-migration-number/);
  assert.match(r.all, /0037_a_status\.sql/);
  assert.match(r.all, /0037_b_other\.sql/);
});

T('duplicate decision id (merge=union style) is caught by check, with line numbers', () => {
  const main = mkRepo();
  writeFileSync(join(main, 'BUILDER-DECISIONS-REVIEW.md'), '# log\n\n### Decision 98 — one\n\ntext\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'log');
  const wtA = worktree(main, 'da', 'task/da');
  const wtB = worktree(main, 'db', 'task/db');
  appendFileSync(join(wtA, 'BUILDER-DECISIONS-REVIEW.md'), '\n### Decision 99 — cache strategy\n\na\n');
  git(wtA, 'add', '-A');
  git(wtA, 'commit', '-qm', 'A');
  writeFileSync(join(wtB, '.gitattributes'), 'BUILDER-DECISIONS-REVIEW.md merge=union\n');
  appendFileSync(join(wtB, 'BUILDER-DECISIONS-REVIEW.md'), '\n### Decision 99 — auth flow\n\nb\n');
  git(wtB, 'add', '-A');
  git(wtB, 'commit', '-qm', 'B');
  merge(main, 'task/da');
  writeFileSync(join(main, '.gitattributes'), 'BUILDER-DECISIONS-REVIEW.md merge=union\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'attrs');
  merge(main, 'task/db'); // union merge: clean, two Decision 99 headings
  const r = ses(main, ['check']);
  assert.equal(r.code, 1, r.all);
  assert.match(r.all, /duplicate-decision-number/);
  assert.match(r.all, /decision-number 99 is used 2 times/);
});

// ── gate code flag, checker-from-base ───────────────────────────────────────────────────────────
T('a diff that touches gate code (or another session\'s record) is FLAGGED for human merge (exit 3), naming the base-copy command', () => {
  const main = mkRepo();
  mkdirSync(join(main, 'scripts'), { recursive: true });
  writeFileSync(join(main, 'scripts', 'validate.mjs'), '// gate\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'gate');
  const wt = worktree(main, 'g', 'task/g');
  const sid = start(wt);
  writeFileSync(join(wt, 'scripts', 'validate.mjs'), '// gate\nprocess.exit(0)\n');
  appendFileSync(join(wt, 'scripts', 'session.mjs'), '\n// edited on the branch under test\n');
  commit(wt, 'weaken the gate', sid);
  assert.equal(close(wt, sid).code, 0);
  const r = ses(wt, ['check', '--base', 'main']);
  assert.equal(r.code, 3, r.all);
  assert.match(r.all, /FLAG \[gate-code-changed\][^\n]*scripts\/validate\.mjs/);
  assert.match(r.all, /checker-changed/);
  assert.match(r.all, /git show main:scripts\/session\.mjs/);
});

// ── secrets ─────────────────────────────────────────────────────────────────────────────────────
T('close REFUSES on a scanner hit and writes nothing (stub scanner)', () => {
  const main = mkRepo('stub');
  const sid = start(main);
  writeFileSync(join(main, 'f.txt'), 'x\n');
  commit(main, 'w', sid);
  void record;
  const main2 = mkRepo('stub');
  const s2 = start(main2);
  writeFileSync(join(main2, 'f.txt'), 'x\n');
  commit(main2, 'w', s2);
  const bad = ses(main2, ['close', '--outcome', 'abandoned', '--body', 'line one\nthe value is FAKE-SECRET-XYZ ok']);
  assert.notEqual(bad.code, 0);
  assert.match(bad.all, /secret scanner refused/);
  assert.match(bad.all, /stub-secret/);
  assert.ok(!bad.all.includes('FAKE-SECRET-XYZ'), 'the value must never be echoed');
  assert.match(record(main2, s2), /status: "open"/);
  assert.equal(close(main2, s2).code, 0); // a clean body passes the stub
});

T('close REFUSES on a real provider-shaped key via the real scan-secrets.mjs (invented AWS docs example id)', () => {
  const main = mkRepo('real');
  const sid = start(main);
  writeFileSync(join(main, 'f.txt'), 'x\n');
  commit(main, 'w', sid);
  const r = ses(main, ['close', '--outcome', 'abandoned', '--body', 'notes: AKIAIOSFODNN7EXAMPLE was in the log']);
  assert.notEqual(r.code, 0, r.all);
  assert.match(r.all, /refused/);
  assert.ok(!r.all.includes('AKIAIOSFODNN7EXAMPLE'));
});

T('close WARNS clearly and continues when scan-secrets.mjs is absent', () => {
  const main = mkRepo('none');
  const sid = start(main);
  writeFileSync(join(main, 'f.txt'), 'x\n');
  commit(main, 'w', sid);
  const r = close(main, sid);
  assert.equal(r.code, 0, r.all);
  assert.match(r.err, /WARN: scan-secrets\.mjs not found/);
});

// ── citation completeness / canary / ack ────────────────────────────────────────────────────────
T('check --cited-in: delimiter-safe ids (s-A-10 does not make s-A-1 cited), anchored rows, thin and copied rows, canary', async () => {
  const { checkCited } = await import(new URL('../session.mjs', import.meta.url).href);
  const text = [
    '| session | why |', '|---|---|',
    '| s-A-10 | migrated the orders table to the new schema and updated callers |',
    '| s-A-2 | wrote the importer for the legacy file format with tests |',
  ].join('\n');
  const issues = checkCited(text, ['s-A-1', 's-A-10', 's-A-2']);
  assert.deepEqual(issues.map((i) => `${i.kind}:${i.sid}`), ['missing:s-A-1']);
  // a bare mention (an appendix listing all ids) is not a citation
  const appendix = 'Sessions: s-A-1 s-A-10 s-A-2\n';
  assert.equal(checkCited(appendix, ['s-A-1', 's-A-10', 's-A-2']).filter((i) => i.kind === 'missing').length, 3);
  // thin and copied
  const thin = '| s-A-1 | ok |\n| s-A-2 | the very same sentence for both rows here |\n| s-A-3 | the very same sentence for both rows here |\n';
  const k = checkCited(thin, ['s-A-1', 's-A-2', 's-A-3']).map((i) => i.kind);
  assert.ok(k.includes('thin') && k.includes('copied'));
  // anchor comments
  const anchored = '<!-- session:s-B-1 -->\nrefactored the parser so errors carry line numbers\n\n<!-- session:s-B-9 -->\nsomething else entirely about the cache\n';
  assert.deepEqual(checkCited(anchored, ['s-B-1']).map((i) => i.kind), ['extra']);
  // canary
  const c = checkCited(`| s-C-1 | long enough text about the work done here |\n| s-canary-1 | long enough text about the canary session |\n`, ['s-C-1'], { canarySid: 's-canary-1', canaryToken: 'tok123' });
  assert.deepEqual(c.map((i) => i.kind), ['canary']);
});

T('check --cited-in over a real repo, with index --canary', () => {
  const main = mkRepo();
  const sid = start(main);
  writeFileSync(join(main, 'f.txt'), 'x\n');
  commit(main, 'w', sid);
  assert.equal(close(main, sid).code, 0);
  const idx = JSON.parse(ses(main, ['index', '--canary']).out);
  assert.ok(idx.canary.sid.startsWith('s-canary-') && idx.sessions[idx.canary.sid]);
  const doc = join(TMP, `changelog${++counter}.md`);
  writeFileSync(doc, `| ${sid} | rendered the f.txt addition for the changelog |\n| ${idx.canary.sid} | canary ${idx.canary.token} was read from the index |\n`);
  const ok = ses(main, ['check', '--cited-in', doc, '--canary-sid', idx.canary.sid, '--canary-token', idx.canary.token]);
  assert.equal(ok.code, 0, ok.all);
  writeFileSync(doc, `| ${sid} | rendered the f.txt addition for the changelog |\n`);
  const bad = ses(main, ['check', '--cited-in', doc, '--canary-sid', idx.canary.sid, '--canary-token', idx.canary.token]);
  assert.equal(bad.code, 1);
  assert.match(bad.all, /cited-missing|cited-canary/);
});

T('ack: three repo-derived questions; wrong answers fail, derived answers pass and are recorded', () => {
  const main = mkRepo();
  const sid = start(main);
  const q = ses(main, ['ack']);
  assert.equal(q.code, 0, q.all);
  const qs = q.out.split('\n').filter((l) => /^\s+\d\. /.test(l));
  assert.equal(qs.length, 3);
  const tracked = git(main, 'ls-files').split('\n');
  const answerFor = (text) => {
    if (/newest session record/.test(text)) return sid;
    if (/status open/.test(text)) return '1';
    if (/root \(first\) commit/.test(text)) return git(main, 'rev-list', '--max-parents=0', 'HEAD').slice(0, 7);
    if (/\.mjs/.test(text)) return String(tracked.filter((p) => p.endsWith('.mjs')).length);
    if (/top-level directories/.test(text)) return String(new Set(tracked.filter((p) => p.includes('/')).map((p) => p.split('/')[0])).size);
    throw new Error('unexpected question: ' + text);
  };
  const right = qs.map(answerFor).join('|');
  assert.equal(ses(main, ['ack', '--answers', 'x|y|z']).code, 1);
  const good = ses(main, ['ack', '--answers', right]);
  assert.equal(good.code, 0, good.all + '\n' + right);
  assert.match(readFileSync(join(main, 'sessions', readdirSync(join(main, 'sessions'))[0]), 'utf8'), /ack: "passed"/);
});

// ── unit-level ──────────────────────────────────────────────────────────────────────────────────
T('front matter round-trips awkward strings; config scanner finds non-boolean values; glob matcher', async () => {
  const m = await import(new URL('../session.mjs', import.meta.url).href);
  const obj = { id: 'x', model: 'openrouter/x:high "q"', list: ['a b', 'c: d'], n: 3, t: true, z: null, e: [] };
  const back = m.parseFrontMatter(m.writeFrontMatter(obj) + '\n\nbody\n');
  assert.deepEqual(back.fm, obj);
  assert.equal(back.body.trim(), 'body');
  assert.deepEqual(m.scanConfigText('[core]\n\tfilemode = core.autocrlf\n\tbare = false\n\tautocrlf = input\n[extensions]\n\trelativeWorktrees = true\n').map((b) => b.key), ['core.filemode']);
  assert.ok(m.globMatch('dist*/', 'dist-storybook/index.html'));
  assert.ok(m.globMatch('*.min.*', 'public/app.min.js'));
  assert.ok(m.globMatch('docs/SCHEMA.md', 'docs/schema.md'));
  assert.ok(!m.globMatch('docs/SCHEMA.md', 'other/docs/SCHEMA.md'));
  assert.ok(m.globMatch('package-lock.json', 'web/package-lock.json'));
});

T('usage: unknown subcommand exits 2; missing git would be reported (not tested here); help works', () => {
  const main = mkRepo();
  assert.equal(ses(main, ['bogus']).code, 2);
  assert.equal(ses(main, ['help']).code, 0);
  assert.equal(ses(main, ['close', '--outcome', 'nope', '--body', 'x']).code, 2);
});
