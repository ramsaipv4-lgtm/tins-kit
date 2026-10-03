// scripts/tests/ingest.test.mjs: kit-ingest and kit-extract on a FIXTURE inbox / consumer and a FIXTURE kit.
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const INGEST = join(KIT, 'scripts', 'kit-ingest.mjs');
const EXTRACT = join(KIT, 'scripts', 'kit-extract.mjs');
const { parseDecisions } = await import(pathToFileURL(join(KIT, 'scripts', '_lib', 'decision-parse.mjs')).href);

// A log in the REAL format: "## W1 — date" section headings with "### Decision N —" under them (round-1: this
// returned 0 candidates from kit-ingest), a fenced example that must not count, and a ### subsection inside a decision.
const LOG = (crlf = false) => `# BUILDER-DECISIONS-REVIEW.md

## W1 — 2026-08-05

### Decision 1 — Always pin the migration order with a numbered prefix, never a timestamp

**Date:** 2026-08-05

**What changed.** We renamed every file in \`supabase/migrations/\` to a four digit prefix because the timestamp
form let two branches apply out of order and a later migration ran before the table existed. The lesson: a rule,
not a preference. See \`lib/db.ts\` for the guard that now refuses an out-of-order apply and a gotcha with seeds.

**Why.** The failure was a real mistake that cost an afternoon; the pitfall is easy to repeat.

**Impact on downstream.** Every consumer that scaffolds from the kit needs the same convention in \`migrations/\`.

### the guard script

Subsections do not end a decision.

### Decision 2 — Drop the FK and rely on a trigger for the auth to public mapping

**What changed.** \`public.users.id\` no longer references auth.users. The lesson is a gotcha for every Supabase seed,
written up with the file \`supabase/migrations/0001_init.sql\` and a recipe in \`src/auth.ts\` for the trigger.

**Why.** The seed could not insert rows without matching auth users; this is a pattern worth keeping and a pitfall.

**Impact on downstream.** The seed now runs cleanly.

### Decision 3 — Tiny cosmetic tweak

**What changed.** Colour.

\`\`\`markdown
### Decision 99 — an example heading inside a fence must be ignored

**What changed.** nothing
\`\`\`

## D4 — Rule of thumb: never hard-code the tenant id; always read it from the session

**Context.** A rule that must always hold: the tenant id comes from the session, never a param. See \`src/tenant.ts\`.
This is a lesson and a pitfall; the first draft read it from the URL and leaked data in a test. ${'x'.repeat(250)}

**Decision.** Read it from the session in \`lib/tenant.ts\` only.

**Consequences.** A lint rule in \`eslint/\` blocks the URL form.
`.replace(/\n/g, crlf ? '\r\n' : '\n');

const PATTERN_A = `---
id: auth-trigger
solves: "Maps auth users to profile rows."
triggers: ["auth trigger", "public.users"]
derived_from: ["acme#2"]
status: active
---
# \`auth-trigger\` — kit pattern

> **Maps auth users to profile rows with a trigger instead of a foreign key.** Auth trigger FK seed profile users.

## 0. Why this exists

text
`;

function makeKit() {
  const kit = mkdtempSync(join(tmpdir(), 'ingest kit-'));
  mkdirSync(join(kit, 'lib', 'patterns'), { recursive: true });
  mkdirSync(join(kit, 'kit-staging', 'inbox'), { recursive: true });
  writeFileSync(join(kit, 'lib', 'patterns', 'auth-trigger.md'), PATTERN_A);
  return kit;
}
const inboxOf = (kit, project) => { const d = join(kit, 'kit-staging', 'inbox', project); mkdirSync(d, { recursive: true }); return d; };
function ingest(kit, extra = []) {
  return spawnSync(process.execPath, [INGEST, `--kit=${kit}`, '--json', ...extra], { encoding: 'utf8', cwd: tmpdir() });
}

test('decision-parse: both heading styles, fences ignored, ### subsections stay inside, CRLF ok', () => {
  for (const crlf of [false, true]) {
    const ds = parseDecisions(LOG(crlf));
    assert.deepEqual(ds.map((d) => d.id), ['D1', 'D2', 'D3', 'D4']);
    assert.equal(ds[0].date, '2026-08-05');
    assert.ok(ds[0].body.includes('Subsections do not end a decision'));
    assert.ok(!ds.some((d) => d.num === 99), 'fenced example must not count');
    assert.ok(ds[0].context.length > 0 && ds[3].decision.length > 0);
  }
  assert.equal(parseDecisions('### Decision 7 — first line heading\n\nbody').length, 1);
});

test('kit-ingest: a "### Decision N —" log yields candidates (the round-1 bug: it yielded 0)', () => {
  const kit = makeKit();
  try {
    writeFileSync(join(inboxOf(kit, 'zeta'), 'BUILDER-DECISIONS-REVIEW.md'), LOG());
    const r = ingest(kit);
    assert.equal(r.status, 1, r.stderr + r.stdout); // exit 1 = candidates found
    const out = JSON.parse(r.stdout);
    assert.ok(out.candidates.length > 0, 'expected >0 candidates');
    const ids = out.candidates.map((c) => c.id);
    assert.ok(ids.includes('D1') && ids.includes('D2'), `got ${ids}`);
    assert.ok(!ids.some((i) => /^DD/.test(i)), 'no D-prefix doubling');
    assert.ok(!ids.includes('D99'));
  } finally { rmSync(kit, { recursive: true, force: true }); }
});

test('kit-ingest: candidate numbers are global and identical in headings and the triage template', () => {
  const kit = makeKit();
  try {
    writeFileSync(join(inboxOf(kit, 'alpha'), 'BUILDER-DECISIONS-REVIEW.md'), LOG());
    writeFileSync(join(inboxOf(kit, 'beta'), 'BUILDER-DECISIONS-REVIEW.md'), LOG());
    const out = join(kit, 'triage.md');
    const r = spawnSync(process.execPath, [INGEST, `--kit=${kit}`, `--out=${out}`], { encoding: 'utf8', cwd: tmpdir() });
    assert.equal(r.status, 1, r.stderr + r.stdout);
    const md = readFileSync(out, 'utf8');
    const heads = [...md.matchAll(/^### C(\d+) \(/gm)].map((m) => Number(m[1]));
    const tmpl = [...md.matchAll(/^C(\d+) \(/gm)].map((m) => Number(m[1]));
    assert.ok(heads.length >= 4);
    assert.deepEqual([...heads].sort((a, b) => a - b), heads.map((_, i) => i + 1), 'numbers 1..n each used once');
    assert.deepEqual([...tmpl].sort((a, b) => a - b), [...heads].sort((a, b) => a - b));
  } finally { rmSync(kit, { recursive: true, force: true }); }
});

test('kit-ingest: a decision that is the recorded source of a kit pattern is not re-flagged; hints exclude it', () => {
  const kit = makeKit();
  try {
    writeFileSync(join(inboxOf(kit, 'acme'), 'BUILDER-DECISIONS-REVIEW.md'), LOG());
    const out = JSON.parse(ingest(kit).stdout);
    assert.ok(!out.candidates.some((c) => c.id === 'D2'), 'D2 is derived_from acme#2');
    assert.deepEqual(out.skippedOwnSource.map((s) => s.id), ['D2']);
    assert.ok(out.candidates.some((c) => c.id === 'D1'));
  } finally { rmSync(kit, { recursive: true, force: true }); }
});

test('kit-ingest: similarity hints point at an overlapping pattern but never drop a candidate', () => {
  const kit = makeKit();
  try {
    const d = inboxOf(kit, 'zeta');
    writeFileSync(join(d, 'BUILDER-DECISIONS-REVIEW.md'), `### Decision 5 — Always map auth users to profile rows with a trigger, never a foreign key

**What changed.** The auth trigger fills public.users from the auth users table; no FK. A lesson and a pitfall, see \`src/auth.ts\`. ${'pad '.repeat(80)}

**Why.** profile rows via trigger.

**Impact on downstream.** none
`);
    const out = JSON.parse(ingest(kit).stdout);
    const c = out.candidates.find((x) => x.id === 'D5');
    assert.ok(c, 'candidate kept');
    assert.ok(c.hints.some((h) => h.id === 'auth-trigger'), JSON.stringify(c.hints));
  } finally { rmSync(kit, { recursive: true, force: true }); }
});

test('kit-ingest: typed proposals are LISTED with a human-review warning and never applied', () => {
  const kit = makeKit();
  try {
    const d = inboxOf(kit, 'zeta');
    mkdirSync(join(d, 'proposals', 'scripts'), { recursive: true });
    writeFileSync(join(d, 'proposals', 'scripts', 'new-tool.mjs'), 'console.log(1)\n');
    mkdirSync(join(d, 'templates'), { recursive: true });
    writeFileSync(join(d, 'templates', 'X.md'), '# x\n');
    mkdirSync(join(d, 'proposals', 'patches'), { recursive: true });
    writeFileSync(join(d, 'proposals', 'patches', 'fix.patch'), '--- a/x\n+++ b/x\n');
    mkdirSync(join(d, 'schemas'), { recursive: true });
    writeFileSync(join(d, 'schemas', 's.json'), '{}');
    mkdirSync(join(d, 'docs'), { recursive: true });
    writeFileSync(join(d, 'docs', 'GUIDE.md'), '# g\n');
    const out = JSON.parse(ingest(kit).stdout);
    const types = new Set(out.candidates.map((c) => c.type));
    for (const t of ['script', 'template', 'schema', 'doc', 'patch']) assert.ok(types.has(t), `missing type ${t}: ${[...types]}`);
    assert.ok(out.candidates.filter((c) => c.review).every((c) => /NEEDS HUMAN REVIEW/.test(c.note)));
    const md = join(kit, 't.md');
    spawnSync(process.execPath, [INGEST, `--kit=${kit}`, `--out=${md}`], { encoding: 'utf8', cwd: tmpdir() });
    assert.match(readFileSync(md, 'utf8'), /WARNING.*need human review/);
    // nothing applied: the kit tree gained no scripts/ or templates/
    assert.equal(spawnSync(process.execPath, ['-e', `process.exit(require('fs').existsSync(${JSON.stringify(join(kit, 'scripts'))}) ? 1 : 0)`]).status, 0);
  } finally { rmSync(kit, { recursive: true, force: true }); }
});

test('kit-ingest: a re-exported unchanged kit pattern is skipped; a changed one is a proposed change; heading literals are not required', () => {
  const kit = makeKit();
  try {
    const d = inboxOf(kit, 'zeta');
    mkdirSync(join(d, 'lib', 'patterns'), { recursive: true });
    writeFileSync(join(d, 'lib', 'patterns', 'auth-trigger.md'), PATTERN_A);              // identical copy of the kit's
    writeFileSync(join(d, 'lib', 'patterns', 'fresh-idea.md'),                              // renamed headings, front matter ok
      '---\nid: fresh-idea\nsolves: "s"\ntriggers: ["a"]\nstatus: active\n---\n# `fresh-idea`\n\n## 0. Why this exists\n\nx\n\n## 1. Lessons\n\ny\n');
    const out = JSON.parse(ingest(kit).stdout);
    const pats = out.candidates.filter((c) => c.type === 'pattern').map((c) => c.id);
    assert.deepEqual(pats, ['pattern:fresh-idea']);
    assert.equal(out.unchangedKitCopies, 1);
    writeFileSync(join(d, 'lib', 'patterns', 'auth-trigger.md'), PATTERN_A + '\nchanged\n');
    const out2 = JSON.parse(ingest(kit).stdout);
    const ch = out2.candidates.find((c) => c.id === 'pattern:auth-trigger');
    assert.ok(ch && /DIFFERS from the kit pattern/.test(ch.note));
  } finally { rmSync(kit, { recursive: true, force: true }); }
});

test('kit-ingest: empty inbox exits 0; missing inbox exits 2', () => {
  const kit = makeKit();
  try {
    assert.equal(ingest(kit).status, 0);
    assert.equal(spawnSync(process.execPath, [INGEST, `--kit=${kit}`, `--inbox=${join(kit, 'nope')}`], { encoding: 'utf8' }).status, 2);
  } finally { rmSync(kit, { recursive: true, force: true }); }
});

test('kit-extract: shares the parser and finds the same decisions (both heading styles, fences ignored)', () => {
  const kit = makeKit();
  const consumer = mkdtempSync(join(tmpdir(), 'consumer-'));
  try {
    writeFileSync(join(consumer, 'BUILDER-DECISIONS-REVIEW.md'), LOG());
    const out = join(consumer, 'cand.md');
    // kit-extract resolves the kit from its own location; copy only what it needs? It reads <its kit>/lib/patterns,
    // so run the real script and only assert on what is independent of the real patterns.
    const r = spawnSync(process.execPath, [EXTRACT, `--consumer=${consumer}`, `--out=${out}`, '--project=nobody'], { encoding: 'utf8', cwd: tmpdir() });
    assert.equal(r.status, 1, r.stderr + r.stdout);
    const md = readFileSync(out, 'utf8');
    assert.match(md, /`D1`/);
    assert.match(md, /`D4`/);
    assert.ok(!/`D99`/.test(md));
  } finally { rmSync(kit, { recursive: true, force: true }); rmSync(consumer, { recursive: true, force: true }); }
});
