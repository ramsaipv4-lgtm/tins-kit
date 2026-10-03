#!/usr/bin/env node
// scripts/kit-version.mjs
// The kit's identity. The kit has no git (VERSIONING.md Rule 5), so a patch, a sync marker and a
// shell marker all need something to name "the kit this was made against". That is KIT-VERSION:
//
//     label: 2.0.0            semantic label, chosen by a human (--label / --bump)
//     hash:  sha256:<64 hex>  content hash of the kit tree (computed here, never typed)
//     date:  2026-10-02
//     files: 142
//
// The hash covers every file in the kit tree in stable (code-unit) path order, with CRLF
// normalised, EXCLUDING: docs/changes/, kit-staging/, _to_delete/, .trash_kitstaging/, examples/,
// .git/, node_modules/ and the generated files KIT-VERSION, .kit-sync.json, *.tombstone.md. The
// excluded set is exactly what kit-sync does not vendor, so a faithful vendored copy hashes the
// same as its source (see scripts/_lib/kit-tree.mjs).
//
// Usage:
//   node scripts/kit-version.mjs                    # show the stamped and the actual identity
//   node scripts/kit-version.mjs --write            # (re)stamp KIT-VERSION; idempotent
//   node scripts/kit-version.mjs --write --label 2.1.0
//   node scripts/kit-version.mjs --write --bump minor     # patch | minor | major
//   node scripts/kit-version.mjs --check            # exit 1 when KIT-VERSION is missing or stale
//   node scripts/kit-version.mjs --root <dir> --json
//
// Exit codes: 0 ok / current, 1 stale or missing (--check) , 2 usage error.
// Zero-dep Node ESM.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { computeKitHash, readKitVersion, formatKitVersion, shortHash } from './_lib/kit-tree.mjs';

const argv = process.argv.slice(2);

function flagValue(name) {
  const eq = argv.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined;
}

const KNOWN = new Set(['--write', '--check', '--json', '--label', '--bump', '--root', '--date']);
for (const a of argv) {
  if (a.startsWith('--') && !KNOWN.has(a.split('=')[0])) {
    console.error(`Unknown option: ${a}`);
    process.exit(2);
  }
}

const root = resolve(flagValue('--root') ?? resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const json = argv.includes('--json');
const doWrite = argv.includes('--write');
const doCheck = argv.includes('--check');
const labelArg = flagValue('--label');
const bumpArg = flagValue('--bump');
const dateArg = flagValue('--date');

if (labelArg && bumpArg) {
  console.error('Use either --label or --bump, not both.');
  process.exit(2);
}
if (bumpArg && !['patch', 'minor', 'major'].includes(bumpArg)) {
  console.error('--bump takes patch, minor or major.');
  process.exit(2);
}
if (dateArg && !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error('--date must be YYYY-MM-DD.');
  process.exit(2);
}

// A scaffold or portable shell carries a record of the kit it came from, not a kit tree: hashing
// the project would be meaningless. Report the recorded baseline instead (nothing to check).
const scaffoldMarker = ['.kit-project.json', '.kit-shell.json'].map((f) => join(root, f)).find((p) => existsSync(p));
if (scaffoldMarker && !flagValue('--root')) {
  let m = {};
  try {
    m = JSON.parse(readFileSync(scaffoldMarker, 'utf8'));
  } catch {}
  const line = `This is a scaffolded project, not a kit tree. Kit baseline recorded at scaffold time: ${m.kitVersion ?? 'unknown'}+${shortHash(m.kitHash ?? 'unknown')}`;
  if (json) console.log(JSON.stringify({ scaffold: true, kitVersion: m.kitVersion ?? null, kitHash: m.kitHash ?? null }, null, 2));
  else console.log(line);
  process.exit(0);
}

const stamped = readKitVersion(root);
const actual = computeKitHash(root);
const current = stamped !== null && stamped.hash === actual.hash;

function bump(label, kind) {
  const m = /^(\d+)\.(\d+)(?:\.(\d+))?$/.exec(label);
  if (!m) throw new Error(`cannot bump label "${label}": expected MAJOR.MINOR[.PATCH]`);
  let [maj, min, pat] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
  if (kind === 'major') [maj, min, pat] = [maj + 1, 0, 0];
  else if (kind === 'minor') [min, pat] = [min + 1, 0];
  else pat += 1;
  return `${maj}.${min}.${pat}`;
}

if (doWrite) {
  let label = labelArg ?? stamped?.label ?? '2.0.0';
  if (bumpArg) {
    try {
      label = bump(stamped?.label ?? '2.0.0', bumpArg);
    } catch (e) {
      console.error(e.message);
      process.exit(2);
    }
  }
  if (/\s/.test(label)) {
    console.error('The label must not contain whitespace.');
    process.exit(2);
  }
  // Idempotent: an unchanged tree with an unchanged label keeps the file (and its date) as it is.
  const unchanged = current && stamped.label === label && !dateArg;
  if (!unchanged) {
    const date = dateArg ?? new Date().toISOString().slice(0, 10);
    writeFileSync(join(root, 'KIT-VERSION'), formatKitVersion({ label, hash: actual.hash, date, files: actual.files }), 'utf8');
  }
  const report = { root, label, hash: actual.hash, files: actual.files, written: !unchanged };
  if (json) console.log(JSON.stringify(report, null, 2));
  else console.log(`${unchanged ? 'KIT-VERSION already current' : 'Wrote KIT-VERSION'}: ${label}+${shortHash(actual.hash)} (${actual.files} files)`);
} else {
  showStatus();
}

function showStatus() {
  const report = {
    root,
    stamped: stamped ? { label: stamped.label, hash: stamped.hash, date: stamped.date } : null,
    actual: { hash: actual.hash, files: actual.files },
    current,
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Kit root: ${root}`);
    console.log(stamped ? `Stamped:  ${stamped.label}+${shortHash(stamped.hash)} (${stamped.date ?? 'no date'})` : 'Stamped:  (no KIT-VERSION file)');
    console.log(`Actual:   ${shortHash(actual.hash)} over ${actual.files} files`);
    console.log(current ? 'KIT-VERSION is current.' : 'KIT-VERSION is STALE or missing - run: node scripts/kit-version.mjs --write');
  }

  if (doCheck && !current) process.exitCode = 1;
}
