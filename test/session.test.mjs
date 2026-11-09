// Enforcement: recall is committed BEFORE work, cannot be skipped, back-dated or edited, and is
// re-verified at merge time from git alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { behaviourChange, cleanup, git, project, read, vkit, write } from './helpers.mjs';

const root = (dir) => git(dir, 'rev-list', '--max-parents=0', 'HEAD');
const startFile = (dir) => readdirSync(join(dir, 'sessions')).find((f) => f.endsWith('.start.md'));

test('a new project is knowledge-enforced from its first commit', () => {
  const P = project('fresh');
  try {
    assert.equal(JSON.parse(read(P.dir, 'tins.json')).knowledge.required, true);
    const d = vkit(P.dir, ['doctor']);
    assert.equal(d.code, 0, d.out);
    assert.match(d.out, /knowledge: enforced/);
  } finally { cleanup(P.parent); }
});

test('happy path: start commits recall before work, close records it, check replays it', () => {
  const P = project('happy');
  try {
    const s = vkit(P.dir, ['start', '--query', 'add a shout helper that capitalises names']);
    assert.equal(s.code, 0, s.out);
    assert.match(s.out, /recall: add a shout helper/);
    assert.match(git(P.dir, 'log', '-1', '--format=%s'), /^tins: start session /);
    behaviourChange(P.dir, 2);
    const c = vkit(P.dir, ['close', '--note', 'reused nothing; no money or ledger work']);
    assert.equal(c.code, 0, c.out);
    const rec = readdirSync(join(P.dir, 'sessions')).find((f) => f.endsWith('.md') && !f.endsWith('.start.md'));
    assert.match(read(P.dir, `sessions/${rec}`), /^receipt_hash: [0-9a-f]{64}$/m);
    const k = vkit(P.dir, ['check', '--base', root(P.dir)]);
    assert.equal(k.code, 0, k.out);
  } finally { cleanup(P.parent); }
});

test('close without a start is refused (no retroactive recall)', () => {
  const P = project('nostart');
  try {
    behaviourChange(P.dir, 2);
    const c = vkit(P.dir, ['close']);
    assert.notEqual(c.code, 0);
    assert.match(c.out, /no open pre-work recall session/);
  } finally { cleanup(P.parent); }
});

test('start on a dirty tree is refused: recall must precede the work', () => {
  const P = project('dirty');
  try {
    write(P.dir, 'src/early.mjs', 'export const early = 1;\n');
    const s = vkit(P.dir, ['start', '--query', 'add an early helper module']);
    assert.notEqual(s.code, 0);
    assert.match(s.out, /clean worktree before work/);
  } finally { cleanup(P.parent); }
});

test('the gate refuses uncommitted work that has no recall session', () => {
  const P = project('gate');
  try {
    write(P.dir, 'src/sneaky.mjs', 'export const x = 1;\n');
    const g = vkit(P.dir, ['gate']);
    assert.notEqual(g.code, 0);
    assert.match(g.out, /no pre-work recall session/);
  } finally { cleanup(P.parent); }
});

test('work committed before the start (outside any session) fails the merge check', () => {
  const P = project('before');
  try {
    behaviourChange(P.dir, 2);
    git(P.dir, 'add', '-A'); git(P.dir, 'commit', '-q', '-m', 'work done without recall');
    assert.equal(vkit(P.dir, ['start', '--query', 'document the shout helper afterwards']).code, 0);
    write(P.dir, 'docs/shout.md', '# shout\n');
    assert.equal(vkit(P.dir, ['close']).code, 0);
    const k = vkit(P.dir, ['check', '--base', root(P.dir)]);
    assert.notEqual(k.code, 0);
    assert.match(k.out, /needs exactly one Session trailer/);
  } finally { cleanup(P.parent); }
});

test('editing the committed recall record makes close refuse', () => {
  const P = project('edit');
  try {
    assert.equal(vkit(P.dir, ['start', '--query', 'add a shout helper that capitalises names']).code, 0);
    const f = `sessions/${startFile(P.dir)}`;
    write(P.dir, f, read(P.dir, f).replace('Retrieved text below', 'Nothing relevant was found; retrieved text below'));
    behaviourChange(P.dir, 2);
    const c = vkit(P.dir, ['close']);
    assert.notEqual(c.code, 0);
    assert.match(c.out, /refusing to certify/);
  } finally { cleanup(P.parent); }
});

test('a forged start commit (doctored evidence, same trailers) fails the merge check', () => {
  const P = project('forge');
  try {
    const base = git(P.dir, 'rev-parse', 'HEAD');
    assert.equal(vkit(P.dir, ['start', '--query', 'store money amounts as integer cents']).code, 0);
    behaviourChange(P.dir, 2);
    assert.equal(vkit(P.dir, ['close']).code, 0);
    const [startC, ...rest] = git(P.dir, 'rev-list', '--reverse', `${base}..HEAD`).split('\n');
    const f = `sessions/${startFile(P.dir)}`;
    // rebuild history with a start record whose evidence was quietly removed
    git(P.dir, 'checkout', '-q', '-b', 'forged', base);
    const original = git(P.dir, 'show', `${startC}:${f}`);
    write(P.dir, f, original.replace(/NOT WHEN:[^\n]*\n/g, '') + '\n');
    write(P.dir, '.git/forged-msg', git(P.dir, 'log', '-1', '--format=%B', startC) + '\n');
    git(P.dir, 'add', f); git(P.dir, 'commit', '-q', '-F', '.git/forged-msg');
    for (const c of rest) git(P.dir, 'cherry-pick', '--allow-empty', c);
    const k = vkit(P.dir, ['check', '--base', base]);
    assert.notEqual(k.code, 0, k.out);
    assert.match(k.out, /evidence packet differs|listed results differ|close record points to the wrong recall start/);
  } finally { cleanup(P.parent); }
});

test('abort records an abandoned recall-only session that still passes the check', () => {
  const P = project('abort');
  try {
    assert.equal(vkit(P.dir, ['start', '--query', 'investigate a report about slow names']).code, 0);
    const a = vkit(P.dir, ['abort']);
    assert.equal(a.code, 0, a.out);
    assert.match(a.out, /abandoned session/);
    const k = vkit(P.dir, ['check', '--base', root(P.dir)]);
    assert.equal(k.code, 0, k.out);
  } finally { cleanup(P.parent); }
});

test('switching enforcement off inside the checked range is flagged', () => {
  const P = project('disable');
  try {
    const cfg = JSON.parse(read(P.dir, 'tins.json')); cfg.knowledge.required = false;
    write(P.dir, 'tins.json', JSON.stringify(cfg, null, 2) + '\n');
    git(P.dir, 'add', '-A'); git(P.dir, 'commit', '-q', '-m', 'quietly disable knowledge');
    const k = vkit(P.dir, ['check', '--base', root(P.dir)]);
    assert.notEqual(k.code, 0);
    assert.match(k.out, /enforcement was disabled/);
  } finally { cleanup(P.parent); }
});

test('legacy projects keep working until enabled; enable sets a cutover that exempts only old history', () => {
  const P = project('legacy');
  try {
    // simulate a project vendored by an older kit: enforcement absent
    const cfg = JSON.parse(read(P.dir, 'tins.json')); delete cfg.knowledge;
    write(P.dir, 'tins.json', JSON.stringify(cfg, null, 2) + '\n');
    git(P.dir, 'add', '-A'); git(P.dir, 'commit', '-q', '--amend', '--no-edit');
    const legacyBase = git(P.dir, 'rev-parse', 'HEAD');
    behaviourChange(P.dir, 2);
    assert.equal(vkit(P.dir, ['close']).code, 0, 'legacy close self-starts as before');
    const e = vkit(P.dir, ['knowledge', 'enable']);
    assert.equal(e.code, 0, e.out);
    assert.equal(vkit(P.dir, ['close']).code, 1, 'after enable, close needs a start');
    assert.equal(vkit(P.dir, ['start', '--query', 'add a whisper helper in lower case']).code, 0);
    behaviourChange(P.dir, 3, 'whisper returns the name in capitals too');
    assert.equal(vkit(P.dir, ['close']).code, 0);
    const k = vkit(P.dir, ['check', '--base', legacyBase]);
    assert.equal(k.code, 0, k.out);
    assert.ok(JSON.parse(readFileSync(join(P.dir, 'tins.json'), 'utf8')).knowledge.cutover);
  } finally { cleanup(P.parent); }
});
