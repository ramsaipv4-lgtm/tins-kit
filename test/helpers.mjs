// Test helpers: real temporary git repositories driven through the real CLI (no mocks).
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const KIT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const ENV = (() => {
  const e = { ...process.env, GIT_AUTHOR_NAME: 'kit-test', GIT_AUTHOR_EMAIL: 'kit-test@example.invalid',
    GIT_COMMITTER_NAME: 'kit-test', GIT_COMMITTER_EMAIL: 'kit-test@example.invalid', GIT_CONFIG_NOSYSTEM: '1',
    FORCE_COLOR: '0' };
  for (const k of Object.keys(e)) if (k.startsWith('NODE_TEST_')) delete e[k]; // a nested gate must not report to us
  return e;
})();

export function tmp(label) { return mkdtempSync(join(tmpdir(), `tins-${label}-`)); }
export const cleanup = (...dirs) => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }); } catch {} } };

export function sh(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, env: ENV, encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}
export const git = (cwd, ...args) => {
  const r = sh('git', args, cwd);
  if (r.code !== 0) throw new Error(`git ${args.join(' ')}: ${r.out}`);
  return r.out.trim();
};

/** Run a kit binary. `kitRoot` defaults to the kit under test; projects use their vendored copy. */
export function kit(cwd, args, kitRoot = KIT) { return sh(process.execPath, [join(kitRoot, 'bin', 'kit.mjs'), ...args], cwd); }
export const vkit = (cwd, args) => kit(cwd, args, join(cwd, '.tins', 'kit'));

/** A disposable copy of the kit under test, as its own canonical git repository (for import/promote). */
export function centralKit() {
  const d = tmp('central');
  cpSync(KIT, d, { recursive: true, filter: (src) => {
    const rel = src.slice(KIT.length).replace(/\\/g, '/');
    return !/^\/(?:\.git|inbox|test)(?:\/|$)/.test(rel);
  } });
  git(d, 'init', '-q'); git(d, 'add', '-A'); git(d, 'commit', '-q', '-m', 'central kit');
  return d;
}

/** A fresh knowledge-enforced cli project scaffolded by `kitRoot`. */
export function project(label, kitRoot = KIT, type = 'cli') {
  const parent = tmp(label); const dir = join(parent, label);
  const r = kit(parent, ['new', dir, '--type', type], kitRoot);
  if (r.code !== 0) throw new Error(`kit new failed: ${r.out}`);
  return { dir, parent };
}

export function write(dir, rel, text) { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); }
export const read = (dir, rel) => readFileSync(join(dir, rel), 'utf8');

/** Add a SPEC row pair and its check test: the minimum real behaviour change. */
export function behaviourChange(dir, n, text = 'shout returns the name in capitals') {
  const spec = read(dir, 'SPEC.md')
    .replace('\n\n## Acceptance', `\n| D-${n} | ${text} | locked | test change |\n\n## Acceptance`)
    .replace('\n\n## Out of scope', `\n| AC-${n} | test/f${n}.test.mjs | ${text} |\n\n## Out of scope`);
  write(dir, 'SPEC.md', spec);
  write(dir, `src/f${n}.mjs`, `export const f${n} = (s) => String(s).toUpperCase();\n`);
  write(dir, `test/f${n}.test.mjs`, `// AC-${n}\nimport { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { f${n} } from '../src/f${n}.mjs';\ntest('AC-${n}', () => assert.equal(f${n}('a'), 'A'));\n`);
}
