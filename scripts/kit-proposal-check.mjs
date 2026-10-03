#!/usr/bin/env node
// scripts/kit-proposal-check.mjs
// Try a consumer's edit proposal (an "amend an existing kit file" candidate from the proposals lane,
// see kit-staging/README.md) on a SCRATCH copy of the kit and report whether the gate still passes.
// The live kit is never written to.
//
// A proposal is a directory produced by kit-staging-export.mjs:
//   proposals/<id>/proposal.json   which kit file, which kit version (label+hash) it is against
//   proposals/<id>/patch.diff      unified diff against that version (may be absent)
//   proposals/<id>/files/<path>    the full edited file
//   proposals/<id>/RATIONALE.md
//
// Usage:
//   node scripts/kit-proposal-check.mjs <proposal-dir | inbox-project-dir> [--kit <kit dir>]
//        [--full-file] [--keep] [--json] [--no-selftest]
//   <inbox-project-dir>  checks every proposals/*/ under it, each on its own scratch copy
//   --full-file          if patch.diff will not apply, replace the file with files/<path> wholesale
//                        (this DISCARDS kit-side changes made since the version the patch is against)
//   --keep               leave the scratch copy on disk (its path is printed)
//
// What it runs in the scratch copy: `node scripts/validate.mjs --kit` and `node scripts/selftest.mjs`.
// If the patched copy fails, it also runs both on an UNPATCHED scratch copy so a red gate that was
// already red is not blamed on the proposal.
// Exit: 0 every proposal passes, 1 a proposal does not apply or fails the gate, 2 usage error.
// Zero-dep Node ESM.

import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, copyFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { parsePatch, applyFilePatch } from './_lib/unified-diff.mjs';
import { computeKitHash, walkTree, shortHash } from './_lib/kit-tree.mjs';

const argv = process.argv.slice(2);
function flag(name) {
  const eq = argv.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined;
}
const kitRoot = resolve(flag('--kit') ?? resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const fullFile = argv.includes('--full-file');
const keep = argv.includes('--keep');
const json = argv.includes('--json');
const noSelftest = argv.includes('--no-selftest');
const valueFlags = new Set(['--kit']);
const target = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && valueFlags.has(argv[i - 1])));

if (!target) {
  console.error('Usage: node scripts/kit-proposal-check.mjs <proposal-dir | inbox-project-dir> [--kit <dir>] [--full-file] [--keep] [--json] [--no-selftest]');
  process.exit(2);
}
const targetDir = resolve(target);
if (!existsSync(targetDir)) {
  console.error(`ERROR: not found: ${targetDir}`);
  process.exit(2);
}

// Proposal directories to check.
let proposalDirs = [];
if (existsSync(join(targetDir, 'proposal.json'))) proposalDirs = [targetDir];
else if (existsSync(join(targetDir, 'proposals'))) {
  proposalDirs = readdirSync(join(targetDir, 'proposals'))
    .map((n) => join(targetDir, 'proposals', n))
    .filter((p) => statSync(p).isDirectory() && existsSync(join(p, 'proposal.json')));
}
if (proposalDirs.length === 0) {
  console.error(`ERROR: no proposal.json under ${targetDir} (expected a proposals/<id>/ directory or an inbox project directory)`);
  process.exit(2);
}

const SCRATCH_SKIP = new Set(['.git', 'node_modules']);
function copyKit(dest) {
  // The scratch copy leaves out the inbox (it can be large and is not part of the gate) and VCS/deps.
  for (const rel of walkTree(kitRoot, { isSkippedDir: (n) => SCRATCH_SKIP.has(n) })) {
    if (rel.startsWith('kit-staging/') || rel.startsWith('.trash_kitstaging/')) continue;
    const to = join(dest, rel);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(join(kitRoot, rel), to);
  }
}

function runGate(dir) {
  const results = {};
  const run = (name, args) => {
    const r = spawnSync(process.execPath, args, { cwd: dir, encoding: 'utf8', timeout: 10 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.replace(/\r/g, '').trim().split('\n');
    results[name] = { pass: r.status === 0, status: r.status, tail: out.slice(-6).join('\n') };
  };
  run('validate', ['scripts/validate.mjs', '--kit']);
  if (!noSelftest) run('selftest', ['scripts/selftest.mjs']);
  return results;
}
const gatePass = (g) => Object.values(g).every((x) => x.pass);

const currentHash = computeKitHash(kitRoot).hash;
const report = [];

for (const dir of proposalDirs) {
  const meta = JSON.parse(readFileSync(join(dir, 'proposal.json'), 'utf8'));
  const entry = { id: meta.id, path: meta.path, against: meta.against, version: 'unverifiable', applied: null, gate: null, baselineGate: null, verdict: 'FAIL', notes: [] };
  // Unsafe paths in a proposal are refused outright: it names a kit file, never something outside.
  if (!meta.path || meta.path.startsWith('/') || /(^|\/)\.\.(\/|$)/.test(meta.path) || /^[a-z]:/i.test(meta.path)) {
    entry.notes.push(`refused: proposal path "${meta.path}" is not a relative kit path`);
    report.push(entry);
    continue;
  }
  if (meta.against?.hash) entry.version = meta.against.hash === currentHash ? 'same' : 'moved-on';
  if (entry.version === 'moved-on') entry.notes.push(`proposal is against kit ${meta.against.label}+${shortHash(meta.against.hash)}; the kit is now ${shortHash(currentHash)}`);
  if (entry.version === 'unverifiable') entry.notes.push('proposal names no kit hash; cannot tell whether the kit has moved on');
  if (meta.rationale === 'missing') entry.notes.push('the proposal has NO rationale (RATIONALE.md is a stub): defer it');

  const scratch = mkdtempSync(join(tmpdir(), 'kit-proposal-'));
  try {
    copyKit(scratch);
    const targetFile = join(scratch, meta.path);
    const before = existsSync(targetFile) ? readFileSync(targetFile, 'utf8') : null;
    const patchPath = join(dir, 'patch.diff');
    const fullPath = join(dir, 'files', meta.path);
    let newText = null;
    if (existsSync(patchPath)) {
      const fp = parsePatch(readFileSync(patchPath, 'utf8')).find((f) => (f.newPath ?? f.oldPath) === meta.path);
      if (!fp) entry.notes.push('patch.diff has no entry for the proposal path');
      else {
        const r = applyFilePatch(before, fp);
        if (r.ok) {
          newText = r.text;
          entry.applied = 'patch';
        } else entry.notes.push(...r.errors);
      }
    } else entry.notes.push('no patch.diff (the exporter had no pristine baseline); only the full file is available');
    if (newText === null) {
      if (existsSync(fullPath) && (fullFile || !existsSync(patchPath))) {
        newText = readFileSync(fullPath, 'utf8');
        entry.applied = 'full-file';
        entry.notes.push('applied as a FULL FILE replacement: any kit-side changes to this file since the proposal\'s version are overwritten');
      } else if (existsSync(fullPath)) entry.notes.push('patch does not apply; re-run with --full-file to replace the file wholesale (discards kit-side changes)');
    }
    if (newText === null) {
      entry.verdict = 'FAIL (does not apply)';
      report.push(entry);
      continue;
    }
    mkdirSync(dirname(targetFile), { recursive: true });
    writeFileSync(targetFile, newText, 'utf8');
    entry.gate = runGate(scratch);
    if (gatePass(entry.gate)) entry.verdict = 'PASS';
    else {
      // Was the gate already red without the proposal?
      const clean = mkdtempSync(join(tmpdir(), 'kit-proposal-base-'));
      try {
        copyKit(clean);
        entry.baselineGate = runGate(clean);
      } finally {
        rmSync(clean, { recursive: true, force: true });
      }
      entry.verdict = gatePass(entry.baselineGate) ? 'FAIL (breaks the gate)' : 'INCONCLUSIVE (the gate is already red without the proposal)';
    }
    if (keep) entry.scratch = scratch;
  } finally {
    if (!keep) rmSync(scratch, { recursive: true, force: true });
  }
  report.push(entry);
}

if (json) console.log(JSON.stringify(report, null, 2));
else {
  for (const e of report) {
    console.log(`\n== ${e.id}  (${e.path})  -> ${e.verdict}`);
    console.log(`   version: ${e.version}${e.against?.label ? `  (against ${e.against.label}${e.against.hash ? '+' + shortHash(e.against.hash) : ''})` : ''}   applied: ${e.applied ?? 'no'}`);
    if (e.gate) for (const [k, v] of Object.entries(e.gate)) console.log(`   ${k}: ${v.pass ? 'pass' : 'FAIL'}${v.pass ? '' : '\n      ' + v.tail.split('\n').join('\n      ')}`);
    if (e.baselineGate) for (const [k, v] of Object.entries(e.baselineGate)) console.log(`   (unpatched kit) ${k}: ${v.pass ? 'pass' : 'FAIL'}`);
    for (const n of e.notes) console.log(`   note: ${n}`);
    if (e.scratch) console.log(`   scratch copy kept at: ${e.scratch}`);
  }
}
process.exitCode = report.every((e) => e.verdict === 'PASS') ? 0 : 1;
