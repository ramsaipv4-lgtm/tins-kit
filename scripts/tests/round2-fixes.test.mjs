// Regression tests for two defects found by round-2 builders (reported independently by both):
//  1. `validate --spec SPEC.md` ran the kit-inventory layer on a consumer's own SPEC.md (35 false failures).
//  2. `session.mjs ack` and `claim decision-number:next` disagreed about the next decision number because a fenced
//     worked example in the template (`### Decision 8`) was counted as a real decision.
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const node = process.execPath;

test('validate --spec does not run the kit-inventory layer inside a consumer project', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tins-r2-validate-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    cpSync(join(KIT, 'scripts', 'validate.mjs'), join(dir, 'scripts', 'validate.mjs'));
    cpSync(join(KIT, 'scripts', '_lib'), join(dir, 'scripts', '_lib'), { recursive: true });
    writeFileSync(join(dir, '.kit-project.json'), JSON.stringify({ kind: 'scaffold' }));
    writeFileSync(join(dir, 'SPEC.md'), '# not a real spec\n');
    const r = spawnSync(node, [join(dir, 'scripts', 'validate.mjs'), '--spec', join(dir, 'SPEC.md')], { encoding: 'utf8', cwd: dir });
    const out = r.stdout + r.stderr;
    assert.doesNotMatch(out, /§8\.14a|GENERATE-CURRICULUM|PUBLISH-OPEN-SOURCE/, out); // kit-inventory checks
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

function git(cwd, ...a) {
  return spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...a], { cwd, encoding: 'utf8' });
}

test('claim decision-number:next ignores a fenced worked example and follows the real highest decision', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tins-r2-claim-'));
  try {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, 'BUILDER-DECISIONS-REVIEW.md'),
      '# log\n\n```markdown\n### Decision 8 — worked example in a fence\n```\n\n### Decision 1 — real\n\n### Decision 2 — real\n');
    git(dir, 'add', '-A'); git(dir, 'commit', '-qm', 'init');
    const r = spawnSync(node, [join(KIT, 'scripts', 'session.mjs'), 'claim', 'decision-number:next', '--root', dir], { encoding: 'utf8', cwd: dir });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.stdout.trim().split('\n')[0], '3', `expected 3 (real max 2, fenced 8 ignored), got: ${r.stdout}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
