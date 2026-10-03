// Tests for scripts/kit-version.mjs and scripts/_lib/kit-tree.mjs (kit identity, round-1 consistency C2).
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeKitHash, parseKitVersion, formatKitVersion, readPatternStatus, scrubUrl } from '../_lib/kit-tree.mjs';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VERSION = join(KIT, 'scripts', 'kit-version.mjs');

function fakeKit() {
  const d = mkdtempSync(join(tmpdir(), 'kitver-'));
  mkdirSync(join(d, 'lib', 'patterns'), { recursive: true });
  mkdirSync(join(d, 'docs', 'changes'), { recursive: true });
  mkdirSync(join(d, 'kit-staging', 'inbox'), { recursive: true });
  writeFileSync(join(d, 'lib', 'patterns', 'alpha.md'), '# Alpha\nline\n');
  writeFileSync(join(d, 'README.md'), 'Invented kit\n');
  return d;
}
const run = (args) => spawnSync(process.execPath, [VERSION, ...args], { encoding: 'utf8' });

test('kit-version: --check fails with no KIT-VERSION, --write stamps, --check then passes', () => {
  const d = fakeKit();
  try {
    assert.equal(run(['--root', d, '--check']).status, 1);
    const w = run(['--root', d, '--write', '--label', '3.1.0']);
    assert.equal(w.status, 0, w.stderr);
    const parsed = parseKitVersion(readFileSync(join(d, 'KIT-VERSION'), 'utf8'));
    assert.equal(parsed.label, '3.1.0');
    assert.match(parsed.hash, /^[0-9a-f]{64}$/);
    assert.equal(run(['--root', d, '--check']).status, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('kit-version: editing a kit file makes --check fail; --write is idempotent when current', () => {
  const d = fakeKit();
  try {
    run(['--root', d, '--write', '--label', '1.0.0']);
    const before = readFileSync(join(d, 'KIT-VERSION'), 'utf8');
    assert.match(run(['--root', d, '--write']).stdout, /already current/);
    assert.equal(readFileSync(join(d, 'KIT-VERSION'), 'utf8'), before);
    writeFileSync(join(d, 'README.md'), 'changed\n');
    assert.equal(run(['--root', d, '--check']).status, 1);
    run(['--root', d, '--write', '--bump', 'minor']);
    assert.equal(parseKitVersion(readFileSync(join(d, 'KIT-VERSION'), 'utf8')).label, '1.1.0');
    assert.equal(run(['--root', d, '--check']).status, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('kit hash ignores docs/changes, kit-staging, _to_delete, KIT-VERSION and tombstones; CRLF-insensitive', () => {
  const d = fakeKit();
  try {
    const h0 = computeKitHash(d).hash;
    writeFileSync(join(d, 'docs', 'changes', 'note.md'), 'x');
    writeFileSync(join(d, 'kit-staging', 'inbox', 'a.md'), 'x');
    mkdirSync(join(d, '_to_delete'));
    writeFileSync(join(d, '_to_delete', 'old.md'), 'x');
    writeFileSync(join(d, 'KIT-VERSION'), 'label: 9\nhash: sha256:00\n');
    writeFileSync(join(d, 'lib', 'patterns', 'alpha.tombstone.md'), 'gone');
    assert.equal(computeKitHash(d).hash, h0);
    writeFileSync(join(d, 'lib', 'patterns', 'alpha.md'), '# Alpha\r\nline\r\n');
    assert.equal(computeKitHash(d).hash, h0, 'CRLF checkout must hash like LF');
    writeFileSync(join(d, 'lib', 'patterns', 'alpha.md'), '# Alpha\nline2\n');
    assert.notEqual(computeKitHash(d).hash, h0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('KIT-VERSION format round-trips; pattern status and URL scrubbing helpers', () => {
  const t = formatKitVersion({ label: '2.0.0', hash: 'ab'.repeat(32), date: '2026-01-01', files: 3 });
  assert.deepEqual(parseKitVersion(t), { label: '2.0.0', hash: 'ab'.repeat(32), date: '2026-01-01', files: 3 });
  assert.deepEqual(readPatternStatus('---\nid: x\nstatus: retracted\nsuperseded_by: y\nreason: "bad"\n---\nbody'), { status: 'retracted', supersededBy: 'y', reason: 'bad' });
  assert.equal(readPatternStatus('# no front matter').status, 'active');
  assert.equal(scrubUrl('https://user:tok@example.com/a/b.git'), 'https://example.com/a/b.git');
  assert.equal(scrubUrl('git@example.com:a/b.git'), 'git@example.com:a/b.git');
});

test('kit-version: a scaffold marker reports the recorded baseline instead of hashing the project', () => {
  const d = mkdtempSync(join(tmpdir(), 'kitver-sc-'));
  try {
    mkdirSync(join(d, 'scripts'));
    writeFileSync(join(d, '.kit-project.json'), JSON.stringify({ kitVersion: '2.0.0', kitHash: 'cd'.repeat(32) }));
    // run a copy of the script from inside the scaffold so its default root is the scaffold
    const r = spawnSync(process.execPath, [VERSION, '--root', d], { encoding: 'utf8' });
    assert.equal(r.status, 0);
    assert.equal(existsSync(join(d, 'KIT-VERSION')), false);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
