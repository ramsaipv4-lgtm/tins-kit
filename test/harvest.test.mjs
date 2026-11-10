// Harvesting is read-only for source projects and creates review candidates, never automatic global knowledge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { centralKit, cleanup, git, kit, project, tmp, write } from './helpers.mjs';

function fixture() {
  const P = project('harvest-source');
  write(P.dir, 'BUILDER-DECISIONS-REVIEW.md', '# Decisions\n\n### Decision 1 — Store money as integer paise\n\nAvoid floating-point money drift.\n\n### Decision 2 — Unsafe example\n\nDo not publish this credential.\n');
  write(P.dir, 'lib/patterns/fifo-cascade-algorithm.md', '# fifo-cascade-algorithm\n\nDeduct stock from the oldest batches first and report any shortfall.\n');
  write(P.dir, 'HANDOVER.md', '# Narrative handover\n');
  write(P.dir, 'docs/next.md', '### Kit improvement\n\n- **C1** a named handoff file for the next agent.\n- **C2** merged tasks must not stay open.\n');
  write(P.dir, 'docs/build-journal/integration.md', '## I-1: parallel teams registered the same route\n\nGive each screen one owner and let other teams contribute panels.\n');
  const fake = ['ghp', '_', 'A'.repeat(18), 'b'.repeat(18)].join('');
  write(P.dir, 'BUILDER-DECISIONS-REVIEW.md', `${readFileSync(join(P.dir, 'BUILDER-DECISIONS-REVIEW.md'), 'utf8')}\n### Decision 3 — Secret-containing lesson\n\n${fake}\n`);
  git(P.dir, 'add', '-A'); git(P.dir, 'commit', '-q', '-m', 'harvest evidence');
  return { P, fake };
}

test('harvest dry run extracts structured evidence, scans secrets and writes nowhere', () => {
  const { P, fake } = fixture(); const C = centralKit();
  try {
    const r = kit(C, ['harvest', P.dir, '--json'], C); assert.equal(r.code, 0, r.out);
    const report = JSON.parse(r.out);
    assert.ok(report.candidates.some((c) => c.id === 'decision-store-money-as-integer-paise'));
    assert.ok(report.candidates.some((c) => c.id === 'fifo-cascade-algorithm'));
    assert.ok(report.candidates.some((c) => c.id.startsWith('improvement-c1-')));
    assert.ok(report.candidates.some((c) => c.id === 'decision-parallel-teams-registered-the-same-route'));
    assert.equal(report.skipped.length, 1);
    assert.ok(report.manifest.documents.some((d) => d.path === 'HANDOVER.md'));
    assert.equal(report.manifest.first_commit, git(P.dir, 'rev-list', '--max-parents=0', 'HEAD'));
    assert.ok(!r.out.includes(fake), 'secret values never appear in the report');
    assert.ok(!existsSync(join(C, 'inbox')));
    assert.equal(git(P.dir, 'status', '--porcelain'), '');
  } finally { cleanup(P.parent, C); }
});

test('harvest --write creates an inbox bundle; only explicit central promotion makes it recallable', () => {
  const { P } = fixture(); const C = centralKit();
  try {
    const r = kit(C, ['harvest', P.dir, '--write'], C); assert.equal(r.code, 0, r.out);
    const folder = r.out.match(/inbox\/([a-z0-9-]+)/)[1];
    const candidate = join(C, 'inbox', folder, 'candidates', 'fifo-cascade-algorithm.md');
    assert.ok(existsSync(candidate));
    assert.match(readFileSync(candidate, 'utf8'), /status: candidate/);
    assert.ok(!existsSync(join(C, 'knowledge', 'fifo-cascade-algorithm.md')));
    const p = kit(C, ['knowledge', 'promote', folder, 'fifo-cascade-algorithm', '--reviewed-by', 'owner', '--license', 'MIT'], C);
    assert.equal(p.code, 0, p.out); assert.match(p.out, /\[tested\]/);
    const recall = kit(C, ['recall', 'deduct the oldest stock batches first', '--json'], C);
    assert.equal(recall.code, 0, recall.out);
    assert.ok(JSON.parse(recall.out).results.some((x) => x.id === 'knowledge:fifo-cascade-algorithm'));
    assert.equal(git(P.dir, 'status', '--porcelain'), '');
    assert.notEqual(kit(C, ['harvest', P.dir, '--write'], C).code, 0, 'an existing inbox is never overwritten');
  } finally { cleanup(P.parent, C); }
});

test('unversioned sources keep honest provenance and cannot become active global knowledge', () => {
  const source = tmp('unversioned-source'); const C = centralKit();
  try {
    write(source, 'lib/patterns/offline-writes.md', '# offline-writes\n\nQueue writes locally and replay them idempotently.\n');
    const r = kit(C, ['harvest', source, '--write'], C); assert.equal(r.code, 0, r.out);
    const folder = r.out.match(/inbox\/([a-z0-9-]+)/)[1];
    const manifest = JSON.parse(readFileSync(join(C, 'inbox', folder, 'manifest.json'), 'utf8'));
    assert.equal(manifest.versioned, false);
    assert.match(manifest.first_commit, /^unversioned-root:/);
    assert.match(manifest.head, /^unversioned:[0-9a-f]{16}$/);
    const active = kit(C, ['knowledge', 'promote', folder, 'offline-writes', '--reviewed-by', 'owner', '--license', 'MIT', '--activate'], C);
    assert.notEqual(active.code, 0); assert.match(active.out, /Git-backed consumer roots/);
    const tested = kit(C, ['knowledge', 'promote', folder, 'offline-writes', '--reviewed-by', 'owner', '--license', 'MIT'], C);
    assert.equal(tested.code, 0, tested.out); assert.match(tested.out, /\[tested\]/);
  } finally { cleanup(source, C); }
});

