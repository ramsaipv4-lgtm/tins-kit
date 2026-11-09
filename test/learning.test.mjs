// Learning loop: a lesson learned in project A is retrieved by a brand-new project C,
// but only after export, central import and human-attributed promotion.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { centralKit, cleanup, kit, project, tmp, vkit, write } from './helpers.mjs';

const LESSON = ['--title', 'Debounce search input', '--solves', 'Search-as-you-type floods the backend with one request per keystroke',
  '--triggers', 'search as you type, debounce, autocomplete, keystroke', '--not-when', 'The search runs entirely in memory on the client',
  '--evidence', 'SPEC.md#D-1', '--body', 'Wait 250 ms after the last keystroke; cancel the in-flight request when a new one starts.', '--license', 'MIT'];

function learnIn(dir, id = 'debounce-search') {
  assert.equal(vkit(dir, ['start', '--query', 'record what we learned about search input load']).code, 0);
  const l = vkit(dir, ['learn', id, ...LESSON]);
  assert.equal(l.code, 0, l.out);
  const c = vkit(dir, ['close', '--note', 'lesson recorded']);
  assert.equal(c.code, 0, c.out);
}

const dirs = [];
after(() => cleanup(...dirs));

test('a learned lesson is immediately recallable in its own project, as local evidence', () => {
  const P = project('learn'); dirs.push(P.parent);
  learnIn(P.dir);
  const r = JSON.parse(vkit(P.dir, ['recall', 'autocomplete search as you type is slow', '--json']).out);
  const hit = r.results.find((x) => x.id === 'local:debounce-search');
  assert.ok(hit, JSON.stringify(r.results.map((x) => x.id)));
  assert.equal(hit.status, 'candidate');
  assert.equal(hit.kind, 'local-lesson');
});

test('a lesson needs real evidence, and a consumer cannot promote its own lesson', () => {
  const P = project('noprom'); dirs.push(P.parent);
  assert.equal(vkit(P.dir, ['start', '--query', 'record a lesson about search load']).code, 0);
  const bad = vkit(P.dir, ['learn', 'x-lesson', ...LESSON.map((a) => (a === 'SPEC.md#D-1' ? 'SPEC.md#D-999' : a))]);
  assert.notEqual(bad.code, 0); assert.match(bad.out, /anchor D-999 is absent/);
  const p = vkit(P.dir, ['knowledge', 'promote', 'whatever', 'debounce-search', '--reviewed-by', 'me', '--license', 'MIT']);
  assert.notEqual(p.code, 0); assert.match(p.out, /canonical tins-kit source repository|consumer projects cannot promote/);
});

test('export refuses a candidate containing a secret', () => {
  const P = project('secret'); dirs.push(P.parent);
  const fake = ['ghp', '_', 'A'.repeat(18), 'b'.repeat(18)].join(''); // built at runtime: no literal secret in this file
  write(P.dir, 'knowledge/candidates/leaky.md', `---\nid: leaky\nsolves: x\ntriggers: y\nstatus: candidate\n---\ntoken ${fake}\n`);
  const out = join(tmp('bundle'), 'b'); dirs.push(out);
  const e = vkit(P.dir, ['knowledge', 'export', '--out', out]);
  assert.notEqual(e.code, 0); assert.match(e.out, /secret scan refused/);
});

test('cross-project loop: two consumers -> central review -> a NEW project recalls it as active', () => {
  const C = centralKit(); dirs.push(C);
  const ckit = (args) => kit(C, args, C);
  const A = project('consumer-a', C); const B = project('consumer-b', C); dirs.push(A.parent, B.parent);
  learnIn(A.dir); learnIn(B.dir);
  const bundles = tmp('bundles'); dirs.push(bundles);
  for (const [P, name] of [[A, 'a'], [B, 'b']]) {
    const e = vkit(P.dir, ['knowledge', 'export', '--out', join(bundles, name)]);
    assert.equal(e.code, 0, e.out);
  }
  const ia = ckit(['knowledge', 'import', join(bundles, 'a')]); assert.equal(ia.code, 0, ia.out);
  const ib = ckit(['knowledge', 'import', join(bundles, 'b')]); assert.equal(ib.code, 0, ib.out);
  const inboxA = ia.out.match(/inbox\/([a-z0-9-]+)/)[1]; const inboxB = ib.out.match(/inbox\/([a-z0-9-]+)/)[1];
  const tooEarly = ckit(['knowledge', 'promote', inboxA, 'debounce-search', '--reviewed-by', 'owner', '--license', 'MIT', '--activate']);
  assert.notEqual(tooEarly.code, 0, 'one consumer is not enough for active'); assert.match(tooEarly.out, /two independent consumer root commits/);
  assert.equal(ckit(['knowledge', 'promote', inboxA, 'debounce-search', '--reviewed-by', 'owner', '--license', 'MIT']).code, 0);
  const act = ckit(['knowledge', 'promote', inboxB, 'debounce-search', '--reviewed-by', 'owner', '--license', 'MIT', '--activate']);
  assert.equal(act.code, 0, act.out); assert.match(act.out, /\[active\]/);
  assert.equal(ckit(['version', '--write']).code, 0);
  const lint = ckit(['lint-kit']); assert.equal(lint.code, 0, lint.out);
  const N = project('new-project', C); dirs.push(N.parent);
  const r = JSON.parse(vkit(N.dir, ['recall', 'autocomplete search as you type hammers the server', '--json']).out);
  const hit = r.results.find((x) => x.id === 'knowledge:debounce-search');
  assert.ok(hit, JSON.stringify(r.results.map((x) => x.id)));
  assert.equal(hit.status, 'active');
  assert.match(hit.source, /^\.tins\/kit\/knowledge\/debounce-search\.md#/);
  assert.match(hit.not_when, /in memory on the client/);
});
