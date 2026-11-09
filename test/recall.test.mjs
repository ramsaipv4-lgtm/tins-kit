// Retrieval: cited, deterministic, honest about zero hits, whole-word matching, measurable.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { cleanup, project, vkit, write } from './helpers.mjs';

const P = project('recall');
after(() => cleanup(P.parent));

test('recall returns cited global patterns and is deterministic', () => {
  const a = vkit(P.dir, ['recall', 'store money amounts as integer cents without float rounding', '--json']);
  const b = vkit(P.dir, ['recall', 'store money amounts as integer cents without float rounding', '--json']);
  assert.equal(a.code, 0, a.out);
  const ra = JSON.parse(a.out); const rb = JSON.parse(b.out);
  assert.equal(ra.receipt_hash, rb.receipt_hash, 'same query + same sources = same receipt');
  const hit = ra.results.find((r) => r.id === 'pattern:money-minor-units');
  assert.ok(hit, `money pattern not recalled: ${ra.results.map((r) => r.id)}`);
  assert.match(hit.source, /^\.tins\/kit\/patterns\/money-minor-units\/PATTERN\.md#money-minor-units$/);
  assert.equal(hit.content_sha256.length, 64);
  assert.ok(hit.not_when, 'NOT WHEN travels with the evidence');
});

test('a completed zero-hit search is a valid, explicit result', () => {
  const r = vkit(P.dir, ['recall', 'zebra lullaby quantum harmonica']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /no confident match after a completed search; this is not proof/);
});

test('a meaningless query is refused, not silently treated as "nothing found"', () => {
  const r = vkit(P.dir, ['recall', '!!! ???']);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /recall: FAIL/);
});

test('trigger matching is whole-word: "asynchronous" does not fire the "sync" trigger', () => {
  const r = JSON.parse(vkit(P.dir, ['recall', 'asynchronous request handlers', '--json']).out);
  assert.ok(!r.results.some((x) => x.id === 'pattern:offline-pwa'), JSON.stringify(r.results.map((x) => x.id)));
  const s = JSON.parse(vkit(P.dir, ['recall', 'offline sync with intermittent connectivity', '--json']).out);
  assert.ok(s.results.some((x) => x.id === 'pattern:offline-pwa'));
});

test('current SPEC rows are part of the corpus', () => {
  const r = JSON.parse(vkit(P.dir, ['recall', 'what did decision D-1 settle', '--json']).out);
  assert.equal(r.results[0]?.id, 'spec:D-1');
});

test('knowledge eval measures recall and wrong hits against a golden file', () => {
  write(P.parent, 'golden.json', JSON.stringify([
    { query: 'money amounts in cents with rounding', expect: ['pattern:money-minor-units'] },
    { query: 'append-only audit ledger with reversals', expect: ['pattern:append-only-ledger'], reject: ['pattern:money-minor-units'] },
  ]));
  const ok = vkit(P.dir, ['knowledge', 'eval', join(P.parent, 'golden.json')]);
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /recall=1\.000/);
  write(P.parent, 'impossible.json', JSON.stringify([{ query: 'zebra lullaby quantum harmonica', expect: ['pattern:money-minor-units'] }]));
  assert.notEqual(vkit(P.dir, ['knowledge', 'eval', join(P.parent, 'impossible.json')]).code, 0, 'a missed expectation fails the eval');
});
