#!/usr/bin/env node
// scripts/kit-new-project-shell.mjs
// Scaffold a portable "kit shell" for a new project — the minimum subset of
// the kit the user can take to a different machine, on a USB stick, or in
// a tarball, to start a new TINS project without the full kit.
//
// The shell is small (~10 files, ~50 KB) and self-contained. It includes:
//   - AGENT-BRIEF.md (from templates/PROJECT-AGENT-BRIEF.md)
//   - HANDOVER.md (template)
//   - BUILDER-DECISIONS-REVIEW.md (template)
//   - REVIEWER-DECISIONS-REVIEW.md (template)
//   - .kit-shell/
//     ├── scripts/            DERIVED from the kit's scripts/ directory: every script except the
//     │                       kit-machine-only ones (see KIT_ONLY_SCRIPTS in scripts/_lib/kit-tree.mjs),
//     │                       plus scripts/_lib/. Includes decision-log, kit-extract,
//     │                       kit-staging-export, session, scan-secrets, check-task-independence,
//     │                       kit-coverage, kit-version, ...
//     ├── prompts/
//     │   ├── SPEC-AUTHOR.md (interview the user)
//     │   ├── INTERVIEW-CHECKLIST.md
//     │   ├── BUILDER-REVIEW-TEMPLATE.md
//     │   └── NEW-PROJECT.md (this generic prompt)
//     ├── templates/          every top-level file of the kit's templates/
//     └── .kit-shell.json (marker: kit version + hash, and a hash per copied kit file)
//
// The shell is enough to:
//   1. Run the SPEC-AUTHOR interview and draft SPEC.md
//   2. Record builder decisions
//   3. Mine the decisions for kit-worthy patterns
//   4. Export the candidates to a tarball for transport back to the kit machine
//
// It is NOT enough to run the full kit's validate.mjs / selftest.mjs /
// KITTING workflow. Those run at the kit root, on the kit machine, after
// the tarball is dropped in kit-staging/inbox/.
//
// Usage:
//   node tins-kit/scripts/kit-new-project-shell.mjs <project-name>
//   node tins-kit/scripts/kit-new-project-shell.mjs my-saas --out=./my-saas
//   node tins-kit/scripts/kit-new-project-shell.mjs my-saas --tarball=./my-saas-shell.tar.gz

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync, copyFileSync, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { pipeline } from 'node:stream/promises';
import { createReadStream } from 'node:fs';
import { listShippableScripts, describeKit, hashFile, shortHash, SHELL_EXCLUDED_TEMPLATES } from './_lib/kit-tree.mjs';

const args = process.argv.slice(2);
const outArg = args.find(a => a.startsWith('--out='));
const tarballArg = args.find(a => a.startsWith('--tarball='));
const positional = args.filter(a => !a.startsWith('--'));
const projectName = positional[0];

if (!projectName) {
  console.error('Usage: node kit-new-project-shell.mjs <project-name> [--out=<path>] [--tarball=<path>]');
  console.error('  Example: node kit-new-project-shell.mjs my-saas');
  process.exit(2);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const kitRoot = resolve(scriptDir, '..');
const targetDir = outArg ? resolve(outArg.split('=')[1]) : resolve(process.cwd(), projectName);

if (existsSync(targetDir)) {
  console.error(`ERROR: target directory already exists: ${targetDir}`);
  process.exit(2);
}

const today = new Date().toISOString().slice(0, 10);
const kit = describeKit(kitRoot);
if (!kit.stamped) console.error('WARNING: the kit has no KIT-VERSION file; run `node scripts/kit-version.mjs --write` in the kit. This shell is recorded as "unversioned".');

// Hash of every kit file copied into .kit-shell/, recorded in the marker so kit-staging-export.mjs
// can tell an unchanged kit file (skip) from an edited one (a proposal) from a new one (an addition).
const baseline = {};
const missing = [];
function ship(srcRel, dstRel) {
  const srcPath = join(kitRoot, srcRel);
  if (!existsSync(srcPath)) {
    // Fixed round 1B: this used to `continue` silently, which hid a wrong source name
    // (templates/AGENT-BRIEF.md does not exist; the file is PROJECT-AGENT-BRIEF.md) for the life of the shell.
    missing.push(srcRel);
    console.error(`  ! MISSING in the kit: ${srcRel}`);
    return false;
  }
  const dstPath = join(targetDir, dstRel);
  mkdirSync(dirname(dstPath), { recursive: true });
  copyFileSync(srcPath, dstPath);
  baseline[srcRel] = { dest: dstRel.replace(/\\/g, '/'), hash: hashFile(srcPath) };
  console.log(`  ✓ ${dstRel}`);
  return true;
}

console.log(`Scaffolding portable kit shell for: ${projectName}`);
console.log(`  Target: ${targetDir}`);

// 1. Create directory structure
mkdirSync(targetDir, { recursive: true });
mkdirSync(join(targetDir, '.kit-shell', 'scripts'), { recursive: true });
mkdirSync(join(targetDir, '.kit-shell', 'prompts'), { recursive: true });
mkdirSync(join(targetDir, '.kit-shell', 'templates'), { recursive: true });
mkdirSync(join(targetDir, '.kit-shell', 'lib', 'patterns'), { recursive: true });

// 2. Copy the top-level templates
const topLevelTemplates = [
  ['templates/PROJECT-AGENT-BRIEF.md', 'AGENT-BRIEF.md'],
  ['templates/HANDOVER.md', 'HANDOVER.md'],
  ['templates/BUILDER-DECISIONS-REVIEW.md', 'BUILDER-DECISIONS-REVIEW.md'],
  ['templates/REVIEWER-DECISIONS-REVIEW.md', 'REVIEWER-DECISIONS-REVIEW.md'],
];
for (const [src, dst] of topLevelTemplates) {
  const srcPath = join(kitRoot, src);
  if (!existsSync(srcPath)) {
    missing.push(src);
    console.error(`  ! MISSING in the kit: ${src}`);
    continue;
  }
  let content = readFileSync(srcPath, 'utf8');
  content = content.replace(/<project-name>/g, projectName);
  content = content.replace(/<YYYY-MM-DD>/g, today);
  writeFileSync(join(targetDir, dst), content, 'utf8');
  console.log(`  ✓ ${dst}`);
}

// 3. Copy the kit-shell subset (the minimum needed to work remotely)
// Scripts are DERIVED from the kit's scripts/ directory (everything except the kit-machine-only
// scripts and the kit's own selftest, plus scripts/_lib/) - a new kit script reaches the shell with
// no edit here (round-1 consistency M1/M2, ledger C2).
for (const rel of listShippableScripts(kitRoot, { shell: true })) ship(rel, `.kit-shell/${rel}`);

// Prompts and patterns stay a deliberate, hand-kept subset: the shell is the minimum, not the kit.
const shellFiles = [
  'prompts/SPEC-AUTHOR.md',
  'prompts/INTERVIEW-CHECKLIST.md',
  'prompts/BUILDER-REVIEW-TEMPLATE.md',
  'prompts/NEW-PROJECT.md',
  // D33 - the tooling gate runs before any work starts, so the shell needs it.
  'prompts/TOOLING-AUDIT.md',
  'lib/patterns/third-party-tool-audit.md',
  // D34 - the steering-card catalogue the session selects from.
  'prompts/STEERING-PROMPTS.md',
  // D35 - ask how the build should be executed, once the spec locks.
  'prompts/EXECUTION-MODE-INTERVIEW.md',
  'prompts/DELEGATE-WORK.md',
  // D32 - autonomous build. The shell carries the whole path or none of it.
  'prompts/AUTONOMOUS-BUILD.md',
  'prompts/WORKER-SESSION.md',
  'prompts/INTEGRATE-DELEGATED-WORK.md',
  'lib/patterns/tiered-escalation.md',
];
for (const rel of shellFiles) ship(rel, `.kit-shell/${rel}`);

// 4. Copy the templates into .kit-shell/templates/ (so the export script can re-scaffold).
// Derived: every top-level file in the kit's templates/ (sub-folders such as sql/ are not shell material).
{
  const tdir = join(kitRoot, 'templates');
  const names = existsSync(tdir) ? readdirSync(tdir).filter((n) => statSync(join(tdir, n)).isFile() && !SHELL_EXCLUDED_TEMPLATES.has(n)).sort() : [];
  for (const n of names) ship(`templates/${n}`, `.kit-shell/templates/${n}`);
}

// 5. Write the .kit-shell.json marker
const marker = {
  shell: true,
  // The kit's identity at scaffold time (scripts/kit-version.mjs; VERSIONING.md). This used to be a
  // hardcoded '2.0'. A proposal exported from this shell names this version as the one it is against.
  kitVersion: kit.label,
  kitHash: kit.hash,
  kitVersionDate: kit.date,
  kitSource: kitRoot,
  baseline,
  createdAt: new Date().toISOString(),
  project: projectName,
  instructions: 'See .kit-shell/prompts/NEW-PROJECT.md for the workflow. When done, run `node .kit-shell/scripts/kit-staging-export.mjs` to produce a tarball for transport to the kit machine.',
};
writeFileSync(
  join(targetDir, '.kit-shell', '.kit-shell.json'),
  JSON.stringify(marker, null, 2) + '\n',
  'utf8'
);
console.log(`  ✓ .kit-shell/.kit-shell.json (kit ${kit.label}+${shortHash(kit.hash)}, ${Object.keys(baseline).length} tracked files)`);

// 6. Write a starter README in the project
const readme = `# ${projectName} — a TINS project shell

> **This is a portable kit shell, not a full TINS consumer.** It contains the
> minimum subset of the kit needed to start a new project in any directory,
> on any machine. When the project is done, the artefacts are exported back
> to the top-level kit via the \`kit-staging/\` inbox.

## What to do (in order)

1. Read \`AGENT-BRIEF.md\` (the per-project onboarding).
2. Open a fresh LLM session at this directory. Paste
   \`.kit-shell/prompts/NEW-PROJECT.md\` as the prompt.
3. The LLM runs the SPEC-AUTHOR interview, drafts \`SPEC.md\`, and starts building.
4. While building, the LLM records decisions in \`BUILDER-DECISIONS-REVIEW.md\` via
   \`node .kit-shell/scripts/decision-log.mjs builder ...\`.
5. When done (or at a meaningful milestone), the LLM mines the decisions via
   \`node .kit-shell/scripts/kit-extract.mjs --consumer=.\` to produce
   \`./kit-growth-candidates.md\`.
6. To ship back to the kit machine:
   \`\`\`bash
   node .kit-shell/scripts/kit-staging-export.mjs
   # → produces ./kit-staging-export-<project>-<date>.tar.gz. It also ships new scripts/,
   #   schemas/, templates/, prompts/, lib/ files and a proposals/ lane for edits to existing kit
   #   files, and WARNS about anything it skips (see kit-staging/README.md in the kit).
   \`\`\`
7. Copy the tarball to the kit machine:
   \`\`\`bash
   # at the kit machine
   mkdir -p ../tins-kit/kit-staging/inbox/${projectName}/
   tar -xzf kit-staging-export-<date>.tar.gz -C ../tins-kit/kit-staging/inbox/${projectName}/
   \`\`\`
8. The kit-growth session at the kit root triages the candidates (via
   \`prompts/KIT-GROWTH-SESSION.md\`) and decides which to add to the kit.

## The 3 things you do NOT have (and where to get them)

- The full \`tins-kit/\` (the lib modules, all 21 patterns, the validators,
  the CI workflow). These live on the kit machine. The shell only ships
  the minimum subset needed to start.
- The \`node_modules/\` for the kit's scripts (the shell's scripts are
  zero-dep, so no install needed).
- The CI gate. The shell's scripts run locally; the full gate runs at
  the kit root.

## File layout

\`\`\`
${projectName}/
├── README.md                       ← this file
├── AGENT-BRIEF.md                  ← per-project onboarding
├── HANDOVER.md                     ← the project's W-queue + state
├── BUILDER-DECISIONS-REVIEW.md    ← the project's decision log
├── REVIEWER-DECISIONS-REVIEW.md   ← the project's meta-review log
├── SPEC.md                         ← the spec (filled in by the LLM via SPEC-AUTHOR)
└── .kit-shell/                     ← the portable kit subset
    ├── .kit-shell.json              ← marker: the kit version + hash this shell was cut from
    ├── scripts/                     ← the kit's scripts (all but the kit-machine-only ones)
    │   ├── decision-log.mjs         ← record decisions
    │   ├── kit-extract.mjs          ← mine for kit-worthy patterns
    │   ├── kit-staging-export.mjs   ← produce the tarball for transport
    │   └── _lib/                    ← shared helpers the scripts import
    ├── prompts/
    │   ├── SPEC-AUTHOR.md           ← interview the user
    │   ├── INTERVIEW-CHECKLIST.md
    │   ├── BUILDER-REVIEW-TEMPLATE.md
    │   └── NEW-PROJECT.md           ← the workflow to start
    └── templates/                   ← the kit's templates (HANDOVER.md, PROJECT-AGENT-BRIEF.md, ...)
\`\`\`
`;
writeFileSync(join(targetDir, 'README.md'), readme, 'utf8');
console.log(`  ✓ README.md`);

// 7. Optionally produce a tarball
if (tarballArg) {
  const tarballPath = resolve(tarballArg.split('=')[1]);
  await tar(targetDir, tarballPath);
  console.log(`\n✅ Tarball: ${tarballPath}`);
}

if (missing.length) {
  console.error(`\n✗ Scaffolded WITH ${missing.length} MISSING kit file(s): ${missing.join(', ')}`);
  console.error('  The shell is incomplete. Fix the roster in scripts/kit-new-project-shell.mjs or restore the file.');
  process.exitCode = 1;
}
console.log('\n✅ Scaffolded.');
console.log('');
console.log('Next steps:');
console.log('  1. cd', projectName);
console.log('  2. Read AGENT-BRIEF.md');
console.log('  3. Open a fresh LLM session, paste .kit-shell/prompts/NEW-PROJECT.md');
console.log('  4. The LLM runs the SPEC-AUTHOR interview + builds the project');
console.log('  5. When done: node .kit-shell/scripts/kit-staging-export.mjs');
console.log('  6. Copy the tarball to the kit machine\'s kit-staging/inbox/' + projectName + '/');
console.log('  7. The kit-growth session at the kit root triages the candidates.');

// ============================================================================
// HELPERS
// ============================================================================

// Minimal tar implementation (no external dep). Supports files + dirs.
// Format: ustar (POSIX.1-1988) — sufficient for the kit's needs.
async function tar(srcDir, outFile) {
  // For simplicity, use Node's built-in tar via child_process
  const { spawn } = await import('node:child_process');
  return new Promise((resolveP, rejectP) => {
    // On Windows, tar may not be in PATH. Use Node's archiver-free approach:
    // Just produce a zip via the system tar if available, otherwise copy the dir.
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      // Fallback: produce a .tar.gz via Node's zlib (basic implementation)
      // For now, just copy the dir to a .tar-named folder.
      console.log('  (Windows: using PowerShell Compress-Archive for the tarball)');
      const ps = spawn('powershell', [
        '-NoProfile', '-Command',
        `Compress-Archive -Path '${srcDir}\\*' -DestinationPath '${outFile.replace(/\.tar\.gz$/, '.zip')}' -Force`
      ], { stdio: 'inherit' });
      ps.on('close', (code) => {
        if (code === 0) {
          console.log(`  (produced: ${outFile.replace(/\.tar\.gz$/, '.zip')})`);
          resolveP();
        } else {
          rejectP(new Error(`PowerShell Compress-Archive exited with ${code}`));
        }
      });
    } else {
      const t = spawn('tar', ['czf', outFile, '-C', dirname(srcDir), basename(srcDir)], { stdio: 'inherit' });
      t.on('close', (code) => code === 0 ? resolveP() : rejectP(new Error(`tar exited with ${code}`)));
    }
  });
}
