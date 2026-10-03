// scripts/tests/orchestrate.test.mjs — round-1B WP-A: dispatch really works.
//
// Drives scripts/orchestrate.mjs as a subprocess against throwaway projects,
// with a FAKE worker CLI (a tiny node script) instead of a real model CLI.
// Proves: every placeholder is filled (and a missing one stops the wave before
// anything is spawned); the worker command is an argv array so shell
// metacharacters in a task id / adapter name / path are never executed; the
// relay adapter times out loudly and completes on RESULT.json; legacy
// `workerCmd` loses its shell. The pre-existing orchestrate tests live in
// scripts/selftest.mjs and are not duplicated here.

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORCH = join(KIT, 'scripts', 'orchestrate.mjs');

// The fake worker: records its argv, stdin and the packet it was pointed at,
// then writes RESULT.json (unless FAKE_NO_RESULT) and exits with FAKE_EXIT.
const FAKE_WORKER = `
import { writeFileSync, readFileSync } from 'node:fs';
const out = process.env.FAKE_OUT;
let stdin = '';
if (!process.stdin.isTTY) { try { stdin = readFileSync(0, 'utf8'); } catch {} }
const argv = process.argv.slice(2);
const packetArg = argv.find((a) => /PACKET\\.md/.test(a)) || '';
const m = packetArg.match(/Read (.+PACKET\\.md) and follow/);
let packet = '';
if (m) { try { packet = readFileSync(m[1], 'utf8'); } catch {} }
writeFileSync(out + '.' + (process.env.TINS_TASK_ID || 'x') + '.json', JSON.stringify({ argv, stdin, packet, env: process.env.TINS_TASK_ID }));
if (!process.env.FAKE_NO_RESULT && process.env.TINS_RESULT_FILE) {
  writeFileSync(process.env.TINS_RESULT_FILE, JSON.stringify({ task: process.env.TINS_TASK_ID, status: 'returned', gate_exit: 0, summary: 'fake' }));
}
process.exit(Number(process.env.FAKE_EXIT || 0));
`;

const GOOD_BRIEF = `# Task brief: widget

## Context
A widget lives in the shop.

## Scope
Build the widget module quickly.

## Interface contract
export function widget(n: number): string

## Acceptance criteria
1. widget(2) returns "ww"

## Out of scope
- the gadget
`;

async function makeProject(opts = {}) {
  const base = await mkdtemp(join(tmpdir(), 'tins-orchtest-'));
  const root = join(base, opts.dirName || 'proj');
  await mkdir(join(root, 'delegation', 'tasks'), { recursive: true });
  const fake = join(base, 'fake-worker.mjs');
  await writeFile(fake, FAKE_WORKER);
  const rows = opts.rows || ['| T1 | auditor-remote | ready | me | — | `src/widget.ts`; `src/widget.test.ts` |'];
  const header = opts.header || '| Task | Mode | Status | Assignee | Depends | Touched files |';
  await writeFile(
    join(root, 'delegation', 'LEDGER.md'),
    ['# LEDGER', '', '**Execution mode for this round:** auditor-remote', '', header, header.replace(/[^|]/g, '-'), ...rows, ''].join('\n'),
  );
  const config = opts.config || {
    adapter: 'fake',
    adapters: { fake: { argv: ['{{NODE}}', fake, '{{POINTER}}', '{{TASK_ID}}'] } },
    maxParallel: 2,
    maxRetries: 1,
    tierPolicy: { autoDecide: ['T0', 'T1'] },
  };
  await writeFile(join(root, 'delegation', 'ORCHESTRATION.json'), JSON.stringify(config, null, 2));
  if (opts.brief !== null) {
    const id = opts.briefFor || 'T1';
    await mkdir(join(root, 'delegation', 'tasks', id), { recursive: true });
    await writeFile(join(root, 'delegation', 'tasks', id, 'BRIEF.md'), opts.brief ?? GOOD_BRIEF);
  }
  return { base, root, fake, out: join(base, 'out') };
}

function run(args, cwd, env = {}, onSpawn) {
  return new Promise((res) => {
    const child = spawn(process.execPath, [ORCH, ...args], { cwd, env: { ...process.env, ...env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => res({ code, stdout, stderr, all: stdout + stderr }));
    if (onSpawn) onSpawn(child);
  });
}

async function withProject(opts, fn) {
  const p = await makeProject(opts);
  try {
    return await fn(p);
  } finally {
    await rm(p.base, { recursive: true, force: true });
  }
}

test('orchestrate dispatch — renders PACKET.md with every placeholder filled and hands the worker a short pointer', async () => {
  await withProject({}, async (p) => {
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 0, r.all);
    const rec = JSON.parse(await readFile(`${p.out}.T1.json`, 'utf8'));
    assert.match(rec.argv[0], /Read .*PACKET\.md and follow it exactly/);
    assert.ok(rec.argv[0].length < 400, 'the worker argument is a pointer, not the prompt');
    const packet = await readFile(join(p.root, 'delegation', 'tasks', 'T1', 'PACKET.md'), 'utf8');
    assert.equal(rec.packet, packet, 'the worker read the same file that is on disk');
    assert.doesNotMatch(packet, /\{\{/, 'no placeholder left');
    assert.match(packet, /Build the widget module quickly/);
    assert.match(packet, /src\/widget\.ts/);
    assert.match(packet, /widget\(2\) returns/);
    assert.match(packet, /export function widget/);
    assert.match(packet, /T0, T1/);
    assert.doesNotMatch(packet, /\$PWD/, '$PWD is replaced with the real project root');
    assert.ok(packet.includes(p.root));
    assert.match(packet, /RESULT\.json/);
    assert.match(r.stdout, /RESULT\.json: returned/);
  });
});

test('orchestrate dispatch — a missing value stops the wave before anything is spawned', async () => {
  const noCriteria = GOOD_BRIEF.replace(/## Acceptance criteria[\s\S]*?## Out/, '## Out');
  await withProject({ brief: noCriteria }, async (p) => {
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /ACCEPTANCE_CRITERIA/);
    assert.ok(!existsSync(`${p.out}.T1.json`), 'the worker must not have been started');
    assert.ok(!existsSync(join(p.root, 'delegation', 'tasks', 'T1', 'PACKET.md')), 'no half-rendered packet is left behind');
  });
  await withProject({ brief: null }, async (p) => {
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /BRIEF\.md/);
    assert.ok(!existsSync(`${p.out}.T1.json`));
  });
  await withProject({ brief: GOOD_BRIEF.replace('A widget lives in the shop.', '<2-5 sentences>').replace('Build the widget module quickly.', '<Scope>') }, async (p) => {
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 2, 'an unfilled TASK-BRIEF.md template is not a brief: ' + r.all);
    assert.match(r.all, /TASK_BRIEF/);
  });
});

test('orchestrate dispatch — an empty Touched files cell fails the packet', async () => {
  await withProject({ rows: ['| T1 | auditor-remote | ready | me | — |  |'] }, async (p) => {
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /TOUCHED_FILES/);
  });
});

test('orchestrate dispatch — a shell-metacharacter task id is refused, never executed', async () => {
  for (const id of ['T1;touch PWNED', 'T1$(touch PWNED)', 'T1`touch PWNED`', '../escape']) {
    await withProject({ rows: [`| ${id} | auditor-remote | ready | me | — | \`a.ts\` |`], brief: null }, async (p) => {
      const r = await run([], p.root, { FAKE_OUT: p.out });
      assert.equal(r.code, 2, `${id}: ${r.all}`);
      assert.match(r.all, /not a safe id/);
      assert.ok(!existsSync(join(p.root, 'PWNED')) && !existsSync(join(p.root, 'delegation', 'PWNED')) && !existsSync('PWNED'));
      assert.deepEqual((await readdir(p.base)).filter((n) => /PWNED|escape/.test(n)), []);
    });
  }
});

test('orchestrate dispatch — an adapter name from a ledger cell must be in the whitelist', async () => {
  const header = '| Task | Mode | Status | Assignee | Depends | Touched files | Adapter |';
  for (const name of ['fake; touch PWNED', '$(touch PWNED)', 'constructor', '__proto__', 'nope']) {
    await withProject({ header, rows: [`| T1 | auditor-remote | ready | me | — | \`a.ts\` | ${name} |`] }, async (p) => {
      const r = await run([], p.root, { FAKE_OUT: p.out });
      assert.equal(r.code, 2, `${name}: ${r.all}`);
      assert.match(r.all, /not in ORCHESTRATION\.json "adapters"/);
      assert.ok(!existsSync(`${p.out}.T1.json`));
      assert.ok(!existsSync(join(p.root, 'PWNED')));
    });
  }
  // and a whitelisted one chosen per task works
  await withProject({ header, rows: ['| T1 | auditor-remote | ready | me | — | `a.ts` | fake |'] }, async (p) => {
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 0, r.all);
  });
});

test('orchestrate dispatch — a project path full of shell metacharacters reaches the worker as one inert argument', async () => {
  await withProject({ dirName: 'my proj & (x) $(touch PWNED2) ;' }, async (p) => {
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 0, r.all);
    const rec = JSON.parse(await readFile(`${p.out}.T1.json`, 'utf8'));
    assert.equal(rec.argv.length, 2, 'pointer and task id: exactly two arguments, nothing split on spaces');
    assert.ok(rec.argv[0].includes(join(p.root, 'delegation', 'tasks', 'T1', 'PACKET.md')));
    assert.ok(!existsSync(join(p.root, 'PWNED2')) && !existsSync(join(p.base, 'PWNED2')));
    assert.match(rec.packet, /# PACKET — task T1/);
  });
});

test('orchestrate dispatch — legacy workerCmd runs without a shell: substitution and operators are refused', async () => {
  await withProject({ config: { workerCmd: 'echo $(cat {{PROMPT_FILE}})', maxParallel: 1 } }, async (p) => {
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /command substitution/);
  });
  await withProject({ config: { workerCmd: 'echo hi && touch PWNED', maxParallel: 1 } }, async (p) => {
    const r = await run([], p.root);
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /shell operator/);
    assert.ok(!existsSync(join(p.root, 'PWNED')));
  });
  // a plain legacy command still works, with {{PROMPT_FILE}} meaning the packet
  const p = await makeProject({});
  try {
    const cfg = { workerCmd: `"{{NODE}}" "${p.fake}" {{POINTER}} {{TASK_ID}}`, maxParallel: 1 };
    await writeFile(join(p.root, 'delegation', 'ORCHESTRATION.json'), JSON.stringify(cfg));
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 0, r.all);
    const rec = JSON.parse(await readFile(`${p.out}.T1.json`, 'utf8'));
    assert.match(rec.argv[0], /PACKET\.md and follow it exactly/);
  } finally {
    await rm(p.base, { recursive: true, force: true });
  }
});

test('orchestrate dispatch — stdin adapters receive the packet text on stdin', async () => {
  const p = await makeProject({});
  try {
    const cfg = { adapter: 'f', adapters: { f: { argv: ['{{NODE}}', p.fake, '{{TASK_ID}}'], stdin: 'packet' } } };
    await writeFile(join(p.root, 'delegation', 'ORCHESTRATION.json'), JSON.stringify(cfg));
    const r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 0, r.all);
    const rec = JSON.parse(await readFile(`${p.out}.T1.json`, 'utf8'));
    const packet = await readFile(join(p.root, 'delegation', 'tasks', 'T1', 'PACKET.md'), 'utf8');
    assert.equal(rec.stdin, packet);
    assert.deepEqual(rec.argv, ['T1']);
  } finally {
    await rm(p.base, { recursive: true, force: true });
  }
});

test('orchestrate dispatch — a failing worker exits 1; a missing executable is reported, not crashed on', async () => {
  await withProject({}, async (p) => {
    const r = await run([], p.root, { FAKE_OUT: p.out, FAKE_EXIT: '3' });
    assert.equal(r.code, 1, r.all);
    assert.match(r.stdout, /T1: exit 3/);
  });
  await withProject({ config: { adapter: 'ghost', adapters: { ghost: { argv: ['definitely-not-installed-xyz-123', '{{POINTER}}'] } } } }, async (p) => {
    const r = await run([], p.root);
    assert.equal(r.code, 1, r.all);
    assert.match(r.all, /not found on PATH/);
  });
});

test('orchestrate dispatch — relay times out loudly when no RESULT.json appears', async () => {
  const cfg = { adapter: 'relay', adapters: { relay: { type: 'relay', timeoutSeconds: 0.4, pollSeconds: 0.05 } } };
  await withProject({ config: cfg }, async (p) => {
    const r = await run([], p.root);
    assert.equal(r.code, 1, r.all);
    assert.match(r.stdout, /PACKET\.md/);
    assert.match(r.all, /timed out after 0\.4s waiting for .*RESULT\.json/);
    assert.ok(existsSync(join(p.root, 'delegation', 'tasks', 'T1', 'PACKET.md')), 'the packet was rendered for the human');
  });
});

test('orchestrate dispatch — relay completes when RESULT.json is written, and ignores a stale one', async () => {
  const cfg = { adapter: 'relay', adapters: { relay: { type: 'relay', timeoutSeconds: 30, pollSeconds: 0.05 } } };
  const p = await makeProject({ config: cfg });
  try {
    const tdir = join(p.root, 'delegation', 'tasks', 'T1');
    // a leftover result from an earlier attempt must not complete this one
    await writeFile(join(tdir, 'RESULT.json'), JSON.stringify({ task: 'T1', status: 'returned' }));
    const done = run([], p.root, {}, async () => {
      for (let i = 0; i < 300; i++) {
        if (existsSync(join(tdir, 'PACKET.md')) && !existsSync(join(tdir, 'RESULT.json'))) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      await new Promise((r) => setTimeout(r, 300));
      await writeFile(join(tdir, 'RESULT.json'), JSON.stringify({ task: 'T1', status: 'returned', gate_exit: 0 }));
    });
    const r = await done;
    assert.equal(r.code, 0, r.all);
    assert.match(r.stdout, /RESULT\.json: returned/);
    assert.ok((await readdir(tdir)).some((n) => /^RESULT\..*previous\.json$/.test(n)), 'the stale result was set aside');
  } finally {
    await rm(p.base, { recursive: true, force: true });
  }
  // a worker that reports failure makes the wave fail
  await withProject({ config: cfg }, async (q) => {
    const tdir = join(q.root, 'delegation', 'tasks', 'T1');
    const r = await run([], q.root, {}, async () => {
      for (let i = 0; i < 300 && !existsSync(join(tdir, 'PACKET.md')); i++) await new Promise((x) => setTimeout(x, 50));
      await writeFile(join(tdir, 'RESULT.json'), JSON.stringify({ task: 'T1', status: 'failed', summary: 'x' }));
    });
    assert.equal(r.code, 1, r.all);
  });
});

test('orchestrate dispatch — a promptFile override is rendered, and unknown placeholders or outside paths are refused', async () => {
  const header = '| Task | Mode | Status | Assignee | Depends | Touched files | Prompt file |';
  const p = await makeProject({ header, rows: ['| T1 | auditor-remote | ready | me | — | `a.ts` | custom.md |'] });
  try {
    await writeFile(join(p.root, 'custom.md'), '# my kit\n\n## The prompt\n\nCustom for {{TASK_ID}} touching {{TOUCHED_FILES}}.\n');
    let r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 0, r.all);
    const packet = await readFile(join(p.root, 'delegation', 'tasks', 'T1', 'PACKET.md'), 'utf8');
    assert.match(packet, /Custom for T1 touching `a\.ts`\./);
    await writeFile(join(p.root, 'custom.md'), 'Custom {{TASK_ID}} {{NOPE}}\n');
    r = await run([], p.root, { FAKE_OUT: p.out });
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /\{\{NOPE\}\}/);
  } finally {
    await rm(p.base, { recursive: true, force: true });
  }
  const q = await makeProject({ header, rows: [`| T1 | auditor-remote | ready | me | — | \`a.ts\` | ${process.platform === 'win32' ? 'C:\\\\Windows\\\\win.ini' : '/etc/hostname'} |`] });
  try {
    const r = await run([], q.root, { FAKE_OUT: q.out });
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /outside the project root and the kit/);
  } finally {
    await rm(q.base, { recursive: true, force: true });
  }
});

test('orchestrate dispatch — --dry-run reports packets and writes nothing; --render writes them without spawning', async () => {
  await withProject({}, async (p) => {
    const d = await run(['--dry-run', '--json'], p.root);
    assert.equal(d.code, 0, d.all);
    const plan = JSON.parse(d.stdout);
    assert.equal(plan.packets[0].ok, true);
    assert.ok(!existsSync(join(p.root, 'delegation', 'tasks', 'T1', 'PACKET.md')));
    const w = await run(['--render'], p.root, { FAKE_OUT: p.out });
    assert.equal(w.code, 0, w.all);
    assert.ok(existsSync(join(p.root, 'delegation', 'tasks', 'T1', 'PACKET.md')));
    assert.ok(!existsSync(`${p.out}.T1.json`), '--render never spawns');
  });
  await withProject({ brief: null }, async (p) => {
    const d = await run(['--dry-run', '--json'], p.root);
    assert.equal(d.code, 0, 'a dry run reports a packet problem but keeps its exit semantics');
    assert.equal(JSON.parse(d.stdout).packets[0].ok, false);
  });
});

test('orchestrate dispatch — the shipped template parses and every adapter has a usable shape', async () => {
  const cfg = JSON.parse(await readFile(join(KIT, 'templates', 'ORCHESTRATION.json'), 'utf8'));
  for (const name of ['claude-code', 'codex', 'gemini', 'cline', 'opencode', 'relay']) {
    assert.ok(cfg.adapters[name], `adapter ${name} is shipped`);
    if (name === 'relay') assert.equal(cfg.adapters.relay.type, 'relay');
    else {
      assert.ok(Array.isArray(cfg.adapters[name].argv));
      assert.ok(cfg.adapters[name].argv.includes('{{POINTER}}'), `${name} passes the pointer`);
      assert.ok(!JSON.stringify(cfg.adapters[name].argv).includes('$('), `${name} has no command substitution`);
    }
  }
  assert.match(cfg.adapters.codex._note, /UNVERIFIED/);
  assert.match(cfg.adapters.gemini._note, /UNVERIFIED/);
});
