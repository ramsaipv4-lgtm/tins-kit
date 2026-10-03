#!/usr/bin/env node
// scripts/kit-sync.mjs
// Sync the top-level kit to a project's vendored copy.
//
// The top-level `tins-kit/` is the source of truth (Rule 1, VERSIONING.md). Each consumer has a
// vendored copy at `<project>/tins-kit/`. When the kit grows, run this script to push the new files.
//
// Usage:
//   node scripts/kit-sync.mjs --to=../Jayshankar              # push to a specific project
//   node scripts/kit-sync.mjs --to=../Jayshankar --dry-run     # show what would change
//   node scripts/kit-sync.mjs --to=../Jayshankar --json
//   node scripts/kit-sync.mjs --to=../Jayshankar --exclude=prompts/,lib/patterns/legacy-*.md
//   node scripts/kit-sync.mjs --to=../Jayshankar --overwrite   # replace locally modified files (backed up)
//   node scripts/kit-sync.mjs --to=./tins-kit                  # pull from the workspace's top-level kit
//   node scripts/kit-sync.mjs --to=./tins-kit --from=../../tins-kit
//
// What it does, per file in the kit (after excludes):
//   * missing in the vendored copy                      -> copied
//   * identical                                         -> skipped
//   * vendored copy unchanged since the last sync       -> updated
//   * vendored copy edited locally, kit unchanged       -> left alone, reported "modified locally"
//   * vendored copy edited locally AND kit changed      -> CONFLICT: not written, reported (exit 1)
//   * differs and there is no recorded baseline (first sync with this version of the tool)
//                                                       -> CONFLICT as above
// "Unchanged since the last sync" is judged against the hashes recorded in `.kit-sync.json`.
// `--overwrite` resolves conflicts by replacing the file after saving the local one under
// `.kit-sync-backup/<timestamp>/`. Nothing is ever deleted: project-added files are "preserved".
//
// Pattern lifecycle (round-1 red-team H5): a pattern whose front matter says `status: deprecated`
// or `retracted` is not vendored into a copy that lacks it; in a copy that has it, the file is
// updated and a `<name>.tombstone.md` is written beside it, with a loud warning, so a retraction
// cannot live on silently in vendored copies. The tombstone disappears if the pattern is
// reinstated (`status: active`).
//
// Records KIT-VERSION (label + hash) in `.kit-sync.json`. The script does NOT touch any project
// file outside the vendored `tins-kit/`.
//
// Exit codes: 0 synced cleanly, 1 conflicts need attention, 2 usage / environment error.
// Zero-dep Node ESM.

import { readFileSync, existsSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import {
  walkTree, hashFile, isIdentityFile, isKitLocal, isGeneratedFile, describeKit, readPatternStatus, shortHash,
} from './_lib/kit-tree.mjs';

const args = process.argv.slice(2);
function values(name) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(`${name}=`)) out.push(args[i].slice(name.length + 1));
    else if (args[i] === name && i + 1 < args.length && !args[i + 1].startsWith('--')) out.push(args[++i]);
  }
  return out;
}
const toArg = values('--to')[0];
const fromArg = values('--from')[0];
const excludes = values('--exclude').flatMap((v) => v.split(',')).map((s) => s.trim().replace(/\\/g, '/')).filter(Boolean);
const jsonOut = args.includes('--json');
const dryRun = args.includes('--dry-run');
const overwrite = args.includes('--overwrite');

if (!toArg) {
  console.error('Usage: node scripts/kit-sync.mjs --to=<project-path> [--json] [--dry-run] [--exclude=a,b] [--overwrite] [--from=<kit>]');
  console.error('  Example: node scripts/kit-sync.mjs --to=../Jayshankar');
  process.exit(2);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const ownKit = resolve(scriptDir, '..'); // the kit this script lives in
const targetRoot = resolve(toArg);

// Direction:
//   --to=../Jayshankar -> the project's tins-kit/ is the destination -> forward sync (push)
//   --to=./tins-kit    -> the destination IS a vendored kit -> pull from the workspace kit
const isForwardSync = basename(targetRoot) !== 'tins-kit';
let sourceKit;
let destKit;
if (isForwardSync) {
  sourceKit = fromArg ? resolve(fromArg) : ownKit;
  destKit = join(targetRoot, 'tins-kit');
} else {
  destKit = targetRoot;
  // <workspace>/<project>/tins-kit -> the workspace kit is <workspace>/tins-kit
  sourceKit = fromArg ? resolve(fromArg) : resolve(targetRoot, '..', '..', 'tins-kit');
  if (sourceKit === destKit || !existsSync(sourceKit)) {
    console.error(`ERROR: no parent kit found at ${sourceKit} (pass --from=<kit>)`);
    process.exit(2);
  }
  console.log(`Reverse sync: pulling from ${sourceKit}`);
}
if (!existsSync(sourceKit)) {
  console.error(`ERROR: source kit not found: ${sourceKit}`);
  process.exit(2);
}
if (resolve(sourceKit) === resolve(destKit)) {
  console.error('ERROR: source and destination are the same directory.');
  process.exit(2);
}

doSync(sourceKit, destKit);

// ---------------------------------------------------------------------------------------------

function globToRegExp(glob) {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*').replace(/\?/g, '[^/]');
  return new RegExp(`^${esc}$`);
}
// An exclude entry is a directory prefix (`prompts/`), an exact path, or a glob (`*`, `**`, `?`).
function isExcluded(rel) {
  return excludes.some((e) => {
    if (e.endsWith('/')) return rel.startsWith(e);
    if (/[*?]/.test(e)) return globToRegExp(e).test(rel);
    return rel === e || rel.startsWith(`${e}/`);
  });
}

// Kept literal on purpose: validate.mjs section 8.33e greps this file for it (D36 - examples/ is
// reference material for a person and is never vendored into a consumer).
function isSkippedDir(f) {
  if (f === '.git' || f === 'node_modules') return true;
  if (f === 'examples') return true;
  return false;
}

function readMarker(dst) {
  try {
    return JSON.parse(readFileSync(join(dst, '.kit-sync.json'), 'utf8'));
  } catch {
    return null;
  }
}

function doSync(src, dst) {
  const tree = (root) => new Map(walkTree(root, { isSkippedDir }).map((rel) => [rel, null]));
  const srcRels = [...tree(src).keys()].filter((rel) => isIdentityFile(rel) || rel === 'KIT-VERSION').filter((rel) => !isKitLocal(rel) && !isExcluded(rel));
  const dstRels = existsSync(dst) ? [...tree(dst).keys()] : [];
  const dstSet = new Set(dstRels);
  const srcSet = new Set(srcRels);

  const marker = readMarker(dst);
  const baseline = marker && marker.files && typeof marker.files === 'object' ? marker.files : null;
  const nextBaseline = { ...(baseline ?? {}) };

  const added = [];
  const updated = [];
  const conflicts = [];
  const modifiedLocally = [];
  const skippedLifecycle = [];
  const tombstones = [];
  const warnings = [];
  let unchanged = 0;

  const kit = describeKit(src);
  if (!kit.stamped) warnings.push('the source kit has no KIT-VERSION file; run `node scripts/kit-version.mjs --write` in it. Syncing anyway as "unversioned".');
  else if (kit.stale) warnings.push(`the source kit's KIT-VERSION (${kit.label}+${shortHash(kit.stampedHash)}) is stale: the tree has changed since it was stamped (actual ${shortHash(kit.hash)}). Run \`node scripts/kit-version.mjs --write\` in the source kit.`);

  const toCopy = []; // { rel, hash, why }
  for (const rel of srcRels) {
    const srcPath = join(src, rel);
    const srcHash = hashFile(srcPath);

    // Pattern lifecycle: do not vendor a deprecated/retracted pattern that the copy does not have.
    let life = null;
    if (/^lib\/patterns\/[^/]+\.md$/.test(rel) && !rel.endsWith('.tombstone.md')) {
      life = readPatternStatus(readFileSync(srcPath, 'utf8'));
      if (life.status !== 'active' && !dstSet.has(rel)) {
        skippedLifecycle.push({ path: rel, status: life.status });
        continue;
      }
    }

    if (!dstSet.has(rel)) {
      toCopy.push({ rel, hash: srcHash, kind: 'add' });
    } else {
      const dstHash = hashFile(join(dst, rel));
      const last = baseline ? baseline[rel] : undefined;
      if (dstHash === srcHash) {
        unchanged++;
        nextBaseline[rel] = srcHash;
      } else if (last !== undefined && dstHash === last) {
        toCopy.push({ rel, hash: srcHash, kind: 'update' }); // vendored copy untouched since last sync
      } else if (last !== undefined && srcHash === last) {
        modifiedLocally.push(rel); // only the project changed it; nothing to push
      } else if (overwrite) {
        toCopy.push({ rel, hash: srcHash, kind: 'overwrite' });
      } else {
        conflicts.push({ path: rel, reason: last === undefined ? 'differs and there is no recorded baseline (first sync with baseline tracking)' : 'edited locally and changed in the kit' });
      }
    }

    if (life && life.status !== 'active') {
      tombstones.push({ rel, life });
    }
  }

  // A tombstone is sync-generated; if a pattern is active again, retire its tombstone.
  const staleTombstones = [];
  for (const rel of dstRels) {
    if (!rel.endsWith('.tombstone.md') || !/^lib\/patterns\//.test(rel)) continue;
    const patternRel = rel.replace(/\.tombstone\.md$/, '.md');
    if (srcSet.has(patternRel) && !tombstones.some((t) => t.rel === patternRel)) staleTombstones.push(rel);
  }

  const preserved = dstRels.filter((rel) => !srcSet.has(rel) && !isGeneratedFile(rel));

  for (const c of toCopy) {
    if (c.kind === 'add') added.push(c.rel);
    else updated.push(c.kind === 'overwrite' ? `${c.rel} (overwrote local edits)` : c.rel);
  }
  for (const t of tombstones) {
    warnings.push(`pattern ${basename(t.rel, '.md')} is ${t.life.status}${t.life.supersededBy ? ` (superseded by ${t.life.supersededBy})` : ''}${t.life.reason ? `: ${t.life.reason}` : ''} - tombstone written beside the vendored copy; stop using it.`);
  }

  if (dryRun) {
    report({ dryRun: true });
    return;
  }

  // Back up local edits that --overwrite is about to replace.
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, 'Z');
  for (const c of toCopy) {
    const dstPath = join(dst, c.rel);
    if (c.kind === 'overwrite') {
      const bak = join(dst, '.kit-sync-backup', stamp, c.rel);
      mkdirSync(dirname(bak), { recursive: true });
      copyFileSync(dstPath, bak);
    }
    mkdirSync(dirname(dstPath), { recursive: true });
    copyFileSync(join(src, c.rel), dstPath);
    nextBaseline[c.rel] = c.hash;
  }
  for (const t of tombstones) {
    const tombPath = join(dst, t.rel.replace(/\.md$/, '.tombstone.md'));
    mkdirSync(dirname(tombPath), { recursive: true });
    writeFileSync(tombPath, tombstoneText(t.rel, t.life, kit), 'utf8');
  }
  for (const rel of staleTombstones) rmSync(join(dst, rel), { force: true });

  const out = {
    syncedAt: new Date().toISOString(),
    sourceKit: src,
    kitVersion: kit.label,
    kitHash: kit.hash,
    kitVersionDate: kit.date,
    kitVersionStale: kit.stale,
    filesCopied: toCopy.length,
    filesPreserved: preserved.length,
    filesUnchanged: unchanged,
    conflicts: conflicts.map((c) => c.path),
    modifiedLocally,
    excluded: excludes,
    tombstones: tombstones.map((t) => t.rel),
    files: nextBaseline,
  };
  mkdirSync(dst, { recursive: true });
  writeFileSync(join(dst, '.kit-sync.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
  report({ dryRun: false });

  function report({ dryRun: dr }) {
    if (conflicts.length) process.exitCode = 1;
    if (jsonOut) {
      console.log(JSON.stringify({
        dryRun: dr, sourceKit: src, destKit: dst, kitVersion: kit.label, kitHash: kit.hash,
        added, updated, unchanged, preserved: preserved.length, conflicts, modifiedLocally, skippedLifecycle,
        tombstones: tombstones.map((t) => t.rel), staleTombstonesRemoved: dr ? [] : staleTombstones, warnings,
      }, null, 2));
      return;
    }
    console.log(`${dr ? 'DRY RUN: ' : ''}Kit ${kit.label}+${shortHash(kit.hash)}  ${src}  ->  ${dst}`);
    console.log(`${dr ? 'Would copy' : 'Copied'}: ${added.length} added, ${updated.length} updated; ${unchanged} unchanged; ${preserved.length} project-added preserved`);
    for (const f of [...added, ...updated].slice(0, dr ? 20 : 5)) console.log(`  + ${f}`);
    if (added.length + updated.length > (dr ? 20 : 5)) console.log(`  ... and ${added.length + updated.length - (dr ? 20 : 5)} more`);
    if (modifiedLocally.length) {
      console.log(`Modified locally, kit unchanged (left as is): ${modifiedLocally.length}`);
      for (const f of modifiedLocally.slice(0, 10)) console.log(`  ~ ${f}`);
    }
    if (skippedLifecycle.length) {
      console.log(`Not vendored (pattern not active): ${skippedLifecycle.length}`);
      for (const s of skippedLifecycle) console.log(`  - ${s.path} (${s.status})`);
    }
    if (conflicts.length) {
      console.log(`\nCONFLICTS - NOT written (${conflicts.length}). Resolve by hand, or rerun with --overwrite (local copy is backed up to .kit-sync-backup/):`);
      for (const c of conflicts) console.log(`  ! ${c.path}  - ${c.reason}`);
    }
    for (const w of warnings) console.warn(`WARNING: ${w}`);
    if (!dr) console.log(`Sync marker: ${join(dst, '.kit-sync.json')}`);
  }
}

function tombstoneText(rel, life, kit) {
  const name = basename(rel, '.md');
  return [
    `# TOMBSTONE: ${name} is ${life.status.toUpperCase()}`,
    '',
    `The kit marked \`${rel}\` as **${life.status}** (kit ${kit.label}+${shortHash(kit.hash)}).`,
    life.supersededBy ? `\nUse \`${life.supersededBy}\` instead.` : '',
    life.reason ? `\nReason: ${life.reason}` : '',
    '',
    `The vendored copy \`${name}.md\` remains only so existing references do not break. Do not start new work`,
    'from it. This file is written by `scripts/kit-sync.mjs` and removed automatically if the pattern becomes',
    'active again; do not edit it.',
    '',
  ].join('\n');
}
