// scripts/tests/pattern-meta.test.mjs: the shared front-matter parser (scripts/_lib/pattern-meta.mjs).
// Fixture-based: never reads lib/patterns, so it does not depend on what the pattern authors wrote.
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { parsePatternFile, loadPatterns, decisionsDerivedFrom, titleOf } =
  await import(pathToFileURL(join(KIT, 'scripts', '_lib', 'pattern-meta.mjs')).href);

const FULL = `---
# a comment line
id: demo-pattern
solves: "Stops X, even when Y: really."   # trailing comment
triggers: [alpha, "beta, gamma", 'delta''s']
assumes:
  - TypeScript
  - "Postgres 15 # not a comment"
not_when:
  - "single-row writes (cite: section 5)"
artefact: prose
derived_from: ["jayshankar#8", jayshankar#10]
status: active
superseded_by: null
verified: null
---
# \`demo-pattern\` — kit pattern

Body text.
`;

test('pattern-meta: parses the documented subset', () => {
  const r = parsePatternFile(FULL);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.meta.id, 'demo-pattern');
  assert.equal(r.meta.solves, 'Stops X, even when Y: really.');
  assert.deepEqual(r.meta.triggers, ['alpha', 'beta, gamma', "delta's"]);
  assert.deepEqual(r.meta.assumes, ['TypeScript', 'Postgres 15 # not a comment']);
  assert.deepEqual(r.meta.not_when, ['single-row writes (cite: section 5)']);
  assert.deepEqual(r.meta.derived_from, ['jayshankar#8', 'jayshankar#10']);
  assert.equal(r.meta.superseded_by, null);
  assert.equal(r.meta.verified, null);
  assert.match(r.body, /^# `demo-pattern`/);
  assert.equal(titleOf(r.body), '`demo-pattern` — kit pattern');
});

test('pattern-meta: CRLF input parses identically (and a BOM is tolerated)', () => {
  const crlf = '﻿' + FULL.replace(/\n/g, '\r\n');
  const a = parsePatternFile(FULL);
  const b = parsePatternFile(crlf);
  assert.deepEqual(b.errors, []);
  assert.deepEqual(b.meta, a.meta);
  assert.ok(!b.body.includes('\r'));
});

test('pattern-meta: a file without front matter yields meta=null and no error', () => {
  const r = parsePatternFile('# Title\n\n---\nid: not-front-matter\n---\n');
  assert.equal(r.meta, null);
  assert.deepEqual(r.errors, []);
  assert.match(r.body, /^# Title/);
});

test('pattern-meta: unterminated front matter is an error with a line number', () => {
  const r = parsePatternFile('---\nid: x\n# Title\n');
  assert.equal(r.meta, null);
  assert.match(r.errors[0], /line 1.*never closed/);
});

test('pattern-meta: errors carry file line numbers and never throw', () => {
  const r = parsePatternFile('---\nid: x\nsolves "no colon"\nid: y\ntriggers: [a, "b]\nweird:\n  nested: map\n---\nbody');
  const text = r.errors.join('\n');
  assert.match(text, /line 3: expected "key: value"/);
  assert.match(text, /line 4: duplicate key "id"/);
  assert.match(text, /line 5: unterminated/);
  assert.match(text, /line 7/);
});

test('pattern-meta: unknown top-level keys are WARNINGS, not errors', () => {
  const r = parsePatternFile('---\nid: x\nused_by: [a]\n---\nb');
  assert.deepEqual(r.errors, []);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /unknown top-level key "used_by"/);
});

test('pattern-meta: enum and type checks', () => {
  const r = parsePatternFile('---\nid: x\nstatus: maybe\nartefact: poem\nverified: "yes I tested it"\ntriggers: foo\n---\nb');
  const text = r.errors.join('\n');
  assert.match(text, /status must be one of/);
  assert.match(text, /artefact must be one of/);
  assert.match(text, /verified must be null or/);
  assert.match(text, /"triggers" must be a list/);
  const ok = parsePatternFile('---\nid: x\nverified: "2026-10-02: node scripts/validate.mjs --kit"\n---\nb');
  assert.deepEqual(ok.errors, []);
});

test('pattern-meta: folded block scalar and continuation lines', () => {
  const r = parsePatternFile('---\nid: x\nsolves: >\n  first line\n  second line\n---\nb');
  assert.equal(r.meta.solves, 'first line second line');
  const c = parsePatternFile('---\nid: x\nsolves: plain start\n  and a continuation\n---\nb');
  assert.equal(c.meta.solves, 'plain start and a continuation');
});

test('pattern-meta: loadPatterns checks required keys and id/filename agreement', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pm-'));
  try {
    writeFileSync(join(dir, 'good.md'), '---\nid: good\nsolves: "s"\ntriggers: [a]\nstatus: active\n---\n# Good\n');
    writeFileSync(join(dir, 'wrong-id.md'), '---\nid: other\nsolves: "s"\ntriggers: [a]\nstatus: active\n---\n# W\n');
    writeFileSync(join(dir, 'missing.md'), '---\nid: missing\n---\n# M\n');
    writeFileSync(join(dir, 'legacy.md'), '# Legacy\n\nno front matter\n');
    writeFileSync(join(dir, 'notes.txt'), 'ignored');
    const ps = loadPatterns(dir);
    assert.deepEqual(ps.map((p) => p.file), ['good.md', 'legacy.md', 'missing.md', 'wrong-id.md']);
    const by = Object.fromEntries(ps.map((p) => [p.file, p]));
    assert.deepEqual(by['good.md'].errors, []);
    assert.equal(by['legacy.md'].meta, null);
    assert.equal(by['legacy.md'].id, 'legacy');
    assert.equal(by['legacy.md'].hasFrontMatter, false);
    assert.ok(by['missing.md'].errors.some((e) => /missing required key "solves"/.test(e)));
    assert.ok(by['wrong-id.md'].errors.some((e) => /does not match file name/.test(e)));
    assert.deepEqual(loadPatterns(join(dir, 'nope')), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('pattern-meta: decisionsDerivedFrom reads derived_from refs, then the Source paragraph', () => {
  const a = { meta: { derived_from: ['Jayshankar#8', 'jayshankar#D10', 'other#3', 'jayshankar'] }, body: '' };
  assert.deepEqual([...decisionsDerivedFrom(a, 'jayshankar')].sort(), ['10', '8']);
  const b = { meta: { derived_from: ['jayshankar'] }, body: '# T\n\n> **Source:** Jayshankar W1.5 decisions 8, 10 and 11 (the FK drop).\n>\n> more\n' };
  assert.deepEqual([...decisionsDerivedFrom(b, 'jayshankar')].sort(), ['10', '11', '8']);
  assert.equal(decisionsDerivedFrom(b, 'someone-else').size, 0);
});
