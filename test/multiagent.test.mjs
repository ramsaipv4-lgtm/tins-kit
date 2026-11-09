// Several agents on one project: one task = one branch + one worktree + one scope, each with its
// own committed recall; the reconciler re-verifies every session and gates the merged tree.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { cleanup, git, project, read, vkit, write } from './helpers.mjs';

const dirs = [];
after(() => cleanup(...dirs));

/** Planner (spec first): rows + todo acceptance tests for two independent features, in one recorded session. */
function plan(dir) {
  assert.equal(vkit(dir, ['start', '--query', 'plan shout and whisper helpers as two parallel tasks']).code, 0);
  const spec = read(dir, 'SPEC.md')
    .replace('\n\n## Acceptance', '\n| D-2 | shout returns the name in capitals | locked | planned |\n| D-3 | whisper returns the name in lower case | locked | planned |\n\n## Acceptance')
    .replace('\n\n## Out of scope', '\n| AC-2 | test/shout.test.mjs | shout capitalises |\n| AC-3 | test/whisper.test.mjs | whisper lowers |\n\n## Out of scope');
  write(dir, 'SPEC.md', spec);
  for (const [ac, name] of [['AC-2', 'shout'], ['AC-3', 'whisper']]) {
    write(dir, `test/${name}.test.mjs`, `// ${ac}\nimport { test } from 'node:test';\ntest.todo('${ac}: ${name}');\n`);
  }
  const c = vkit(dir, ['close', '--note', 'planned D-2/D-3 for two parallel workers']); assert.equal(c.code, 0, c.out);
}

function implement(wt, name, expr) {
  write(wt, `src/${name}.mjs`, `export const ${name} = (s) => String(s)${expr};\n`);
  write(wt, `test/${name}.test.mjs`, `// ${name === 'shout' ? 'AC-2' : 'AC-3'}\nimport { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { ${name} } from '../src/${name}.mjs';\ntest('${name}', () => assert.equal(typeof ${name}('Ab'), 'string'));\n`);
}

test('two agents in two worktrees build in parallel; merge re-verifies each and the merged tree', () => {
  const P = project('team'); dirs.push(P.parent);
  const base = git(P.dir, 'rev-list', '--max-parents=0', 'HEAD');
  plan(P.dir);
  const a = vkit(P.dir, ['task', 'new', 'shout', '--paths', 'src/shout.mjs,test/shout.test.mjs', '-m', 'Implement D-2 shout helper (AC-2)']);
  assert.equal(a.code, 0, a.out);
  const b = vkit(P.dir, ['task', 'new', 'whisper', '--paths', 'src/whisper.mjs,test/whisper.test.mjs', '-m', 'Implement D-3 whisper helper (AC-3)']);
  assert.equal(b.code, 0, b.out);
  const wtA = a.out.match(/worktree (.+)$/m)[1].trim(); const wtB = b.out.match(/worktree (.+)$/m)[1].trim();
  dirs.push(join(P.parent, 'team.worktrees'));

  // each agent, in its own worktree, possibly a different model: start (recall) -> work -> close
  assert.equal(vkit(wtA, ['start', '--task', 'shout', '--model', 'model-a']).code, 0);
  assert.equal(vkit(wtB, ['start', '--task', 'whisper', '--model', 'model-b']).code, 0);
  implement(wtA, 'shout', '.toUpperCase()'); implement(wtB, 'whisper', '.toLowerCase()');
  const ca = vkit(wtA, ['close', '--why', 'implements the planned D-2/AC-2 rows']); assert.equal(ca.code, 0, ca.out);
  const cb = vkit(wtB, ['close', '--why', 'implements the planned D-3/AC-3 rows']); assert.equal(cb.code, 0, cb.out);

  const ma = vkit(P.dir, ['merge', 'shout']); assert.equal(ma.code, 0, ma.out);
  const mb = vkit(P.dir, ['merge', 'whisper']); assert.equal(mb.code, 0, mb.out);
  const k = vkit(P.dir, ['check', '--base', base]);
  assert.equal(k.code, 0, k.out);
  assert.match(k.out, /check: PASS \(3 session/);
});

test('a worker that strays outside its task scope is refused at close', () => {
  const P = project('stray'); dirs.push(P.parent);
  plan(P.dir);
  const a = vkit(P.dir, ['task', 'new', 'shout', '--paths', 'src/shout.mjs,test/shout.test.mjs', '-m', 'Implement D-2 shout helper']);
  const wt = a.out.match(/worktree (.+)$/m)[1].trim(); dirs.push(join(P.parent, 'stray.worktrees'));
  assert.equal(vkit(wt, ['start', '--task', 'shout']).code, 0);
  implement(wt, 'shout', '.toUpperCase()');
  write(wt, 'src/whisper.mjs', 'export const whisper = 1;\n');
  const c = vkit(wt, ['close', '--why', 'implements D-2']);
  assert.notEqual(c.code, 0); assert.match(c.out, /scope: src\/whisper\.mjs is outside/);
});

test('overlapping parallel tasks are refused unless explicitly allowed', () => {
  const P = project('overlap'); dirs.push(P.parent, join(P.parent, 'overlap.worktrees'));
  assert.equal(vkit(P.dir, ['task', 'new', 'one', '--paths', 'src', '-m', 'first task on src']).code, 0);
  const two = vkit(P.dir, ['task', 'new', 'two', '--paths', 'src/x.mjs', '-m', 'second task on src']);
  assert.notEqual(two.code, 0); assert.match(two.out, /overlap/);
});

test('relay (chat-only model): the packet carries the committed recall; apply without that packet is refused', () => {
  const P = project('relay'); dirs.push(P.parent, join(P.parent, 'relay.worktrees'));
  const t = vkit(P.dir, ['task', 'new', 'notes', '--paths', 'docs/notes.md', '-m', 'Write docs/notes.md explaining money as integer cents']);
  const wt = t.out.match(/worktree (.+)$/m)[1].trim();
  write(P.parent, 'reply.txt', '=== FILE: docs/notes.md ===\n# Notes\nMoney is integer cents.\n=== END FILE ===\n=== NOTES ===\nreused pattern:money-minor-units\n=== END NOTES ===\n');
  const early = vkit(wt, ['apply', 'notes', join(P.parent, 'reply.txt')]);
  assert.notEqual(early.code, 0); assert.match(early.out, /bound to a packet/);
  const pk = vkit(wt, ['packet', 'notes']);
  assert.equal(pk.code, 0, pk.out);
  assert.match(pk.out, /## PRE-WORK RECALL \(committed [0-9a-f]{40}/);
  assert.match(pk.out, /pattern:money-minor-units/);
  const ap = vkit(wt, ['apply', 'notes', join(P.parent, 'reply.txt')]);
  assert.equal(ap.code, 0, ap.out);
});
