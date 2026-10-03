#!/usr/bin/env node
// scripts/kit-ingest.mjs
// Scan kit-staging/inbox/ and produce one merged triage report.
//
// Each project drops artefacts into `kit-staging/inbox/<project-name>/`. For each project this script:
//   1. reads a pre-mined kit-growth-candidates.md (### C<n> sections);
//   2. re-mines BUILDER-DECISIONS-REVIEW.md with the SHARED decision-log parser (scripts/_lib/decision-parse.mjs,
//      the same one kit-extract and decision-log use; round-1 found this script parsing 0 candidates from a real
//      `### Decision N —` log because it split on "\n##\s+");
//   3. harvests lib/patterns/*.md (checked with the shared pattern parser, not with literal headings),
//      lib/<module>/, prompts/*.md;
//   4. lists TYPED PROPOSALS (script | template | schema | doc | patch) found under `proposals/` or in top-level
//      scripts/ templates/ schemas/ docs/ patches/ directories. These are only LISTED, with a warning: they
//      need human review and this script never applies anything;
//   5. adds duplicate/similarity HINTS (token overlap against the kit's active patterns, excluding a pattern's own
//      `derived_from` sources). Hints are leads for a human; they never gate or drop a candidate;
//   6. writes one triage report with globally numbered candidates (C1..Cn, the same numbers in the template).
//
// Usage:
//   node scripts/kit-ingest.mjs                       # scan every inbox entry
//   node scripts/kit-ingest.mjs --out=custom-name.md  # custom output path
//   node scripts/kit-ingest.mjs --archive             # move inbox entries to kit-staging/archive/<date>/ after
//   node scripts/kit-ingest.mjs --json                # JSON to stdout, no file written
//   node scripts/kit-ingest.mjs --inbox=<dir> --kit=<dir>   # other inbox / kit root (tests, a scratch copy)
//
// Exit: 0 no candidates, 1 candidates found (a kit-growth session should run), 2 usage error.

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { resolve, join, dirname, basename, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

let parseDecisions; let parsePatternFile; let loadPatterns; let decisionsDerivedFrom; let buildIndex; let similarPatterns;
try {
  ({ parseDecisions } = await import('./_lib/decision-parse.mjs'));
  ({ parsePatternFile, loadPatterns, decisionsDerivedFrom } = await import('./_lib/pattern-meta.mjs'));
  ({ buildIndex, similarPatterns } = await import('./_lib/retrieval.mjs'));
} catch (e) {
  console.error('ERROR: scripts/_lib/ is missing or broken next to this script (' + (e && e.message) + ').');
  process.exit(2);
}

const args = process.argv.slice(2);
const val = (n) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : null; };
const jsonOut = args.includes('--json');
const archive = args.includes('--archive');

const scriptDir = dirname(fileURLToPath(import.meta.url));
const kitRoot = resolve(val('kit') || join(scriptDir, '..'));
const inboxDir = resolve(val('inbox') || join(kitRoot, 'kit-staging', 'inbox'));
const archiveDir = join(kitRoot, 'kit-staging', 'archive');
const log = (...a) => { if (!jsonOut) console.log(...a); };

if (!existsSync(inboxDir)) {
  console.error(`ERROR: inbox not found: ${inboxDir}`);
  process.exit(2);
}

const TYPED_DIRS = { script: ['scripts', 'script'], template: ['templates', 'template'], schema: ['schemas', 'schema'], doc: ['docs', 'doc'], patch: ['patches', 'patch'] };
const TYPE_OF_DIR = new Map();
for (const [type, names] of Object.entries(TYPED_DIRS)) for (const n of names) TYPE_OF_DIR.set(n, type);
const KIT_DIR_OF_TYPE = { script: 'scripts', template: 'templates', schema: 'schemas', doc: 'docs' };

const projectDirs = readdirSync(inboxDir)
  .map((name) => join(inboxDir, name))
  .filter((p) => { try { return statSync(p).isDirectory(); } catch { return false; } })
  .sort();

if (projectDirs.length === 0) {
  log('Inbox is empty. Nothing to ingest.');
  process.exit(0);
}

const kitPatternsDir = join(kitRoot, 'lib', 'patterns');
const kitPatterns = loadPatterns(kitPatternsDir);
const kitIndex = buildIndex(kitPatterns);
const kitPatternNames = new Set(kitPatterns.map((p) => p.file));

log(`Found ${projectDirs.length} inbox entr${projectDirs.length === 1 ? 'y' : 'ies'}:`);
for (const d of projectDirs) log(`  - ${basename(d)}`);

const allCandidates = []; // { project, source, id, title, score, body, type, hints?, review?, note? }
const skippedOwnSource = []; // { project, id, pattern }
let unchangedKitCopies = 0;

for (const projectDir of projectDirs) {
  const projectName = basename(projectDir);
  log(`\nProcessing: ${projectName}`);

  // 1. Pre-mined kit-growth-candidates.md
  const candidatesPath = join(projectDir, 'kit-growth-candidates.md');
  if (existsSync(candidatesPath)) {
    const text = readFileSync(candidatesPath, 'utf8').replace(/\r\n?/g, '\n');
    const sections = text.split(/\n###\s+/).slice(1);
    let n = 0;
    for (const section of sections) {
      const lines = section.split('\n');
      // "C1 — title (score: 5)" or "C1 (project) — title (score: 5, type: mined)"
      const m = lines[0].match(/^(C\d+)(?:\s*\([^)]*\))?\s*[—–:-]\s*(.+?)\s*\(score:\s*(\d+)/);
      if (!m) continue;
      allCandidates.push({
        project: projectName, source: 'kit-growth-candidates.md', id: `premined:${m[1]}`,
        title: m[2].trim(), score: parseInt(m[3], 10), body: section, type: 'pre-mined',
      });
      n++;
    }
    log(`  - kit-growth-candidates.md: ${n} candidate(s)`);
  }

  // 2. BUILDER-DECISIONS-REVIEW.md, shared parser
  const bdrPath = join(projectDir, 'BUILDER-DECISIONS-REVIEW.md');
  if (existsSync(bdrPath)) {
    const decisions = parseDecisions(readFileSync(bdrPath, 'utf8'));
    const ownSource = new Map();
    for (const kp of kitPatterns) for (const num of decisionsDerivedFrom(kp, projectName)) if (!ownSource.has(num)) ownSource.set(num, kp.id);
    let mined = 0;
    for (const d of decisions) {
      if (d.prefix !== 'D') continue;
      if (ownSource.has(String(d.num))) { skippedOwnSource.push({ project: projectName, id: d.id, pattern: ownSource.get(String(d.num)) }); continue; }
      const score = scoreDecision(d.title, d.body);
      if (score < 3) continue;
      // hints: exclude the patterns this decision is itself a source of (none here, by the skip above) and any
      // pattern whose derived_from names this decision (covered by the same map); never a gate
      const hints = similarPatterns(`${d.title}\n${d.body.slice(0, 3000)}`, kitIndex, { k: 3 });
      allCandidates.push({
        project: projectName, source: `BUILDER-DECISIONS-REVIEW.md (line ${d.line})`,
        id: d.id, title: d.title, score, body: d.body, type: 'mined', date: d.date, hints,
      });
      mined++;
    }
    log(`  - BUILDER-DECISIONS-REVIEW.md: ${decisions.length} decision(s) parsed, ${mined} candidate(s) scored >= 3`);
  }

  // 3. lib/patterns/<name>.md, checked with the shared pattern parser
  const patternsDir = join(projectDir, 'lib', 'patterns');
  if (existsSync(patternsDir)) {
    let count = 0;
    for (const f of readdirSync(patternsDir).sort()) {
      if (!f.endsWith('.md')) continue;
      const text = readFileSync(join(patternsDir, f), 'utf8');
      const kitCopy = kitPatterns.find((p) => p.file === f);
      if (kitCopy && sameText(text, join(kitPatternsDir, f))) { unchangedKitCopies++; continue; } // re-export flood
      const parsed = parsePatternFile(text);
      const title = (parsed.body.match(/^#\s+(.+?)\s*$/m) || [null, f.replace(/\.md$/, '')])[1];
      const notes = [];
      if (!parsed.meta) notes.push('no front matter (triggers/solves/not_when missing: add before accepting)');
      for (const e of parsed.errors) notes.push(`front matter: ${e}`);
      if (!/^##\s+0\./m.test(parsed.body)) notes.push('no "## 0." section (validate --kit will fail it)');
      if (kitCopy) notes.push('DIFFERS from the kit pattern of the same name: a proposed change, not a new pattern');
      allCandidates.push({
        project: projectName, source: `lib/patterns/${f}`, id: `pattern:${f.replace(/\.md$/, '')}`,
        title, score: kitCopy ? 4 : 5, body: text, type: 'pattern', note: notes.join('; '),
        hints: kitCopy ? [] : similarPatterns(`${title}\n${parsed.body.slice(0, 3000)}`, kitIndex, { k: 3 }),
      });
      count++;
    }
    if (count > 0) log(`  - lib/patterns/: ${count} pattern(s)`);
  }

  // 4. lib/<module>/
  const libDir = join(projectDir, 'lib');
  if (existsSync(libDir)) {
    let count = 0;
    for (const entry of readdirSync(libDir).sort()) {
      if (['patterns', 'tests', 'archive', 'node_modules'].includes(entry)) continue;
      const moduleDir = join(libDir, entry);
      if (!statSync(moduleDir).isDirectory()) continue;
      const hasIndex = existsSync(join(moduleDir, 'index.ts'));
      const hasReadme = existsSync(join(moduleDir, 'README.md'));
      const testsDir = join(moduleDir, 'tests');
      const hasTests = existsSync(testsDir) && readdirSync(testsDir).some((f) => f.endsWith('.test.ts'));
      if (hasIndex && hasReadme && hasTests) {
        allCandidates.push({
          project: projectName, source: `lib/${entry}/`, id: `module:${entry}`, title: entry, score: 4,
          body: 'index.ts README.md tests/', type: 'module',
        });
        count++;
      }
    }
    if (count > 0) log(`  - lib/<module>/: ${count} module(s) with canonical layout`);
  }

  // 5. prompts/<name>.md
  const promptsDir = join(projectDir, 'prompts');
  if (existsSync(promptsDir)) {
    let count = 0;
    for (const f of readdirSync(promptsDir).sort()) {
      if (!f.endsWith('.md')) continue;
      const text = readFileSync(join(promptsDir, f), 'utf8');
      if (sameText(text, join(kitRoot, 'prompts', f))) { unchangedKitCopies++; continue; }
      if (text.length > 1000 && (text.includes('The prompt') || text.includes('```\n'))) {
        allCandidates.push({
          project: projectName, source: `prompts/${f}`, id: `prompt:${f.replace(/\.md$/, '')}`,
          title: f.replace(/\.md$/, ''), score: 4, body: text, type: 'prompt',
        });
        count++;
      }
    }
    if (count > 0) log(`  - prompts/: ${count} prompt(s)`);
  }

  // 6. typed proposals (script | template | schema | doc | patch): listed for human review, never applied
  const typed = collectTyped(projectDir, projectName);
  for (const t of typed) allCandidates.push(t);
  if (typed.length > 0) log(`  - typed proposals: ${typed.length} (NEED HUMAN REVIEW; nothing is applied automatically)`);
}

// Sort by score (highest first; stable by project/id), then number globally ONCE.
allCandidates.sort((a, b) => b.score - a.score || a.project.localeCompare(b.project) || String(a.id).localeCompare(String(b.id)));
allCandidates.forEach((c, i) => { c.num = i + 1; });

const today = new Date().toISOString().slice(0, 10);
const outputPath = val('out') ? resolve(val('out')) : join(kitRoot, 'kit-staging', `triage-${today}.md`);

if (jsonOut) {
  console.log(JSON.stringify({
    candidates: allCandidates.map(({ body, ...rest }) => ({ ...rest, bodyChars: String(body).length })),
    projects: projectDirs.length, skippedOwnSource, unchangedKitCopies,
  }, null, 2));
  process.exit(allCandidates.length > 0 ? 1 : 0);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, renderReport(allCandidates), 'utf8');
console.log(`\nWrote: ${outputPath}`);
console.log(`Found: ${allCandidates.length} candidate(s) across ${projectDirs.length} project(s)`);
if (skippedOwnSource.length) console.log(`Skipped ${skippedOwnSource.length} decision(s) that are already the recorded source of a kit pattern.`);
if (unchangedKitCopies) console.log(`Skipped ${unchangedKitCopies} file(s) identical to the kit's own copy (re-export, not growth).`);
const typedCount = allCandidates.filter((c) => ['script', 'template', 'schema', 'doc', 'patch'].includes(c.type)).length;
if (typedCount) console.log(`WARNING: ${typedCount} typed proposal(s) (script/template/schema/doc/patch) need human review before anything is applied.`);

if (archive) {
  mkdirSync(join(archiveDir, today), { recursive: true });
  for (const d of projectDirs) {
    const name = basename(d);
    const dest = join(archiveDir, today, name);
    if (existsSync(dest)) console.log(`  (archive: ${name} already in archive/${today}/, skipping)`);
    else { renameSync(d, dest); console.log(`  Archived: ${name} -> kit-staging/archive/${today}/${name}/`); }
  }
}
process.exit(allCandidates.length > 0 ? 1 : 0);

// ============================================================================
// HELPERS
// ============================================================================

function sameText(text, otherPath) {
  try { return existsSync(otherPath) && readFileSync(otherPath, 'utf8').replace(/\r\n?/g, '\n') === text.replace(/\r\n?/g, '\n'); }
  catch { return false; }
}

function scoreDecision(title, body) {
  let score = 0;
  const allText = `${title} ${body}`.toLowerCase();
  if (/\b(pattern|recipe|discipline|convention|rule|always|never)\b/.test(title.toLowerCase())) score += 2;
  if (body.length > 300) score += 1;
  if (/\b(lesson|anti-pattern|gotcha|pitfall|mistake)\b/.test(allText)) score += 1;
  if (/`[^`]+`|src\/|lib\/|prisma\/|migrations\//.test(body)) score += 2;
  if ((body.match(/jayshankar|incubos|incubation|exam-forge|tins-kit/g) || []).length > 4) score -= 3;
  if (/deferred|rejected|wip|todo/i.test(title)) score -= 2;
  return score;
}

/** Walk <root> (max depth 4, 300 files) and return relative file paths with forward slashes. */
function walkFiles(root, depth = 0, out = []) {
  if (depth > 4 || out.length > 300) return out;
  let names = [];
  try { names = readdirSync(root).sort(); } catch { return out; }
  for (const n of names) {
    if (n === 'node_modules' || n === '.git') continue;
    const full = join(root, n);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walkFiles(full, depth + 1, out);
    else out.push(full);
  }
  return out;
}

/** Typed proposals from `proposals/` (+ `proposals/<type>/...`) and from top-level scripts/ templates/ schemas/ docs/ patches/. */
function collectTyped(projectDir, projectName) {
  const found = [];
  const seen = new Set();
  const add = (type, full, base) => {
    if (seen.has(full)) return;
    seen.add(full);
    const rel = relative(base, full).split(sep).join('/');
    let kitCompare = 'n/a';
    if (KIT_DIR_OF_TYPE[type]) {
      const kitFile = join(kitRoot, KIT_DIR_OF_TYPE[type], ...rel.split('/').slice(rel.split('/')[0] === KIT_DIR_OF_TYPE[type] ? 1 : 0));
      kitCompare = !existsSync(kitFile) ? 'new file (not in the kit)' : sameText(readFileSync(full, 'utf8'), kitFile) ? 'identical to the kit copy' : 'DIFFERS from the kit copy';
    }
    let text = '';
    try { text = readFileSync(full, 'utf8'); } catch { /* binary */ }
    found.push({
      project: projectName, source: relative(projectDir, full).split(sep).join('/'),
      id: `${type}:${rel}`, title: rel, score: type === 'patch' ? 3 : 4, body: text, type,
      review: true, note: `NEEDS HUMAN REVIEW: ${kitCompare}. Never applied automatically.`,
    });
  };
  // top-level typed dirs
  for (const [dirName, type] of TYPE_OF_DIR) {
    const d = join(projectDir, dirName);
    if (existsSync(d) && statSync(d).isDirectory()) for (const f of walkFiles(d)) add(type, f, projectDir);
  }
  // proposals/
  const pd = join(projectDir, 'proposals');
  if (existsSync(pd) && statSync(pd).isDirectory()) {
    for (const f of walkFiles(pd)) {
      const rel = relative(pd, f).split(sep).join('/');
      const first = rel.split('/')[0];
      const type = TYPE_OF_DIR.get(first) || (/\.(patch|diff)$/i.test(rel) ? 'patch' : null);
      if (type) add(type, f, TYPE_OF_DIR.has(first) ? join(pd, first) : pd);
    }
  }
  return found;
}

function renderReport(candidates) {
  const lines = [];
  lines.push(`# Kit Growth Triage — auto-merged from ${projectDirs.length} inbox entr${projectDirs.length === 1 ? 'y' : 'ies'}`);
  lines.push('');
  lines.push(`> **Generated:** ${new Date().toISOString()}`);
  lines.push(`> **Source:** ${projectDirs.map((d) => basename(d)).join(', ')}`);
  lines.push(`> **Kit already has:** ${kitPatterns.length} patterns`);
  lines.push('');
  lines.push(`Found **${candidates.length}** candidate(s), numbered C1..C${candidates.length} across all projects. Scored 1-7; >= 3 means worth a look. Types: pre-mined / mined / pattern / module / prompt / script / template / schema / doc / patch.`);
  lines.push('');
  const typed = candidates.filter((c) => c.review);
  if (typed.length) {
    lines.push(`> **WARNING — ${typed.length} typed proposal(s) (script / template / schema / doc / patch) need human review.** They change the kit's own machinery. Nothing here is applied automatically; check each against the kit's gate on a scratch copy before accepting.`);
    lines.push('');
  }
  if (skippedOwnSource.length) {
    lines.push(`_Not listed: ${skippedOwnSource.length} decision(s) that are already the recorded source of a kit pattern (${skippedOwnSource.map((s) => `${s.project} ${s.id} -> ${s.pattern}`).join('; ')})._`);
    lines.push('');
  }
  if (unchangedKitCopies) {
    lines.push(`_Not listed: ${unchangedKitCopies} file(s) identical to the kit's own copy (a re-export of the kit, not growth)._`);
    lines.push('');
  }
  if (candidates.length === 0) {
    lines.push('_No growth candidates found. The inbox is empty of kit-worthy artefacts._');
    return lines.join('\n') + '\n';
  }
  const byProject = new Map();
  for (const c of candidates) { if (!byProject.has(c.project)) byProject.set(c.project, []); byProject.get(c.project).push(c); }
  for (const [project, list] of byProject) {
    lines.push(`## From \`${project}\` (${list.length} candidate${list.length === 1 ? '' : 's'})`);
    lines.push('');
    for (const c of list) {
      lines.push(`### C${c.num} (${c.project}) — ${c.title} (score: ${c.score}, type: ${c.type})`);
      lines.push('');
      lines.push(`- **Source:** \`${c.source}\``);
      lines.push(`- **ID:** \`${c.id}\``);
      if (c.date) lines.push(`- **Decision date:** ${c.date}`);
      if (c.review) lines.push(`- **NEEDS HUMAN REVIEW:** ${c.note}`);
      else if (c.note) lines.push(`- **Notes:** ${c.note}`);
      if (c.type === 'pre-mined' || c.type === 'mined') {
        const preview = c.body.split('\n').filter((l) => l.trim()).slice(0, 6).join('\n');
        lines.push('```', preview, '```');
      } else if (c.type === 'pattern' || c.type === 'prompt') {
        lines.push('- **Body length:** ' + c.body.length + ' chars');
      } else if (c.type === 'module') {
        lines.push('- **Layout:** ' + c.body);
      } else if (c.review) {
        lines.push('- **Size:** ' + c.body.length + ' chars');
      }
      if (c.hints && c.hints.length) {
        lines.push(`- **Possible overlap (hint only, not a verdict):** ${c.hints.map((h) => `\`${h.id}\` (${h.similarity})`).join(', ')}`);
      }
      lines.push('');
    }
  }
  lines.push('## Triage template', '', 'For each candidate above, fill in:', '', '```');
  for (const c of candidates) lines.push(`C${c.num} (${c.project}: ${c.title}): [accept | reject | defer] — <reason>`);
  lines.push('```', '', '## How to run the triage', '');
  lines.push('1. Open a fresh LLM session at the kit root.');
  lines.push('2. Paste `prompts/KIT-GROWTH-SESSION.md` as the prompt.');
  lines.push('3. The session reads this triage report, triages each candidate, and runs the KITTING workflow for each accepted one.');
  lines.push('4. After all accepted candidates are landed, run `node scripts/validate.mjs --all` to confirm the gate is still green.');
  lines.push('5. The session moves the inbox entry to `kit-staging/archive/<date>/` (use `kit-ingest.mjs --archive` for the next run).');
  lines.push('6. The session runs `node scripts/kit-sync.mjs --to=../<each-project>` to push the new kit to all consumers.');
  return lines.join('\n') + '\n';
}
