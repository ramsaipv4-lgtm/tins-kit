// Tests for scripts/kit-staging-export.mjs (proposals lane), kit-new-project-shell.mjs rosters,
// new-project.mjs baseline, kit-proposal-check.mjs and _lib/unified-diff.mjs (round-1 consistency C1/M1/M2, red-team M2).
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unifiedDiff, parsePatch, applyFilePatch } from '../_lib/unified-diff.mjs';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const node = (args, opts = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', ...opts });

function shellProject() {
  const root = mkdtempSync(join(tmpdir(), 'kitexp-'));
  const proj = join(root, 'demo proj'); // space in path on purpose
  const r = node([join(KIT, 'scripts', 'kit-new-project-shell.mjs'), 'demo', `--out=${proj}`]);
  assert.ok(existsSync(join(proj, '.kit-shell', '.kit-shell.json')), r.stderr + r.stdout);
  return { root, proj, shell: join(proj, '.kit-shell') };
}
const exportRun = (p, extra = []) => node([join(p.shell, 'scripts', 'kit-staging-export.mjs'), '--no-archive', `--kit=${KIT}`, ...extra], { cwd: p.proj });
const bundle = (p) => join(p.proj, '.kit-staging-export', `kit-staging-export-demo-${new Date().toISOString().slice(0, 10)}`);
const manifest = (p) => JSON.parse(readFileSync(join(bundle(p), 'kit-staging-export.json'), 'utf8'));

test('shell: roster derives from scripts/ (new scripts + _lib present, kit-only absent), AGENT-BRIEF.md exists, marker carries version+baseline', () => {
  const p = shellProject();
  try {
    for (const f of ['kit-staging-export.mjs', 'kit-version.mjs', 'decision-log.mjs', 'check-task-independence.mjs', 'kit-coverage.mjs']) {
      assert.ok(existsSync(join(p.shell, 'scripts', f)), `shell is missing scripts/${f}`);
    }
    assert.ok(existsSync(join(p.shell, 'scripts', '_lib', 'kit-tree.mjs')));
    assert.ok(existsSync(join(p.shell, 'scripts', '_lib', 'unified-diff.mjs')));
    for (const f of ['kit-ingest.mjs', 'kit-sync.mjs', 'new-project.mjs', 'kit-new-project-shell.mjs', 'selftest.mjs']) {
      assert.equal(existsSync(join(p.shell, 'scripts', f)), false, `${f} must not be in the shell`);
    }
    assert.ok(existsSync(join(p.proj, 'AGENT-BRIEF.md')), 'the templates/AGENT-BRIEF.md bug: shell has no AGENT-BRIEF.md');
    const m = JSON.parse(readFileSync(join(p.shell, '.kit-shell.json'), 'utf8'));
    assert.notEqual(m.kitVersion, '2.0', 'kitVersion must no longer be hardcoded');
    assert.match(m.kitHash, /^[0-9a-f]{64}$/);
    assert.ok(m.baseline['scripts/decision-log.mjs'].hash);
  } finally { rmSync(p.root, { recursive: true, force: true }); }
});

test('export: unchanged kit files are skipped (no re-export flood); new files ship; edits become proposals with a patch', () => {
  const p = shellProject();
  try {
    mkdirSync(join(p.proj, 'scripts'), { recursive: true });
    mkdirSync(join(p.proj, 'schemas'));
    mkdirSync(join(p.proj, 'lib', 'patterns'), { recursive: true });
    mkdirSync(join(p.proj, 'lib', 'ledger-mod', 'tests'), { recursive: true });
    mkdirSync(join(p.proj, 'kit-proposals'));
    writeFileSync(join(p.proj, 'scripts', 'ledger.mjs'), 'export const invented = 1;\n');
    writeFileSync(join(p.proj, 'schemas', 'thing.schema.json'), '{"invented":true}\n');
    writeFileSync(join(p.proj, 'lib', 'patterns', 'new-recipe.md'), '# New recipe\n');
    writeFileSync(join(p.proj, 'lib', 'ledger-mod', 'index.ts'), 'export {};\n');
    writeFileSync(join(p.proj, 'lib', 'ledger-mod', 'tests', 'a.test.ts'), '// t\n');
    // a kit pattern copied verbatim must NOT come back as a candidate
    writeFileSync(join(p.proj, 'lib', 'patterns', 'pinned-deps.md'), readFileSync(join(KIT, 'lib', 'patterns', 'pinned-deps.md')));
    appendFileSync(join(p.shell, 'scripts', 'escalate.mjs'), '\n// invented local edit\n');
    writeFileSync(join(p.proj, 'kit-proposals', 'scripts-escalate-mjs.md'), 'Because invented reasons.\n');

    const r = exportRun(p);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    const m = manifest(p);
    const paths = m.shipped.map((s) => s.path);
    for (const f of ['scripts/ledger.mjs', 'schemas/thing.schema.json', 'lib/patterns/new-recipe.md', 'lib/ledger-mod/index.ts', 'lib/ledger-mod/tests/a.test.ts']) {
      assert.ok(paths.includes(f), `missing from bundle: ${f}`);
    }
    assert.equal(paths.includes('lib/patterns/pinned-deps.md'), false, 'kit pattern re-exported');
    assert.equal(m.proposals.length, 1);
    const pr = m.proposals[0];
    assert.equal(pr.path, 'scripts/escalate.mjs');
    assert.equal(pr.patch, true);
    assert.equal(pr.rationale, 'authored');
    const diff = readFileSync(join(bundle(p), 'proposals', pr.id, 'patch.diff'), 'utf8');
    assert.match(diff, /\+\/\/ invented local edit/);
    assert.equal(m.against.hash, JSON.parse(readFileSync(join(p.shell, '.kit-shell.json'), 'utf8')).kitHash);
    assert.ok(m.counts.shipped > 5);
  } finally { rmSync(p.root, { recursive: true, force: true }); }
});

test('export: skipped files are reported loudly (env, project docs), a missing rationale warns, --strict fails', () => {
  const p = shellProject();
  try {
    mkdirSync(join(p.proj, 'scripts'), { recursive: true });
    mkdirSync(join(p.proj, 'docs'));
    writeFileSync(join(p.proj, 'scripts', '.env'), 'INVENTED=1\n');
    writeFileSync(join(p.proj, 'docs', 'NOTES.md'), 'project notes\n');
    appendFileSync(join(p.shell, 'prompts', 'NEW-PROJECT.md'), '\ninvented edit\n');
    const r = exportRun(p);
    assert.equal(r.status, 0);
    assert.match(r.stderr, /NOT SHIPPED/);
    assert.match(r.stderr, /scripts\/\.env/);
    assert.match(r.stderr, /docs\/NOTES\.md/);
    assert.match(r.stderr, /no rationale/);
    const m = manifest(p);
    assert.ok(m.skipped.some((s) => s.path === 'scripts/.env'));
    assert.equal(existsSync(join(bundle(p), 'scripts', '.env')), false);
    assert.equal(existsSync(join(bundle(p), 'docs', 'NOTES.md')), false);
    assert.equal(m.proposals[0].rationale, 'missing');
    assert.equal(exportRun(p, ['--strict']).status, 1);
    // --include-docs ships the project doc
    exportRun(p, ['--include-docs']);
    assert.ok(existsSync(join(bundle(p), 'docs', 'NOTES.md')));
  } finally { rmSync(p.root, { recursive: true, force: true }); }
});

test('export: manifest records repo URL (credentials scrubbed) and first-commit sha from git, or "unknown" with a warning', () => {
  const p = shellProject();
  try {
    let r = exportRun(p);
    assert.equal(manifest(p).repo.url, 'unknown');
    assert.match(r.stderr, /independent/);
    const g = (...a) => spawnSync('git', ['-C', p.proj, ...a], { encoding: 'utf8' });
    if (g('--version').status !== 0) return; // git absent: the unknown path above is all that can be tested
    g('init', '-q');
    g('remote', 'add', 'origin', 'https://someone:invented-token@example.com/org/demo.git');
    g('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '--allow-empty', '-m', 'first');
    const first = g('rev-list', '--max-parents=0', 'HEAD').stdout.trim();
    r = exportRun(p);
    const m = manifest(p);
    assert.equal(m.repo.url, 'https://example.com/org/demo.git');
    assert.equal(m.repo.firstCommit, first);
    assert.equal(readFileSync(join(bundle(p), 'kit-staging-export.json'), 'utf8').includes('invented-token'), false);
    // flags override
    exportRun(p, ['--repo-url=https://example.org/x.git', '--first-commit=abc123']);
    assert.equal(manifest(p).repo.firstCommit, 'abc123');
  } finally { rmSync(p.root, { recursive: true, force: true }); }
});

test('export: a bundle containing a value from the project .env is refused and the staging copy deleted', () => {
  const p = shellProject();
  try {
    writeFileSync(join(p.proj, '.env'), 'INVENTED_SERVICE_KEY=zq81-invented-notreal-value-4471\n');
    appendFileSync(join(p.proj, 'BUILDER-DECISIONS-REVIEW.md'), '\nWe pasted zq81-invented-notreal-value-4471 by mistake.\n');
    const r = exportRun(p);
    assert.equal(r.status, 3, r.stdout + r.stderr);
    assert.match(r.stderr, /REFUSED/);
    assert.equal(r.stdout.includes('zq81-invented'), false);
    assert.equal(r.stderr.includes('zq81-invented'), false, 'the secret value must never be printed');
    assert.equal(existsSync(bundle(p)), false);
  } finally { rmSync(p.root, { recursive: true, force: true }); }
});

test('scaffold: new-project.mjs ships derived scripts + _lib and records a baseline; export from it skips every kit file', () => {
  const root = mkdtempSync(join(tmpdir(), 'kitscaf-'));
  try {
    const r = node([join(KIT, 'scripts', 'new-project.mjs'), 'scaf'], { cwd: root });
    assert.equal(r.status, 0, r.stderr);
    const proj = join(root, 'scaf');
    for (const f of ['kit-version.mjs', 'kit-staging-export.mjs', 'check-task-independence.mjs']) assert.ok(existsSync(join(proj, 'scripts', f)), f);
    assert.ok(existsSync(join(proj, 'scripts', '_lib', 'kit-tree.mjs')));
    assert.equal(existsSync(join(proj, 'scripts', 'kit-ingest.mjs')), false);
    const mk = JSON.parse(readFileSync(join(proj, '.kit-project.json'), 'utf8'));
    assert.ok(Object.keys(mk.baseline).length > 30);
    const e = node([join(proj, 'scripts', 'kit-staging-export.mjs'), '--no-archive'], { cwd: proj });
    assert.equal(e.status, 0, e.stderr);
    const dir = join(proj, '.kit-staging-export', `kit-staging-export-scaf-${new Date().toISOString().slice(0, 10)}`);
    const m = JSON.parse(readFileSync(join(dir, 'kit-staging-export.json'), 'utf8'));
    assert.equal(m.additions.length, 0, 'a fresh scaffold must not re-export the kit as candidates');
    assert.equal(m.proposals.length, 0);
    assert.ok(m.counts.unchangedKit > 30);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('unified-diff: diff then apply round-trips, incl. no trailing newline, add and delete', () => {
  const cases = [
    ['a\nb\nc\n', 'a\nB\nc\nd\n'],
    ['a\nb\nc', 'a\nb\nc\n'],
    ['a\nb\nc\n', 'a\nb\nc'],
    ['', 'x\ny\n'],
    ['one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\n', 'ONE\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nTEN\n'],
  ];
  for (const [a, b] of cases) {
    const d = unifiedDiff(a, b, 'f.txt');
    assert.ok(d);
    const r = applyFilePatch(a, parsePatch(d)[0]);
    assert.ok(r.ok, r.errors.join());
    assert.equal(r.text, b);
  }
  assert.equal(unifiedDiff('same\n', 'same\n', 'f.txt'), '');
  const add = parsePatch(unifiedDiff(null, 'n\n', 'n.txt'))[0];
  assert.equal(applyFilePatch(null, add).text, 'n\n');
  // a hunk that no longer matches is reported, not forced
  const d = unifiedDiff('a\nb\nc\n', 'a\nB\nc\n', 'f.txt');
  assert.equal(applyFilePatch('x\ny\nz\n', parsePatch(d)[0]).ok, false);
});

test('proposal-check: applies an exported proposal to a scratch kit and reports a verdict; the live kit is untouched', () => {
  const p = shellProject();
  try {
    appendFileSync(join(p.shell, 'scripts', 'escalate.mjs'), '\n// invented local edit\n');
    exportRun(p);
    const before = readFileSync(join(KIT, 'scripts', 'escalate.mjs'), 'utf8');
    const r = node([join(KIT, 'scripts', 'kit-proposal-check.mjs'), bundle(p), '--no-selftest', '--json']);
    const rep = JSON.parse(r.stdout);
    assert.equal(rep.length, 1);
    assert.equal(rep[0].applied, 'patch');
    assert.ok(rep[0].gate.validate, 'the gate must have been run on the scratch copy');
    assert.match(rep[0].verdict, /^(PASS|FAIL|INCONCLUSIVE)/);
    assert.equal(readFileSync(join(KIT, 'scripts', 'escalate.mjs'), 'utf8'), before);
  } finally { rmSync(p.root, { recursive: true, force: true }); }
});
