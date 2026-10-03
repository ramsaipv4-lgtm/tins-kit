#!/usr/bin/env node
// scripts/kit-coverage.mjs  (v2)
//
// Which `lib/patterns/` entries are likely to apply to a spec or a task? Reads each pattern's own front matter
// (`triggers`, `solves`, `not_when`) via scripts/_lib/pattern-meta.mjs; there is no second, hand-kept keyword map.
// Patterns that still lack front matter are indexed on the first ~35 lines of their body.
//
// Usage:
//   node scripts/kit-coverage.mjs                       # scan ./SPEC.md
//   node scripts/kit-coverage.mjs --spec=path/SPEC.md   # (also: --spec path)
//   node scripts/kit-coverage.mjs --task <file|text>    # a task brief, a file, or a sentence
//   node scripts/kit-coverage.mjs --task "..." --json   # [{id, score, solves, not_when, excerpt, matched, hasFrontMatter, evidence}]
//   options: --patterns=<dir> (default: this kit's lib/patterns)  --min-score=1.2  --top=12  --weak (also show weak, vocabulary-only matches)
//
// Matching is on word boundaries, ranked, with a score floor. A pattern whose status is not `active` is never
// returned. `not_when` is printed for every hit: read it before you apply the pattern. In --json mode every string
// is scrubbed of kit paths and of the word "tins-kit", so the output can be inlined into an external worker packet.
// This is a recommendation, not a verdict.
//
// Exit: 0 ok (even with zero hits), 2 usage error.

import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

let loadPatterns; let rankPatterns; let buildIndex;
try {
  ({ loadPatterns } = await import('./_lib/pattern-meta.mjs'));
  ({ rankPatterns, buildIndex } = await import('./_lib/retrieval.mjs'));
} catch (e) {
  console.error('ERROR: scripts/_lib/ is missing or broken next to this script (' + (e && e.message) + ').');
  console.error('       kit-coverage needs scripts/_lib/pattern-meta.mjs and scripts/_lib/retrieval.mjs; copy the whole scripts/_lib directory.');
  process.exit(2);
}

const argv = process.argv.slice(2);
function opt(name) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith(`--${name}=`)) return argv[i].slice(name.length + 3);
    if (argv[i] === `--${name}`) return argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : '';
  }
  return null;
}
const jsonOut = argv.includes('--json');
const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const patternsDir = resolve(opt('patterns') || join(kitRoot, 'lib', 'patterns'));
const minScore = opt('min-score') !== null ? Number(opt('min-score')) : 1.2;
const top = opt('top') !== null ? parseInt(opt('top'), 10) : 12;
if (!Number.isFinite(minScore) || !Number.isInteger(top) || top < 1) {
  console.error('ERROR: --min-score must be a number and --top a positive integer');
  process.exit(2);
}

// ---- the text to match ------------------------------------------------------------------------------------------
let text; let label;
const taskArg = opt('task');
const specArg = opt('spec');
if (taskArg !== null) {
  if (taskArg === '') { console.error('ERROR: --task needs a file path or some text'); process.exit(2); }
  if (existsSync(taskArg) && statSync(taskArg).isFile()) { text = readFileSync(taskArg, 'utf8'); label = resolve(taskArg); }
  else if (/\s/.test(taskArg) || taskArg.length > 120) { text = taskArg; label = '(inline task text)'; }
  else { console.error(`ERROR: --task "${taskArg}" is not an existing file and is too short to be a task description`); process.exit(2); }
} else {
  const specPath = resolve(specArg || join(process.cwd(), 'SPEC.md'));
  if (!existsSync(specPath)) { console.error(`ERROR: SPEC.md not found at ${specPath}`); process.exit(2); }
  text = readFileSync(specPath, 'utf8'); label = specPath;
}

if (!existsSync(patternsDir)) {
  console.error(`ERROR: patterns dir not found at ${patternsDir}`);
  process.exit(2);
}

const patterns = loadPatterns(patternsDir);
const index = buildIndex(patterns);
const hits = rankPatterns(text, index, { minScore, top, scrub: jsonOut });

if (jsonOut) {
  console.log(JSON.stringify(hits.map(({ id, score, solves, not_when, excerpt, matched, hasFrontMatter, evidence }) =>
    ({ id, score, solves, not_when, excerpt, matched, hasFrontMatter, evidence })), null, 2));
  process.exit(0);
}

console.log(`Kit coverage for: ${label}\n`);
const showWeak = argv.includes('--weak');
const shown = showWeak ? hits : hits.filter((h) => h.evidence !== 'weak');
const hiddenWeak = hits.length - shown.length;
console.log(`${shown.length} of ${index.entries.length} active patterns look relevant (score floor ${minScore}):\n`);
// "weak" = no trigger phrase matched, only shared vocabulary. Two round-2 builders found these were pure noise for a
// non-web project (a CLI got Postgres/React patterns); they are hidden by default, counted below, and kept in --json.
for (const h of shown) {
  console.log(`  ${String(h.score).padStart(5)}  ${h.id}${h.evidence === 'weak' ? '   (weak: no trigger phrase, matched on shared vocabulary)' : ''}${h.hasFrontMatter ? '' : '   (no front matter)'}`);
  console.log(`         matched:  ${h.matched.slice(0, 8).join(', ')}`);
  if (h.solves) console.log(`         solves:   ${h.solves.slice(0, 160)}`);
  for (const nw of h.not_when) console.log(`         NOT WHEN: ${nw}`);
}
if (hiddenWeak) console.log(`\n(${hiddenWeak} weak match(es) hidden — no trigger phrase, shared vocabulary only; --weak shows them)`);
if (hits.length === 0) console.log('  (none: the text is very early-stage, or nothing in the kit fits)');
const skipped = patterns.length - index.entries.length;
console.log(`\nTotal patterns in kit: ${patterns.length}${skipped ? ` (${skipped} not active, never suggested)` : ''}`);
console.log('This is a recommendation. Read each pattern and its NOT WHEN lines before applying it.');
