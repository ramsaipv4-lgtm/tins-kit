#!/usr/bin/env node
// scripts/kit-staging-export.mjs
// Dump a consumer project's kit-worthy artefacts into one bundle that the user copies back to the
// kit machine (kit-staging/inbox/<project>/). Runs from any of three layouts:
//   - a portable shell     <project>/.kit-shell/scripts/   (marker .kit-shell/.kit-shell.json)
//   - a scaffolded project <project>/scripts/              (marker .kit-project.json)
//   - a vendored kit copy  <project>/tins-kit/scripts/     (marker tins-kit/.kit-sync.json)
//
// Usage:
//   node .kit-shell/scripts/kit-staging-export.mjs
//   node .kit-shell/scripts/kit-staging-export.mjs --out=./my-export.tar.gz
//   node .kit-shell/scripts/kit-staging-export.mjs --auto-mine      # run kit-extract.mjs first
//   --kit=<dir>            a pristine copy of the kit, to diff edited files against (else a full
//                          replacement file is shipped, with a warning)
//   --repo-url=<url> --first-commit=<sha>   override what is read from git (see manifest)
//   --include-docs         also ship project files under docs/ that are not kit files
//   --no-archive           stop after writing the staging directory (used by tests)
//   --strict               exit 1 if anything was skipped or a proposal has no rationale
//
// WHAT SHIPS (round-1 consistency C1 - the old export silently dropped scripts, schemas,
// templates, docs and every edit to an existing kit file):
//   BUILDER-DECISIONS-REVIEW.md, kit-growth-candidates.md, .kit-shell.json (as before)
//   lib/patterns/*.md, lib/<module>/**, prompts/*, scripts/**, schemas/**, templates/**
//       ... NEW files only (not in the kit baseline) - shipped at their kit-relative path.
//   proposals/<id>/{proposal.json, RATIONALE.md, patch.diff, files/<kit-path>}
//       ... one per EDITED kit file: a unified diff against the NAMED kit version recorded in the
//       marker, the full new file, and a rationale (authored at kit-proposals/<id>.md, else a
//       stub is generated and the export warns that the rationale is missing).
//   kit-staging-export.json  the manifest: project, kit version (label+hash) the bundle is against,
//       repo URL + first-commit sha (so "two consumers" can be verified independent - red-team M2),
//       every shipped item with its hash, and everything skipped with the reason.
// Files identical to the kit baseline are skipped silently-but-counted: a scaffolded consumer's
// lib/patterns/ holds the whole kit, which used to re-ship as 24 bogus "candidates".
// Secrets: the staged bundle is scanned with scan-secrets.mjs (beside this script); a hit REFUSES
// the export and deletes the staging directory. .env* and key files are never copied.
//
// Zero-dep Node ESM. The archive is a .zip on Windows (PowerShell Compress-Archive) and a .tar.gz
// on POSIX (the system `tar`).

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import { hashFile, hashBuffer, toPosix, scrubUrl, shortHash } from './_lib/kit-tree.mjs';
import { unifiedDiff } from './_lib/unified-diff.mjs';

const args = process.argv.slice(2);
function flag(name) {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = args.indexOf(name);
  return i !== -1 && i + 1 < args.length && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
}
const outArg = flag('--out');
const kitArg = flag('--kit');
const repoUrlArg = flag('--repo-url');
const firstCommitArg = flag('--first-commit');
const rootArg = flag('--root');
const autoMine = args.includes('--auto-mine');
const includeDocs = args.includes('--include-docs');
const noArchive = args.includes('--no-archive');
const strict = args.includes('--strict');

const scriptDir = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------------------------
// 0. Locate the project and the kit baseline
// ---------------------------------------------------------------------------------------------

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function detectLayout() {
  const parent = resolve(scriptDir, '..');
  const shellMarker = join(parent, '.kit-shell.json');
  if (basename(parent) === '.kit-shell' && existsSync(shellMarker)) {
    const marker = readJson(shellMarker);
    return { layout: 'shell', root: resolve(parent, '..'), marker, markerPath: shellMarker, kitDir: parent, baseline: marker?.baseline ?? null };
  }
  const projMarker = join(parent, '.kit-project.json');
  if (existsSync(projMarker)) {
    const marker = readJson(projMarker);
    return { layout: 'scaffold', root: parent, marker, markerPath: projMarker, kitDir: parent, baseline: marker?.baseline ?? null };
  }
  const syncMarker = join(parent, '.kit-sync.json');
  if (basename(parent) === 'tins-kit' && existsSync(syncMarker)) {
    const marker = readJson(syncMarker);
    const baseline = {};
    for (const [rel, hash] of Object.entries(marker?.files ?? {})) baseline[rel] = { dest: `tins-kit/${rel}`, hash };
    return { layout: 'vendored', root: resolve(parent, '..'), marker, markerPath: syncMarker, kitDir: parent, baseline };
  }
  return null;
}

const found = detectLayout();
if (!found) {
  console.error('ERROR: no kit marker found (.kit-shell/.kit-shell.json, .kit-project.json or tins-kit/.kit-sync.json).');
  console.error('Are you running this from inside a kit shell, a scaffolded project or a vendored tins-kit/?');
  process.exit(2);
}
const { layout, marker, markerPath } = found;
const projectRoot = rootArg ? resolve(rootArg) : found.root;
const baseline = found.baseline; // { <kit-rel>: { dest, hash } } or null (a marker from before baselines)
const projectName = marker.project ?? basename(projectRoot);
const today = new Date().toISOString().slice(0, 10);
const exportName = `kit-staging-export-${projectName}-${today}`;

const warnings = [];
const skipped = []; // { path, reason }
function warn(msg) {
  warnings.push(msg);
}

// The kit this bundle is against. Shell/scaffold markers carry kitVersion (label) + kitHash;
// a vendored copy's .kit-sync.json carries the same. A marker from before round 1B carries a bare
// '2.0' and no hash: the bundle then names an unverifiable version, and says so.
const against = {
  label: marker.kitVersion ?? 'unknown',
  hash: marker.kitHash ?? null,
  verifiable: Boolean(marker.kitHash),
};
if (!against.verifiable) warn('The marker records no kit hash (it predates KIT-VERSION), so a proposal cannot be tied to an exact kit version. Re-scaffold, or run kit-sync, to get one.');

// A pristine kit copy to diff against, if one is reachable from here.
const kitSourceDir = kitArg ? resolve(kitArg) : marker.kitSource && existsSync(marker.kitSource) ? resolve(marker.kitSource) : null;

function kitFileText(kitRel) {
  if (!kitSourceDir) return null;
  const p = join(kitSourceDir, kitRel);
  return existsSync(p) && statSync(p).isFile() ? p : null;
}

// ---------------------------------------------------------------------------------------------
// 1. Optionally mine, then prepare a clean staging directory
// ---------------------------------------------------------------------------------------------

const candidatesPath = join(projectRoot, 'kit-growth-candidates.md');
if (autoMine && !existsSync(candidatesPath)) {
  console.log('Auto-mining: running kit-extract.mjs...');
  const extractScript = join(scriptDir, 'kit-extract.mjs');
  if (existsSync(extractScript)) {
    // Synchronous: the old code spawned it asynchronously and copied the candidates file before it existed.
    const r = spawnSync(process.execPath, [extractScript, '--consumer=.'], { stdio: 'inherit', cwd: projectRoot });
    if (r.status === 1) console.log('  (kit-extract exited 1 = candidates found)');
    else if (r.status === 0) console.log('  (kit-extract exited 0 = no candidates)');
    else warn(`kit-extract exited ${r.status}; candidates file may be missing`);
  } else {
    warn('kit-extract.mjs not found beside this script; --auto-mine skipped');
  }
}

const stagingRoot = join(projectRoot, '.kit-staging-export');
const stagingDir = join(stagingRoot, exportName);
rmSync(stagingDir, { recursive: true, force: true }); // a rerun on the same day must not mix with the last export
mkdirSync(stagingDir, { recursive: true });

const shipped = []; // { path, hash, kind }
function stage(srcPath, destRel, kind) {
  const dest = join(stagingDir, destRel);
  if (existsSync(dest)) {
    skipped.push({ path: destRel, reason: 'two project files map to the same bundle path; the first one was kept' });
    return false;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(srcPath, dest);
  shipped.push({ path: toPosix(destRel), hash: hashFile(srcPath), kind });
  return true;
}
function stageText(text, destRel, kind) {
  const dest = join(stagingDir, destRel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, text, 'utf8');
  shipped.push({ path: toPosix(destRel), hash: hashBuffer(Buffer.from(text, 'utf8')), kind });
}

// ---------------------------------------------------------------------------------------------
// 2. The fixed items: decision log, candidates, marker
// ---------------------------------------------------------------------------------------------

const bdrPath = join(projectRoot, 'BUILDER-DECISIONS-REVIEW.md');
if (existsSync(bdrPath)) {
  stage(bdrPath, 'BUILDER-DECISIONS-REVIEW.md', 'decision-log');
  console.log(`  + BUILDER-DECISIONS-REVIEW.md (${statSync(bdrPath).size} bytes)`);
}
if (existsSync(candidatesPath)) {
  stage(candidatesPath, 'kit-growth-candidates.md', 'candidates');
  console.log(`  + kit-growth-candidates.md (${statSync(candidatesPath).size} bytes)`);
}
// The marker is shipped without the baseline map (the manifest carries what the kit needs).
{
  const { baseline: _omit, files: _omit2, ...slim } = marker;
  stageText(JSON.stringify(slim, null, 2) + '\n', '.kit-shell.json', 'marker');
  console.log('  + .kit-shell.json');
}

// ---------------------------------------------------------------------------------------------
// 3. Walk the places a consumer may hold kit-bound files
// ---------------------------------------------------------------------------------------------

const KIT_DIRS = ['scripts', 'schemas', 'templates', 'prompts', 'lib', 'docs'];
const SKIP_NAMES = new Set(['node_modules', '.git', 'dist', 'build', '.kit-staging-export', '__pycache__']);
const SECRET_NAME = /^(\.env($|[.\-_])|.*\.(pem|key|p12|pfx|keystore|jks)$|id_(rsa|dsa|ecdsa|ed25519)$|.*\.(sqlite|db)$)/i;
const MAX_BYTES = 1024 * 1024;

function* walk(dir, relBase) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir).sort()) {
    if (SKIP_NAMES.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    const rel = relBase ? `${relBase}/${name}` : name;
    if (st.isDirectory()) yield* walk(full, rel);
    else if (st.isFile()) yield { full, rel, size: st.size };
  }
}

function isBinary(path) {
  return readFileSync(path).subarray(0, 8000).includes(0);
}

// Scan specs: { dir, prefix, owned }. `prefix` maps a path under dir to a kit-relative path
// (stripped). `owned` = the directory holds kit copies and the baseline applies.
const specs = [];
if (layout === 'shell') {
  specs.push({ dir: join(projectRoot, '.kit-shell'), label: '.kit-shell', owned: true });
  specs.push({ dir: projectRoot, label: '', owned: false });
} else if (layout === 'scaffold') {
  specs.push({ dir: projectRoot, label: '', owned: true });
} else {
  specs.push({ dir: found.kitDir, label: 'tins-kit', owned: true });
}

const counts = { unchangedKit: 0, additions: 0, proposals: 0 };
const proposals = [];
const additions = [];
const seenKitRel = new Set();

// Classify one file. Returns nothing; stages into the bundle or records a skip.
function consider({ full, rel, size }, spec) {
  const top = rel.split('/')[0];
  const projectRel = spec.label ? `${spec.label}/${rel}` : rel;
  if (!KIT_DIRS.includes(top)) return;
  const name = basename(rel);
  if (name.endsWith('.tombstone.md')) return; // written by kit-sync, not authored by the project
  if (SECRET_NAME.test(name)) {
    skipped.push({ path: projectRel, reason: 'looks like a secret or key file; never exported' });
    return;
  }
  if (size > MAX_BYTES) {
    skipped.push({ path: projectRel, reason: `larger than ${MAX_BYTES} bytes` });
    return;
  }
  if (isBinary(full)) {
    skipped.push({ path: projectRel, reason: 'binary file' });
    return;
  }

  const hash = hashFile(full);
  const tracked = spec.owned && baseline ? baseline[rel] : undefined;

  if (tracked) {
    // A kit file this project received: unchanged -> skip (counted); edited -> a proposal.
    if (tracked.hash === hash) {
      counts.unchangedKit++;
      return;
    }
    makeProposal({ full, kitRel: rel, projectRel, hash, baselineHash: tracked.hash });
    return;
  }

  // Not in the baseline. If a pristine kit copy is reachable and holds an identical file, skip it.
  const kitCopy = kitFileText(rel);
  if (kitCopy && hashFile(kitCopy) === hash) {
    counts.unchangedKit++;
    return;
  }

  // Project-authored files that are not kit material by location.
  if (top === 'docs' && !includeDocs) {
    skipped.push({ path: projectRel, reason: 'docs/ file that is not a kit file (project docs are assumed project-specific; pass --include-docs to ship)' });
    return;
  }
  if (top === 'lib') {
    const parts = rel.split('/');
    const isPattern = parts[1] === 'patterns' && parts.length === 3 && rel.endsWith('.md');
    const moduleDir = parts.length >= 3 && parts[1] !== 'patterns' ? parts[1] : null;
    const isModule = moduleDir !== null && existsSync(join(spec.dir, 'lib', moduleDir, 'index.ts'));
    if (!isPattern && !isModule) {
      skipped.push({ path: projectRel, reason: 'lib/ file that is neither a pattern (lib/patterns/*.md) nor part of a module with index.ts' });
      return;
    }
    if (isModule && ['tests', 'archive'].includes(moduleDir)) {
      skipped.push({ path: projectRel, reason: `lib/${moduleDir}/ is not a contributable module` });
      return;
    }
  }
  if (kitCopy) {
    // Same kit path exists in the kit and differs, but this project has no baseline for it.
    makeProposal({ full, kitRel: rel, projectRel, hash, baselineHash: hashFile(kitCopy), baselineFromKit: true });
    return;
  }
  if (stage(full, rel, 'addition')) {
    additions.push({ path: rel, hash, kind: kindOf(rel) });
    counts.additions++;
  }
}

function kindOf(rel) {
  const top = rel.split('/')[0];
  if (top === 'lib') return rel.startsWith('lib/patterns/') ? 'pattern' : 'module';
  return { scripts: 'script', schemas: 'schema', templates: 'template', prompts: 'prompt', docs: 'doc' }[top] ?? 'file';
}

function slug(rel) {
  return rel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function makeProposal({ full, kitRel, projectRel, hash, baselineHash, baselineFromKit = false }) {
  if (seenKitRel.has(kitRel)) {
    skipped.push({ path: projectRel, reason: `another project file already proposes an edit to ${kitRel}` });
    return;
  }
  seenKitRel.add(kitRel);
  const id = slug(kitRel);
  const dir = `proposals/${id}`;
  stage(full, `${dir}/files/${kitRel}`, 'proposal-file');

  // A real diff needs the baseline's text. It is available only from a pristine kit copy whose
  // file still hashes to the baseline; otherwise ship the full file and say so.
  let patch = false;
  const kitCopy = kitFileText(kitRel);
  if (kitCopy && hashFile(kitCopy) === baselineHash) {
    const diff = unifiedDiff(readFileSync(kitCopy, 'utf8'), readFileSync(full, 'utf8'), kitRel);
    if (diff) {
      stageText(diff, `${dir}/patch.diff`, 'proposal-patch');
      patch = true;
    }
  } else {
    warn(`${kitRel}: no pristine copy of the baseline version is reachable${kitSourceDir ? ' (the kit copy at ' + kitSourceDir + ' has moved on)' : ' (pass --kit=<kit dir>)'}; shipped the full edited file without patch.diff. The kit-side reviewer must diff it.`);
  }

  // Rationale: authored, or a loud stub.
  const authored = [join(projectRoot, 'kit-proposals', `${id}.md`), join(projectRoot, 'kit-proposals', id, 'RATIONALE.md')].find((p) => existsSync(p));
  let rationale = 'authored';
  if (authored) {
    stage(authored, `${dir}/RATIONALE.md`, 'proposal-rationale');
  } else {
    rationale = 'missing';
    warn(`${kitRel}: no rationale. Write kit-proposals/${id}.md (what changed, why, evidence, which gate you ran) and export again.`);
    stageText(rationaleStub(kitRel), `${dir}/RATIONALE.md`, 'proposal-rationale');
  }

  const info = {
    id,
    path: kitRel,
    projectPath: projectRel,
    status: 'modified',
    against,
    baselineHash,
    baselineFromKit,
    newHash: hash,
    patch,
    patchFile: patch ? `${dir}/patch.diff` : null,
    file: `${dir}/files/${kitRel}`,
    rationale,
  };
  stageText(JSON.stringify(info, null, 2) + '\n', `${dir}/proposal.json`, 'proposal-meta');
  proposals.push(info);
  counts.proposals++;
}

function rationaleStub(kitRel) {
  return [
    `# Rationale for the edit to \`${kitRel}\``,
    '',
    '> RATIONALE MISSING. This stub was generated by kit-staging-export.mjs because the project had no',
    `> kit-proposals/ file for this edit. A proposal without a rationale should be deferred.`,
    '',
    '## What changed',
    '',
    '## Why (the defect or gap, with evidence: a command you ran and its output)',
    '',
    '## What you ran to check it (gate, selftest, anything else) and the result',
    '',
    '## What could break for other consumers',
    '',
  ].join('\n');
}

for (const spec of specs) {
  for (const top of KIT_DIRS) {
    for (const f of walk(join(spec.dir, top), top)) consider(f, spec);
  }
}

// ---------------------------------------------------------------------------------------------
// 4. Repo identity (is this a distinct consumer?)
// ---------------------------------------------------------------------------------------------

function gitAvailable() {
  const r = spawnSync('git', ['--version'], { encoding: 'utf8' });
  return !r.error && r.status === 0;
}
function git(argv) {
  const r = spawnSync('git', ['-C', projectRoot, ...argv], { encoding: 'utf8' });
  return !r.error && r.status === 0 ? r.stdout.trim() : null;
}
const repo = { url: 'unknown', firstCommit: 'unknown', source: 'unknown' };
if (repoUrlArg) {
  repo.url = scrubUrl(repoUrlArg);
  repo.source = 'flag';
}
if (firstCommitArg) {
  repo.firstCommit = firstCommitArg.trim();
  repo.source = repo.source === 'unknown' ? 'flag' : repo.source;
}
if ((repo.url === 'unknown' || repo.firstCommit === 'unknown') && gitAvailable()) {
  if (repo.url === 'unknown') {
    const u = git(['remote', 'get-url', 'origin']);
    if (u) {
      repo.url = scrubUrl(u);
      repo.source = 'git';
    }
  }
  if (repo.firstCommit === 'unknown') {
    const roots = git(['rev-list', '--max-parents=0', 'HEAD']);
    if (roots) {
      repo.firstCommit = roots.split('\n').map((s) => s.trim()).filter(Boolean).sort()[0];
      repo.source = repo.source === 'unknown' ? 'git' : repo.source;
    }
  }
}
if (repo.url === 'unknown' || repo.firstCommit === 'unknown') {
  warn('Could not determine the project repo URL and/or first-commit sha (not a git repo with an origin?). The kit cannot verify that this consumer is independent of others. Pass --repo-url=<url> --first-commit=<sha>, or accept "unknown".');
}

// ---------------------------------------------------------------------------------------------
// 5. Manifest, secret scan, report
// ---------------------------------------------------------------------------------------------

const manifest = {
  schema: 'kit-staging-export/2',
  project: projectName,
  exportedAt: new Date().toISOString(),
  exportName,
  layout,
  against,
  repo,
  counts: { ...counts, shipped: shipped.length, skipped: skipped.length },
  proposals: proposals.map(({ id, path, newHash, baselineHash, patch, rationale }) => ({ id, path, newHash, baselineHash, patch, rationale })),
  additions,
  shipped,
  skipped,
  warnings,
};
writeFileSync(join(stagingDir, 'kit-staging-export.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

// Refuse a bundle that contains a secret. The scanner prints finding classes and line numbers, never values.
{
  const scanner = join(scriptDir, 'scan-secrets.mjs');
  if (existsSync(scanner)) {
    const r = spawnSync(process.execPath, [scanner, '--root', projectRoot, stagingDir], { encoding: 'utf8' });
    if (r.status === 1) {
      rmSync(stagingDir, { recursive: true, force: true });
      console.error('\nREFUSED: scan-secrets.mjs found a secret in the bundle. Nothing was exported; the staging copy was deleted.');
      process.stderr.write(r.stdout || '');
      console.error('Remove the secret from the file named above (it is a leak in the project too: rotate it), then export again.');
      process.exit(3);
    }
    if (r.status !== 0) warn(`scan-secrets.mjs exited ${r.status}; the bundle was NOT secret-scanned`);
  } else {
    warn('scan-secrets.mjs is not beside this script, so the bundle was NOT scanned for secrets. Check it by hand before it leaves this machine.');
  }
}

console.log(`\nBundle contents: ${shipped.length} file(s); ${counts.additions} new, ${counts.proposals} edit proposal(s), ${counts.unchangedKit} unchanged kit file(s) skipped`);
console.log(`Against kit: ${against.label}${against.hash ? '+' + shortHash(against.hash) : ' (no hash)'}   Repo: ${repo.url}  first commit: ${repo.firstCommit === 'unknown' ? 'unknown' : shortHash(repo.firstCommit)}`);
if (skipped.length) {
  console.error(`\n!! ${skipped.length} FILE(S) NOT SHIPPED (listed in kit-staging-export.json "skipped"):`);
  for (const s of skipped.slice(0, 25)) console.error(`   - ${s.path}: ${s.reason}`);
  if (skipped.length > 25) console.error(`   ... and ${skipped.length - 25} more`);
}
if (warnings.length) {
  console.error(`\n!! ${warnings.length} WARNING(S):`);
  for (const w of warnings) console.error(`   - ${w}`);
}

const needsAttention = skipped.length > 0 || proposals.some((p) => p.rationale === 'missing');
if (strict && needsAttention) {
  console.error('\n--strict: refusing because something was skipped or a rationale is missing.');
  process.exitCode = 1;
} else if (noArchive) {
  console.log(`\nStaging directory: ${stagingDir}`);
} else {
  makeArchive();
}

// ---------------------------------------------------------------------------------------------
// 6. Produce the archive
// ---------------------------------------------------------------------------------------------

function makeArchive() {
  const isWindows = process.platform === 'win32';
  // The extension matches what is actually produced: a .zip on Windows, a real .tar.gz elsewhere.
  const defaultExt = isWindows ? '.zip' : '.tar.gz';
  const archivePath = outArg ? resolve(outArg) : join(projectRoot, `${exportName}${defaultExt}`);

  const next = (extra) => {
    console.log(`\n✅ Archive: ${archivePath}`);
    console.log('\nNext step: copy this file to the kit machine, then:');
    console.log(`  mkdir -p <kit-machine>/tins-kit/kit-staging/inbox/${projectName}/`);
    console.log(`  tar -xzf ${archivePath} -C <kit-machine>/tins-kit/kit-staging/inbox/${projectName}/`);
    if (extra) console.log(extra);
  };

  if (isWindows) {
    const ps = spawn('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${archivePath}' -Force`], { stdio: 'inherit' });
    ps.on('close', (code) => {
      if (code === 0) {
        next(`  # or on Windows: Expand-Archive -Path ${archivePath} -DestinationPath <kit-machine>\\tins-kit\\kit-staging\\inbox\\${projectName}\\`);
      } else {
        console.error(`PowerShell Compress-Archive exited with ${code}`);
        process.exit(1);
      }
    });
  } else {
    const t = spawn('tar', ['czf', archivePath, '-C', stagingDir, '.'], { stdio: 'inherit' });
    t.on('error', (e) => {
      console.error(`could not run tar: ${e.message}. The staging directory is ready at ${stagingDir}; archive it by hand.`);
      process.exit(1);
    });
    t.on('close', (code) => {
      if (code === 0) next();
      else {
        console.error(`tar exited with ${code}`);
        process.exit(1);
      }
    });
  }
}
