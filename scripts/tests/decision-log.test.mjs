// scripts/tests/decision-log.test.mjs: decision-log.mjs (Date line, numbering, refusal on collisions) and
// kit-listing.mjs / kit-new-pattern.mjs (front-matter aware). Fixtures only.
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DLOG = join(KIT, 'scripts', 'decision-log.mjs');
const LISTING = join(KIT, 'scripts', 'kit-listing.mjs');
const { loadPatterns } = await import(pathToFileURL(join(KIT, 'scripts', '_lib', 'pattern-meta.mjs')).href);

function proj(content) {
  const d = mkdtempSync(join(tmpdir(), 'dlog proj-'));
  writeFileSync(join(d, 'BUILDER-DECISIONS-REVIEW.md'), content);
  return d;
}
const run = (d, args, side = 'builder') =>
  spawnSync(process.execPath, [DLOG, side, `--dir=${d}`, ...args], { encoding: 'utf8', cwd: tmpdir() });
const read = (d) => readFileSync(join(d, 'BUILDER-DECISIONS-REVIEW.md'), 'utf8');

test('decision-log: kit style (## D<n>) gets the next number from the whole file and a Date line', () => {
  const d = proj('# log\n\n## D1 — one\n\n**Date:** 2026-01-01\n\n## D7 — seven\n');
  try {
    const r = run(d, ['--title=eight', '--date=2026-10-02']);
    assert.equal(r.status, 0, r.stderr);
    const t = read(d);
    assert.match(t, /## D8 — eight\n\n\*\*Date:\*\* 2026-10-02/);
    assert.ok(t.includes('## D7 — seven'), 'existing text untouched (append only)');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('decision-log: template style (### Decision N) is followed, numbering sees both styles', () => {
  const d = proj('# log\n\n### Decision 3 — three\n\n**Date:** 2026-01-01\n\n## D9 — nine (older style)\n');
  try {
    const r = run(d, ['--title=ten']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(read(d), /^## D10 — ten$/m); // majority style here is level-2 tie -> kit style; number is what matters
  } finally { rmSync(d, { recursive: true, force: true }); }
  const e = proj('# log\n\n### Decision 1 — a\n\n### Decision 2 — b\n');
  try {
    assert.equal(run(e, ['--title=c', '--cross-refs=x']).status, 0);
    assert.match(read(e), /^### Decision 3 — c$/m);
    assert.match(read(e), /\*\*Date:\*\* \d{4}-\d{2}-\d{2}/);
  } finally { rmSync(e, { recursive: true, force: true }); }
});

test('decision-log: a fenced example heading in the file does not move the counter', () => {
  const d = proj('# log\n\n```markdown\n### Decision 40 — example\n```\n\n### Decision 2 — real\n');
  try {
    assert.equal(run(d, ['--title=next']).status, 0);
    assert.match(read(d), /^### Decision 3 — next$/m);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('decision-log: --number refuses a duplicate; refuses an unclaimed number where claims are used', () => {
  const d = proj('# log\n\n### Decision 1 — a\n\n### Decision 2 — b\n');
  try {
    assert.equal(run(d, ['--title=dup', '--number=2']).status, 1);
    assert.equal(run(d, ['--title=ok', '--number=5']).status, 0);
    assert.match(read(d), /^### Decision 5 — ok$/m);
    // claims directory present: bare allocation refused, unclaimed number refused, claimed number accepted
    mkdirSync(join(d, 'sessions', 'claims', 'decision-number'), { recursive: true });
    writeFileSync(join(d, 'sessions', 'claims', 'decision-number', '6'), 'claimed by s1\n');
    const bare = run(d, ['--title=bare']);
    assert.equal(bare.status, 1);
    assert.match(bare.stderr, /session\.mjs claim decision-number/);
    assert.equal(run(d, ['--title=unclaimed', '--number=7']).status, 1);
    assert.equal(run(d, ['--title=mine', '--number=6']).status, 0);
    assert.match(read(d), /^### Decision 6 — mine$/m);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('decision-log: usage errors', () => {
  const d = proj('# log\n');
  try {
    assert.equal(run(d, []).status, 2);                              // no title
    assert.equal(run(d, ['--title=x', '--date=yesterday']).status, 2);
    assert.equal(run(d, ['--title=x', '--number=0']).status, 2);
    assert.equal(spawnSync(process.execPath, [DLOG, 'nobody', '--title=x'], { encoding: 'utf8' }).status, 2);
    assert.equal(run(join(d, 'missing'), ['--title=x']).status, 2);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('decision-log: reviewer log gets a Date line and an R number', () => {
  const d = mkdtempSync(join(tmpdir(), 'dlog rev-'));
  try {
    writeFileSync(join(d, 'REVIEWER-DECISIONS-REVIEW.md'), '# r\n\n## R2 — two\n');
    const r = run(d, ['--title=three', '--evidence=a;b'], 'reviewer');
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(join(d, 'REVIEWER-DECISIONS-REVIEW.md'), 'utf8'), /## R3 — three\n\n\*\*Date:\*\* \d{4}/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('kit-listing: titles skip front matter; counts count each file once', () => {
  const root = mkdtempSync(join(tmpdir(), 'list root-'));
  try {
    mkdirSync(join(root, 'lib', 'patterns'), { recursive: true });
    mkdirSync(join(root, 'lib', 'money'), { recursive: true });
    mkdirSync(join(root, 'scripts', '_lib'), { recursive: true });
    mkdirSync(join(root, 'prompts'));
    writeFileSync(join(root, 'lib', 'patterns', 'p.md'), '---\nid: p\nsolves: "s"\ntriggers: [a]\nstatus: active\n---\n# `p` — kit pattern\n');
    writeFileSync(join(root, 'lib', 'patterns', 'q.md'), '# Plain title\n');
    writeFileSync(join(root, 'lib', 'money', 'index.ts'), '// money\n');
    writeFileSync(join(root, 'scripts', 'a.mjs'), '// a\n');
    writeFileSync(join(root, 'scripts', '_lib', 'l.mjs'), '// l\n');
    const r = spawnSync(process.execPath, [LISTING, `--root=${root}`, '--json'], { encoding: 'utf8', cwd: tmpdir() });
    assert.equal(r.status, 0, r.stderr);
    const j = JSON.parse(r.stdout);
    assert.equal(j.counts.patterns, 2);
    assert.equal(j.counts.lib, 1, 'lib/patterns must not be counted again under lib');
    assert.equal(j.counts.scripts, 1, 'scripts/_lib is its own kind');
    assert.equal(j.counts['script-libs'], 1);
    assert.equal(j.counts.total, Object.entries(j.counts).filter(([k]) => k !== 'total').reduce((a, [, v]) => a + v, 0));
    const titles = Object.fromEntries(j.patterns.items.map((i) => [i.path, i.title]));
    assert.equal(titles['lib/patterns/p.md'], '`p` — kit pattern');
    assert.equal(titles['lib/patterns/q.md'], 'Plain title');
    assert.equal(j.patterns.items[0].frontMatter, true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('kit-new-pattern: the scaffold has front matter that the shared parser accepts', () => {
  const kit = mkdtempSync(join(tmpdir(), 'newpat kit-'));
  try {
    mkdirSync(join(kit, 'scripts', '_lib'), { recursive: true });
    for (const f of ['kit-new-pattern.mjs']) writeFileSync(join(kit, 'scripts', f), readFileSync(join(KIT, 'scripts', f)));
    writeFileSync(join(kit, 'scripts', '_lib', 'pattern-meta.mjs'), readFileSync(join(KIT, 'scripts', '_lib', 'pattern-meta.mjs')));
    mkdirSync(join(kit, 'lib', 'patterns'), { recursive: true });
    const r = spawnSync(process.execPath, [join(kit, 'scripts', 'kit-new-pattern.mjs'), 'demo-thing'], { encoding: 'utf8', cwd: tmpdir() });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(readdirSync(join(kit, 'lib', 'patterns')), ['demo-thing.md']);
    const [p] = loadPatterns(join(kit, 'lib', 'patterns'));
    assert.deepEqual(p.errors, []);
    assert.equal(p.meta.id, 'demo-thing');
    assert.equal(p.meta.verified, null);
    assert.ok(p.body.startsWith('# `demo-thing`'));
    assert.ok(existsSync(join(kit, 'lib', 'patterns', 'demo-thing.md')));
  } finally { rmSync(kit, { recursive: true, force: true }); }
});
