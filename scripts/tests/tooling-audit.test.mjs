// tooling-audit.test.mjs — the blocking gate, including the offline (no web search) path.
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'tooling-audit.mjs');
const dir = mkdtempSync(join(tmpdir(), 'tooling-audit-test-'));
test.after(() => rmSync(dir, { recursive: true, force: true }));

const TABLE = `
| Capability gap | Candidate | Source | Verdict | Priority | Status | Handicap / audit note |
|---|---|---|---|---|---|---|
| query the database | db-mcp | https://example.invalid | SAFE | REQUIRED | installed | - |
`;
const WAIVER = '**Offline waiver:** signed by Asha Raman on 2026-01-15 — no web search in this harness, so no MCP or skill discovery was done and every tool assumption is from memory.';

function gate(body) {
  const f = join(dir, 'TOOLING-AUDIT.md');
  writeFileSync(f, body);
  const r = spawnSync(process.execPath, [SCRIPT, `--file=${f}`], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

test('online audit that is complete passes (unchanged behaviour)', () => {
  assert.equal(gate(`**Audit status:** complete\n${TABLE}`).code, 0);
});

test('offline mode with NO waiver stays red even though every row is installed', () => {
  const r = gate(`**Audit status:** complete\n**Discovery mode:** offline\n${TABLE}`);
  assert.equal(r.code, 1);
  assert.match(r.out, /no "\*\*Offline waiver:\*\*/);
});

test('offline mode with a placeholder, an agent-named, or a thin waiver stays red', () => {
  const base = '**Audit status:** complete\n**Discovery mode:** offline\n';
  assert.equal(gate(`${base}**Offline waiver:** signed by <your full name> on <YYYY-MM-DD> — <x>\n${TABLE}`).code, 1);
  assert.equal(gate(`${base}${WAIVER.replace('Asha Raman', 'Claude')}\n${TABLE}`).code, 1);
  assert.equal(gate(`${base}**Offline waiver:** signed by Asha Raman on 2026-01-15 — no search.\n${TABLE}`).code, 1);
  assert.equal(gate(`${base}${WAIVER.replace('2026-01-15', '2999-01-01')}\n${TABLE}`).code, 1);
});

test('offline mode with a well-formed human waiver goes green; REQUIRED pending still blocks', () => {
  const base = '**Audit status:** complete\n**Discovery mode:** offline\n';
  assert.equal(gate(`${base}${WAIVER}\n${TABLE}`).code, 0);
  assert.equal(gate(`${base}${WAIVER}\n${TABLE.replace('installed', 'pending')}`).code, 1);
});

test('--print-offline-waiver prints the template and exits 0; missing file points at it', () => {
  const r = spawnSync(process.execPath, [SCRIPT, '--print-offline-waiver'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Offline waiver/);
  const m = spawnSync(process.execPath, [SCRIPT, `--file=${join(dir, 'nope.md')}`], { encoding: 'utf8' });
  assert.equal(m.status, 2);
  assert.match(m.stderr, /offline path/);
});
