// scripts/tests/coverage.test.mjs: kit-coverage v2 (front-matter retrieval) on FIXTURE patterns only.
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const COVERAGE = join(KIT, 'scripts', 'kit-coverage.mjs');
const { countPhrase, norm, scrub, nearMatch, words, stem } =
  await import(pathToFileURL(join(KIT, 'scripts', '_lib', 'retrieval.mjs')).href);

function fm(id, { solves, triggers, notWhen = [], status = 'active' }) {
  return `---\nid: ${id}\nsolves: "${solves}"\ntriggers: [${triggers.map((t) => JSON.stringify(t)).join(', ')}]\n` +
    `not_when:\n${notWhen.map((n) => `  - ${JSON.stringify(n)}`).join('\n') || '  []'}\n`.replace('  []\n', '') +
    `status: ${status}\n---\n# \`${id}\` — kit pattern\n\n> **${solves}** Lives in tins-kit/lib/patterns/${id}.md and scripts/x.mjs.\n>\n> **Source:** nowhere\n\n---\n\n## 0. Why this exists\n\nbody\n`;
}

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'cov with space-'));
  const pats = join(dir, 'pats');
  mkdirSync(pats);
  writeFileSync(join(pats, 'tenant-rls.md'), fm('tenant-rls', {
    solves: 'Isolates tenants with row level security.', triggers: ['rls', 'row level security', 'multi-tenant'],
    notWhen: ['a single-user app (cite: section 5)'],
  }));
  writeFileSync(join(pats, 'offline-pwa.md'), fm('offline-pwa', {
    solves: 'Keeps the app readable without a network.', triggers: ['offline', 'service worker', 'works without network'],
  }));
  writeFileSync(join(pats, 'old-thing.md'), fm('old-thing', {
    solves: 'Retired idea about offline queues.', triggers: ['offline', 'queue'], status: 'deprecated',
  }));
  writeFileSync(join(pats, 'gone-thing.md'), fm('gone-thing', {
    solves: 'Retracted idea.', triggers: ['offline'], status: 'retracted',
  }));
  // legacy pattern: no front matter; only its first lines can be indexed
  writeFileSync(join(pats, 'legacy-escalation.md'),
    '# Pattern: tiered escalation\n\n> **Doc-only recipe.** Which decisions an autonomous agent may make alone, escalation tiers, ' +
    'approval boundary, irreversible actions and unattended runs.\n\n## 0. Why this exists\n\nescalation approval boundary autonomous unattended\n');
  return { dir, pats };
}

function run(pats, extra) {
  const r = spawnSync(process.execPath, [COVERAGE, `--patterns=${pats}`, ...extra], { encoding: 'utf8', cwd: tmpdir() });
  return r;
}

test('coverage: word-boundary matching (no substring hits)', () => {
  assert.equal(countPhrase(norm('Worlds of sqlite and a summary'), 'rls'), 0);
  assert.equal(countPhrase(norm('Worlds of sqlite and a summary'), 'sql'), 0);
  assert.equal(countPhrase(norm('Worlds of sqlite and a summary'), 'sum'), 0);
  assert.equal(countPhrase(norm('we use RLS, and row-level security'), 'rls'), 1);
  assert.equal(countPhrase(norm('row-level security'), 'row level security'), 1);
  assert.equal(countPhrase(norm('many migrations'), 'migration'), 1); // plural tolerated
  assert.ok(nearMatch(words('Supabase (Postgres, Auth)').map(stem), 'supabase auth'));
  assert.ok(!nearMatch(words('Supabase ' + 'filler word '.repeat(20) + ' auth').map(stem), 'supabase auth'));
});

test('coverage: ranks by front-matter triggers and prints not_when', () => {
  const { dir, pats } = fixture();
  try {
    const r = run(pats, ['--task', 'A multi-tenant SaaS using RLS, and it must work offline with a service worker.']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /tenant-rls/);
    assert.match(r.stdout, /offline-pwa/);
    assert.match(r.stdout, /NOT WHEN: a single-user app/);
    assert.ok(r.stdout.indexOf('tenant-rls') !== -1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('coverage: never returns deprecated or retracted patterns', () => {
  const { dir, pats } = fixture();
  try {
    const r = run(pats, ['--task', 'offline queue offline queue with a service worker', '--json', '--min-score=0.1']);
    const ids = JSON.parse(r.stdout).map((x) => x.id);
    assert.ok(ids.includes('offline-pwa'));
    assert.ok(!ids.includes('old-thing'));
    assert.ok(!ids.includes('gone-thing'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('coverage: "worlds" does not fire rls; "sqlite" does not fire sql', () => {
  const { dir, pats } = fixture();
  try {
    const r = run(pats, ['--task', 'Strategy worlds on sqlite with a daily summary page', '--json']);
    const ids = JSON.parse(r.stdout).map((x) => x.id);
    assert.ok(!ids.includes('tenant-rls'), `got ${ids}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('coverage: a pattern without front matter is found through its first lines', () => {
  const { dir, pats } = fixture();
  try {
    const r = run(pats, ['--task', 'An unattended autonomous build where the agent must stop at an approval boundary before any irreversible action; escalation rules.', '--json']);
    const hits = JSON.parse(r.stdout);
    const h = hits.find((x) => x.id === 'legacy-escalation');
    assert.ok(h, `expected the legacy pattern; got ${hits.map((x) => x.id)}`);
    assert.equal(h.hasFrontMatter, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('coverage --json: shape, and no kit path or "tins-kit" in any string', () => {
  const { dir, pats } = fixture();
  try {
    const r = run(pats, ['--task', 'multi-tenant RLS and offline service worker', '--json']);
    assert.equal(r.status, 0, r.stderr);
    const hits = JSON.parse(r.stdout);
    assert.ok(hits.length >= 2);
    for (const h of hits) {
      for (const k of ['id', 'score', 'solves', 'not_when', 'excerpt']) assert.ok(k in h, `missing ${k}`);
      assert.ok(Array.isArray(h.not_when));
      assert.equal(typeof h.score, 'number');
    }
    const blob = JSON.stringify(hits);
    assert.ok(!/tins-kit/i.test(blob), 'must survive the external-packet scrubber');
    assert.ok(!/lib\/patterns|scripts\/x\.mjs/.test(blob), 'no kit path');
    assert.equal(scrub('see tins-kit/lib/patterns/a.md and scripts/b.mjs').includes('tins-kit'), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('coverage: --task accepts a file path (with spaces) and --spec still works', () => {
  const { dir, pats } = fixture();
  try {
    const f = join(dir, 'my task.md');
    writeFileSync(f, 'We need row level security for a multi-tenant product.\n');
    const a = run(pats, ['--task', f, '--json']);
    assert.ok(JSON.parse(a.stdout).some((x) => x.id === 'tenant-rls'));
    const b = run(pats, [`--spec=${f}`, '--json']);
    assert.ok(JSON.parse(b.stdout).some((x) => x.id === 'tenant-rls'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('coverage: usage errors exit 2', () => {
  const { dir, pats } = fixture();
  try {
    assert.equal(run(pats, ['--task', 'definitely-not-here-7f3a.md']).status, 2);
    assert.equal(run(pats, ['--spec=/no/such/SPEC.md']).status, 2);
    assert.equal(run(join(dir, 'missing'), ['--task', 'some words here for a task']).status, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
