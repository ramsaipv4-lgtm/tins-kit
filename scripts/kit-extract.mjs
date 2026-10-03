#!/usr/bin/env node
// scripts/kit-extract.mjs
// The auto-extraction half of the kit's bidirectional loop.
//
// Scans a consumer project's BUILDER-DECISIONS-REVIEW.md + lib/patterns/ +
// key lib/ files, identifies decisions that look like kit-worthy patterns,
// and produces a `kit-growth-candidates.md` report. The kit-growth session
// then runs `prompts/KITTING-REVIEW.md` to triage the report (accept /
// reject / defer each candidate), and the accepted ones go through
// `prompts/KITTING.md` + `scripts/kit-new-pattern.mjs` to land in the kit.
//
// Usage:
//   node scripts/kit-extract.mjs                            # scan ./ (current dir)
//   node scripts/kit-extract.mjs --consumer=../Jayshankar  # explicit path
//   node scripts/kit-extract.mjs --out=growth-report.md    # custom output
//   node scripts/kit-extract.mjs --json                    # JSON output
//   node scripts/kit-extract.mjs --project=jayshankar      # project name as written in patterns' derived_from
//
// Zero-dep Node ESM. Heuristic classifier (not a smart model); produces
// *candidates*, not *decisions*. The triage is human/LLM-driven.

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

let parseDecisions; let parsePatternFile; let loadPatterns; let decisionsDerivedFrom;
try {
  ({ parseDecisions } = await import('./_lib/decision-parse.mjs'));
  ({ parsePatternFile, loadPatterns, decisionsDerivedFrom } = await import('./_lib/pattern-meta.mjs'));
} catch (e) {
  console.error('ERROR: scripts/_lib/ is missing or broken next to this script (' + (e && e.message) + ').');
  console.error('       kit-extract needs scripts/_lib/decision-parse.mjs and pattern-meta.mjs; copy the whole scripts/_lib directory.');
  process.exit(2);
}

const args = process.argv.slice(2);
const consumerArg = args.find(a => a.startsWith('--consumer='));
const outArg = args.find(a => a.startsWith('--out='));
const jsonOut = args.includes('--json');
const projectArg = args.find(a => a.startsWith('--project='));  // name used in derived_from refs (default: consumer dir name)

const scriptDir = dirname(fileURLToPath(import.meta.url));
const kitRoot = resolve(scriptDir, '..');
const consumerRoot = consumerArg
  ? resolve(consumerArg.split('=')[1])
  : process.cwd();
const outputPath = outArg
  ? resolve(outArg.split('=')[1])
  : join(consumerRoot, 'kit-growth-candidates.md');

console.log(`Scanning: ${consumerRoot}`);

// --- Validate consumer has the expected files ---
const builderDecisionsPath = join(consumerRoot, 'BUILDER-DECISIONS-REVIEW.md');
const patternsDir = join(consumerRoot, 'lib', 'patterns');
const libDir = join(consumerRoot, 'lib');

if (!existsSync(builderDecisionsPath) && !existsSync(patternsDir)) {
  console.error('ERROR: consumer has neither BUILDER-DECISIONS-REVIEW.md nor lib/patterns/.');
  console.error('       Run kit-extract on a project that has at least one of these.');
  process.exit(2);
}

// --- Get the kit's existing patterns (so we don't propose duplicates) ---
const kitPatternsDir = join(kitRoot, 'lib', 'patterns');
const kitPatternNames = new Set();
if (existsSync(kitPatternsDir)) {
  for (const f of readdirSync(kitPatternsDir)) {
    if (f.endsWith('.md')) kitPatternNames.add(f.replace(/\.md$/, ''));
  }
}

// --- Parse BUILDER-DECISIONS-REVIEW.md into decisions ---
const decisions = parseDecisionsFile(builderDecisionsPath);

// --- Parse the consumer's lib/patterns/ into patterns ---
const consumerPatterns = parsePatterns(patternsDir);

// --- Classify each decision as a "growth candidate" or not ---
const candidates = [];
// A decision that is already the recorded source of a kit pattern (front matter `derived_from: [project#N]`)
// is not a growth candidate: round-1 found all 16 such decisions re-flagged as new on Jayshankar's log.
const consumerName = projectArg ? projectArg.split('=')[1] : basename(consumerRoot);
const ownSource = new Map(); // decision number -> pattern id
for (const kp of loadPatterns(kitPatternsDir)) {
  for (const n of decisionsDerivedFrom(kp, consumerName)) if (!ownSource.has(n)) ownSource.set(n, kp.id);
}
let skippedOwnSource = 0;
for (const d of decisions) {
  if (ownSource.has(String(d.num))) { skippedOwnSource++; continue; }
  const score = scoreDecision(d, kitPatternNames, consumerPatterns);
  if (score >= 3) {
    candidates.push({ ...d, score, sources: findSources(d) });
  }
}

// --- Also check consumer's lib/patterns/ for kit-worthy ones ---
// (A pattern the consumer wrote locally that the kit doesn't have.)
for (const p of consumerPatterns) {
  if (kitPatternNames.has(p.name)) continue;
  const score = scorePattern(p, consumerPatterns.length);
  if (score >= 3) {
    candidates.push({
      id: `consumer-pattern:${p.name}`,
      title: p.title,
      context: p.firstParagraph,
      decision: p.firstParagraph,
      alternatives: '(see consumer file)',
      consequences: '(see consumer file)',
      crossRefs: '(consumer-local)',
      score,
      sources: [`consumer/lib/patterns/${p.name}.md`],
    });
  }
}

// --- Also check the consumer's lib/ for code modules that might be kit-worthy ---
// (A lib/ module the consumer wrote that the kit doesn't have.)
const consumerLibModules = [];
if (existsSync(libDir)) {
  for (const entry of readdirSync(libDir)) {
    const full = join(libDir, entry);
    if (statSync(full).isDirectory() && !['patterns', 'tests', 'archive', 'node_modules'].includes(entry)) {
      consumerLibModules.push(entry);
    }
  }
}
for (const m of consumerLibModules) {
  if (kitPatternNames.has(m)) continue; // already a kit pattern (unlikely for modules)
  const modulePath = join(libDir, m);
  if (!existsSync(join(modulePath, 'index.ts'))) continue;
  // Quick heuristic: has README + tests + index.ts = kit-worthy
  const hasReadme = existsSync(join(modulePath, 'README.md'));
  const testsDir = join(modulePath, 'tests');
  const hasTests = existsSync(testsDir) && readdirSync(testsDir).some(f => f.endsWith('.test.ts'));
  if (hasReadme && hasTests) {
    candidates.push({
      id: `consumer-module:${m}`,
      title: m,
      context: `Consumer-local lib module: ${m}`,
      decision: `See ${m}/index.ts + ${m}/README.md + ${m}/tests/`,
      alternatives: '(see consumer file)',
      consequences: '(see consumer file)',
      crossRefs: 'consumer-local',
      score: 4,
      sources: [`consumer/lib/${m}/`],
    });
  }
}

// --- Sort by score (highest first) ---
candidates.sort((a, b) => b.score - a.score);

// --- Output ---
if (jsonOut) {
  console.log(JSON.stringify({ candidates, kitPatternNames: [...kitPatternNames] }, null, 2));
  process.exit(0);
}

// Markdown report
const report = renderReport(candidates, kitPatternNames, consumerRoot);
writeFileSync(outputPath, report, 'utf8');
console.log(`Wrote: ${outputPath}`);
console.log(`Found: ${candidates.length} candidate(s)` + (skippedOwnSource ? ` (${skippedOwnSource} decision(s) skipped: already the recorded source of a kit pattern)` : ''));

// Exit code: 0 if no candidates (nothing to do), 1 if there are candidates (kit-growth session should run).
process.exit(candidates.length > 0 ? 1 : 0);

// ============================================================================
// HELPERS
// ============================================================================

function parseDecisionsFile(path) {
  if (!existsSync(path)) return [];
  // ONE shared parser (scripts/_lib/decision-parse.mjs), also used by kit-ingest and decision-log.
  // It reads both "## D<N> —" and "### Decision <N> —" headings, ignores fenced examples, and keeps ### subsections
  // inside the decision they belong to.
  return parseDecisions(readFileSync(path, 'utf8'));
}

function parsePatterns(dir) {
  if (!existsSync(dir)) return [];
  const patterns = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const text = parsePatternFile(readFileSync(join(dir, f), 'utf8')).body;  // front matter is not prose
    const name = f.replace(/\.md$/, '');
    const titleMatch = text.match(/^#\s+(.+?)$/m);
    const firstPara = text.split('\n\n').find(p => p.trim() && !p.startsWith('#') && !p.startsWith('>')) || '';
    patterns.push({
      name,
      title: titleMatch ? titleMatch[1].trim() : name,
      firstParagraph: firstPara.slice(0, 500),
    });
  }
  return patterns;
}

function scoreDecision(d, kitPatterns, consumerPatterns) {
  let score = 0;
  const allText = `${d.title} ${d.context} ${d.decision} ${d.alternatives} ${d.consequences} ${d.kitLevelImplication || ''}`.toLowerCase();

  // +2 if title contains "pattern", "recipe", "discipline", "convention", "rule", "always", "never"
  if (/\b(pattern|recipe|discipline|convention|rule|always|never|the\s+\d+\s+rule)\b/.test(d.title.toLowerCase())) {
    score += 2;
  }

  // +2 if the author explicitly flagged this as kit-worthy (the template's optional
  // "Kit-level implication" field exists precisely to signal this — trust it directly).
  if (d.kitLevelImplication && d.kitLevelImplication.length > 30) {
    score += 2;
  }

  // +1 if body is substantive (>300 chars in decision field)
  if (d.decision.length > 300) score += 1;
  if (d.context.length > 300) score += 1;

  // +1 if it mentions "lesson", "anti-pattern", "gotcha", "pitfall"
  if (/\b(lesson|anti-pattern|gotcha|pitfall|mistake|trade-?off)\b/.test(allText)) {
    score += 1;
  }

  // +2 if it has a worked example (mentions a file path, code, or SQL)
  if (/`[^`]+`|src\/|prisma\/|lib\/|migrations\/|test\//.test(d.body)) {
    score += 2;
  }

  // -3 if it looks project-specific (mentions the consumer by name repeatedly)
  if ((d.body.match(/jayshankar|incubos|incubation|exam-forge|tins-kit/g) || []).length > 4) {
    score -= 3;
  }

  // -2 if it's a deferred/rejected decision
  if (/deferred|rejected|wip|todo/i.test(d.title)) {
    score -= 2;
  }

  // +1 if it's not already a kit pattern
  if (!kitPatterns.has(d.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))) {
    score += 1;
  }

  return score;
}

function scorePattern(p, totalPatterns) {
  let score = 0;
  if (p.firstParagraph.length > 200) score += 2;
  if (p.title.toLowerCase().includes('pattern')) score += 1;
  if (totalPatterns > 5) score += 1; // consumer has a mature pattern collection
  return score;
}

function findSources(d) {
  // Heuristic: look for file paths in the body that look like source files.
  const sources = [];
  const fileMatches = d.body.match(/(?:src|lib|tests|prisma|migrations|scripts|sql)\/[\w\-./]+\.(?:ts|tsx|js|mjs|sql|prisma|md)/g);
  if (fileMatches) {
    for (const m of fileMatches.slice(0, 5)) sources.push(m);
  }
  return sources;
}

function renderReport(candidates, kitPatterns, consumerRoot) {
  const lines = [];
  lines.push(`# Kit Growth Candidates — auto-extracted from ${consumerRoot}`);
  lines.push('');
  lines.push(`> **Generated:** ${new Date().toISOString()}`);
  lines.push(`> **Source:** consumer's BUILDER-DECISIONS-REVIEW.md + lib/patterns/ + lib/`);
  lines.push(`> **Kit already has:** ${kitPatterns.size} patterns (${[...kitPatterns].slice(0, 5).join(', ')}…)`);
  lines.push('');
  lines.push(`Found **${candidates.length}** candidate(s) for the kit. Each is scored 1-7; ≥3 means worth a look.`);
  lines.push('');
  lines.push('## How to triage this report');
  lines.push('');
  lines.push('1. Open this file at the kit root.');
  lines.push('2. For each candidate, decide: **accept** / **reject** / **defer**.');
  lines.push('3. Run `prompts/KITTING-REVIEW.md` to drive the triage.');
  lines.push('4. For accepted ones, run `prompts/KITTING.md` + `scripts/kit-new-pattern.mjs` to land them in the kit.');
  lines.push('');
  lines.push('## The candidates');
  lines.push('');

  if (candidates.length === 0) {
    lines.push('_No growth candidates found. The consumer\'s BUILDER-DECISIONS-REVIEW.md is either empty, all project-specific, or already covered by the kit._');
    lines.push('');
    lines.push('**If you expected candidates:** check that the consumer\'s BUILDER-DECISIONS-REVIEW.md has entries with either `## D<N> — <title>` headers + `**Context.**` / `**Decision.**` / `**Consequences.**` fields, or `### Decision <N> — <title>` headers + `**What changed.**` / ... / `**Impact on downstream.**` fields (the format `templates/BUILDER-DECISIONS-REVIEW.md` ships to consumers).');
    return lines.join('\n');
  }

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    lines.push(`### C${i + 1} — ${c.title} (score: ${c.score})`);
    lines.push('');
    lines.push(`- **ID:** \`${c.id}\``);
    if (c.context) lines.push(`- **Context:** ${c.context.slice(0, 300)}${c.context.length > 300 ? '…' : ''}`);
    if (c.decision) lines.push(`- **Decision:** ${c.decision.slice(0, 300)}${c.decision.length > 300 ? '…' : ''}`);
    if (c.alternatives && c.alternatives !== '(see consumer file)') {
      lines.push(`- **Alternatives:** ${c.alternatives.slice(0, 200)}${c.alternatives.length > 200 ? '…' : ''}`);
    }
    if (c.consequences && c.consequences !== '(see consumer file)') {
      lines.push(`- **Consequences:** ${c.consequences.slice(0, 200)}${c.consequences.length > 200 ? '…' : ''}`);
    }
    if (c.crossRefs) lines.push(`- **Cross-references:** ${c.crossRefs.slice(0, 200)}`);
    if (c.kitLevelImplication) lines.push(`- **Kit-level implication:** ${c.kitLevelImplication.slice(0, 300)}${c.kitLevelImplication.length > 300 ? '…' : ''}`);
    if (c.sources && c.sources.length > 0) {
      lines.push(`- **Sources (file paths from the body):**`);
      for (const s of c.sources) lines.push(`  - \`${s}\``);
    }
    lines.push('');
  }

  lines.push('## Triage template');
  lines.push('');
  lines.push('For each candidate above, fill in:');
  lines.push('');
  lines.push('```');
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    lines.push(`C${i + 1} (${c.title}): [accept | reject | defer] — <reason>`);
  }
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}
