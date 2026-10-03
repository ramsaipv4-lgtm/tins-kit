// Tests for scripts/kit-sync.mjs: tombstones, --exclude, conflicts, KIT-VERSION record (red-team H5).
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SYNC = join(KIT, 'scripts', 'kit-sync.mjs');

function setup() {
  const root = mkdtempSync(join(tmpdir(), 'kitsync-'));
  const kit = join(root, 'fake kit'); // a space in the path on purpose
  const proj = join(root, 'proj');
  mkdirSync(join(kit, 'lib', 'patterns'), { recursive: true });
  mkdirSync(join(kit, 'prompts'), { recursive: true });
  mkdirSync(join(kit, 'examples'), { recursive: true });
  mkdirSync(join(kit, 'kit-staging'), { recursive: true });
  mkdirSync(proj);
  writeFileSync(join(kit, 'lib', 'patterns', 'alpha.md'), '# Alpha\n');
  writeFileSync(join(kit, 'lib', 'patterns', 'beta.md'), '# Beta\n');
  writeFileSync(join(kit, 'prompts', 'p.md'), 'prompt v1\n');
  writeFileSync(join(kit, 'examples', 'big.md'), 'never vendored\n');
  writeFileSync(join(kit, 'kit-staging', 'x.md'), 'inbox\n');
  return { root, kit, proj, dst: join(proj, 'tins-kit') };
}
const sync = (ctx, extra = []) => spawnSync(process.execPath, [SYNC, `--from=${ctx.kit}`, `--to=${ctx.proj}`, ...extra], { encoding: 'utf8' });
const marker = (ctx) => JSON.parse(readFileSync(join(ctx.dst, '.kit-sync.json'), 'utf8'));

test('sync: copies kit files, never examples/ or kit-staging/, records hashes and kit identity', () => {
  const c = setup();
  try {
    const r = sync(c);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.ok(existsSync(join(c.dst, 'lib', 'patterns', 'alpha.md')));
    assert.equal(existsSync(join(c.dst, 'examples')), false);
    assert.equal(existsSync(join(c.dst, 'kit-staging')), false);
    const m = marker(c);
    assert.ok(m.files['prompts/p.md']);
    assert.equal(m.kitVersion, 'unversioned');
    assert.match(r.stderr, /no KIT-VERSION/);
  } finally { rmSync(c.root, { recursive: true, force: true }); }
});

test('sync: --exclude skips a prefix and a glob', () => {
  const c = setup();
  try {
    const r = sync(c, ['--exclude=prompts/,lib/patterns/b*.md']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(existsSync(join(c.dst, 'prompts')), false);
    assert.ok(existsSync(join(c.dst, 'lib', 'patterns', 'alpha.md')));
    assert.equal(existsSync(join(c.dst, 'lib', 'patterns', 'beta.md')), false);
  } finally { rmSync(c.root, { recursive: true, force: true }); }
});

test('sync: a locally edited file is not overwritten; kit-only change updates; both changed = conflict (exit 1)', () => {
  const c = setup();
  try {
    sync(c);
    // project edits prompts/p.md; kit unchanged -> left alone
    writeFileSync(join(c.dst, 'prompts', 'p.md'), 'local edit\n');
    let r = sync(c);
    assert.equal(r.status, 0);
    assert.equal(readFileSync(join(c.dst, 'prompts', 'p.md'), 'utf8'), 'local edit\n');
    assert.match(r.stdout, /Modified locally/);
    // kit changes the same file too -> conflict, still not written
    writeFileSync(join(c.kit, 'prompts', 'p.md'), 'prompt v2\n');
    r = sync(c);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /CONFLICTS/);
    assert.equal(readFileSync(join(c.dst, 'prompts', 'p.md'), 'utf8'), 'local edit\n');
    // --overwrite replaces it and keeps a backup
    r = sync(c, ['--overwrite']);
    assert.equal(r.status, 0);
    assert.equal(readFileSync(join(c.dst, 'prompts', 'p.md'), 'utf8'), 'prompt v2\n');
    const bak = join(c.dst, '.kit-sync-backup');
    assert.ok(existsSync(bak) && readdirSync(bak).length === 1);
    // an untouched file with a kit change updates cleanly
    writeFileSync(join(c.kit, 'lib', 'patterns', 'alpha.md'), '# Alpha v2\n');
    r = sync(c);
    assert.equal(r.status, 0);
    assert.equal(readFileSync(join(c.dst, 'lib', 'patterns', 'alpha.md'), 'utf8'), '# Alpha v2\n');
  } finally { rmSync(c.root, { recursive: true, force: true }); }
});

test('sync: a retracted pattern gets a tombstone and a warning; new copies do not receive it; reinstating removes the tombstone', () => {
  const c = setup();
  try {
    sync(c);
    writeFileSync(join(c.kit, 'lib', 'patterns', 'alpha.md'), '---\nid: alpha\nstatus: retracted\nsuperseded_by: beta\nreason: was wrong\n---\n# Alpha\n');
    let r = sync(c);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stderr, /alpha is retracted/);
    const tomb = join(c.dst, 'lib', 'patterns', 'alpha.tombstone.md');
    assert.ok(existsSync(tomb));
    const text = readFileSync(tomb, 'utf8');
    assert.match(text, /RETRACTED/);
    assert.match(text, /beta/);
    assert.match(text, /was wrong/);
    // a fresh project must not vendor the retracted pattern at all
    const proj2 = join(c.root, 'proj2');
    mkdirSync(proj2);
    r = spawnSync(process.execPath, [SYNC, `--from=${c.kit}`, `--to=${proj2}`], { encoding: 'utf8' });
    assert.equal(r.status, 0);
    assert.equal(existsSync(join(proj2, 'tins-kit', 'lib', 'patterns', 'alpha.md')), false);
    assert.match(r.stdout, /Not vendored/);
    // reinstate
    writeFileSync(join(c.kit, 'lib', 'patterns', 'alpha.md'), '---\nid: alpha\nstatus: active\n---\n# Alpha\n');
    sync(c);
    assert.equal(existsSync(tomb), false);
  } finally { rmSync(c.root, { recursive: true, force: true }); }
});

test('sync: records the stamped KIT-VERSION and warns when it is stale', () => {
  const c = setup();
  try {
    const stamp = spawnSync(process.execPath, [join(KIT, 'scripts', 'kit-version.mjs'), '--root', c.kit, '--write', '--label', '7.0.0'], { encoding: 'utf8' });
    assert.equal(stamp.status, 0, stamp.stderr);
    let r = sync(c);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(marker(c).kitVersion, '7.0.0');
    assert.equal(marker(c).kitVersionStale, false);
    // a vendored copy of an untouched sync hashes the same as its source
    const v = spawnSync(process.execPath, [join(KIT, 'scripts', 'kit-version.mjs'), '--root', c.dst, '--check'], { encoding: 'utf8' });
    assert.equal(v.status, 0, v.stdout);
    writeFileSync(join(c.kit, 'prompts', 'p.md'), 'changed after stamping\n');
    r = sync(c);
    assert.match(r.stderr, /stale/);
    assert.equal(marker(c).kitVersionStale, true);
  } finally { rmSync(c.root, { recursive: true, force: true }); }
});

test('sync: --dry-run writes nothing', () => {
  const c = setup();
  try {
    const r = sync(c, ['--dry-run']);
    assert.equal(r.status, 0);
    assert.equal(existsSync(c.dst), false);
  } finally { rmSync(c.root, { recursive: true, force: true }); }
});
