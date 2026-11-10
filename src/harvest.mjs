// Read-only extraction from existing TINS projects into the canonical kit's review inbox.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import * as G from './git.mjs';
import { parseFrontMatter } from './patterns.mjs';
import { scanText } from './secrets.mjs';
import { central } from './learning.mjs';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const one = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const unquote = (s) => one(s).replace(/^['"]|['"]$/g, '');
const slug = (s) => one(s).toLowerCase().replace(/[`'"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 56).replace(/-$/, '');
const DECISION_FILES = ['BUILDER-DECISIONS-REVIEW.md', 'REVIEWER-DECISIONS-REVIEW.md', 'docs/build-journal/integration.md'];

function walk(root, rel = '', out = []) {
  const dir = join(root, rel); if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name); const r = rel ? `${rel}/${name}` : name;
    if (statSync(p).isDirectory()) walk(root, r, out); else if (p.endsWith('.md')) out.push(r);
  }
  return out;
}

function evidenceFiles(root) {
  const files = DECISION_FILES.filter((f) => existsSync(join(root, f)));
  files.push(...walk(root, 'lib/patterns'), ...walk(root, 'tins-kit/lib/patterns'), ...manualDocuments(root));
  if (existsSync(join(root, 'docs/next.md'))) files.push('docs/next.md');
  return [...new Set(files)].sort();
}

function identity(source) {
  const root = resolve(source);
  const gitRoot = G.git(['rev-parse', '--show-toplevel'], { cwd: root, allowFail: true });
  if (gitRoot) return {
    project: basename(root), versioned: true,
    repo: G.git(['remote', 'get-url', 'origin'], { cwd: root, allowFail: true }) || gitRoot,
    first_commit: G.lines(G.git(['rev-list', '--max-parents=0', 'HEAD'], { cwd: root })).pop(),
    head: G.head(root), gitRoot,
  };
  const files = evidenceFiles(root);
  const fingerprint = sha(files.map((f) => `${f}\0${readFileSync(join(root, f), 'utf8')}`).join('\0'));
  const stable = sha(root.replace(/\\/g, '/').toLowerCase()).slice(0, 16);
  return {
    project: basename(root), versioned: false, repo: `unversioned://${root.replace(/\\/g, '/')}`,
    first_commit: `unversioned-root:${stable}`, head: `unversioned:${fingerprint.slice(0, 16)}`, gitRoot: null,
  };
}

function decisionSections(text, path) {
  const lines = text.split(/\r?\n/); const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{2,4})\s+(.*)$/); if (h) headings.push({ i, level: h[1].length, text: h[2] });
  }
  const out = [];
  for (let h = 0; h < headings.length; h++) {
    const cur = headings[h];
    const m = cur.text.match(/^(?:(Decision|Finding)\s+(\d+)|([DCI]-?\d+)|(\d+))\.?\s*(?:—|:|-)\s*(.+)$/i);
    if (!m) continue;
    let end = lines.length;
    for (let n = h + 1; n < headings.length; n++) if (headings[n].level <= cur.level) { end = headings[n].i; break; }
    const title = one(m[5]); const kind = (m[1] || '').toLowerCase() === 'finding' ? 'finding' : 'decision';
    out.push({ id: `${kind}-${slug(title)}`, title, source: `${path}#${cur.text}`, body: lines.slice(cur.i, end).join('\n').trim() });
  }
  return out;
}

function improvementBullets(text, path) {
  const lines = text.split(/\r?\n/); const starts = [];
  for (let i = 0; i < lines.length; i++) if (/^- \*\*C\d+\*\*/.test(lines[i])) starts.push(i);
  return starts.map((start, n) => {
    const end = n + 1 < starts.length ? starts[n + 1] : lines.findIndex((l, i) => i > start && /^###\s/.test(l));
    const stop = end < 0 ? lines.length : end;
    const first = lines[start].match(/^- \*\*(C\d+)\*\*\s+(.+)$/); if (!first) return null;
    const body = lines.slice(start, stop).join('\n').trim();
    const title = one(first[2].split(/\.\s/)[0]);
    return { id: `improvement-${first[1].toLowerCase()}-${slug(title)}`, title, source: `${path}#${first[1]}`, body };
  }).filter(Boolean);
}

function triggersFrom(value, fallback) {
  let v = value || '';
  if (one(v).startsWith('[')) { try { v = JSON.parse(v.replace(/'/g, '"')).join(', '); } catch { v = v.replace(/[\[\]"]/g, ''); } }
  return [...new Set([...one(v).split(','), fallback.replace(/-/g, ' ')].map(one).filter(Boolean))].join(', ');
}

function patternDocument(path, text) {
  const id = basename(path, '.md'); const parsed = parseFrontMatter(text);
  if (parsed?.fm.id && parsed.fm.solves) {
    return { id, title: unquote(parsed.fm.solves), triggers: triggersFrom(parsed.fm.triggers, id), body: text, source: `${path}#${parsed.fm.id}` };
  }
  const heading = text.match(/^#\s+(.+)$/m)?.[1] || id.replace(/-/g, ' ');
  return { id, title: one(heading), triggers: id.replace(/-/g, ' '), body: text, source: `${path}#${one(heading)}` };
}

function manualDocuments(source) {
  const files = [];
  for (const f of ['HANDOVER.md', 'CONTINUE.md', 'docs/next.md']) if (existsSync(join(source, f))) files.push(f);
  for (const dir of ['docs/build-journal', 'docs/kit-growth', 'course']) walk(source, dir, files);
  return [...new Set(files)].sort();
}

/** Extract structured decisions/reviews and legacy patterns. Narrative documents are only inventoried. */
export function harvest(source) {
  const root = resolve(source); if (!existsSync(root)) throw new Error(`source project does not exist: ${root}`);
  const who = identity(root); const raw = [];
  for (const rel of DECISION_FILES) {
    const p = join(root, rel); if (!existsSync(p)) continue;
    raw.push(...decisionSections(readFileSync(p, 'utf8'), rel));
  }
  if (existsSync(join(root, 'docs/next.md'))) raw.push(...improvementBullets(readFileSync(join(root, 'docs/next.md'), 'utf8'), 'docs/next.md'));
  const patternPaths = [...walk(root, 'lib/patterns'), ...walk(root, 'tins-kit/lib/patterns')];
  for (const rel of patternPaths) raw.push(patternDocument(rel, readFileSync(join(root, rel), 'utf8')));
  const candidates = []; const skipped = []; const used = new Map();
  for (const item of raw) {
    let id = item.id; const n = (used.get(id) || 0) + 1; used.set(id, n); if (n > 1) id = `${id}-${n}`;
    const text = `---\nid: ${id}\nsolves: ${one(item.title)}\ntriggers: ${one(item.triggers || item.title)}\nnot_when: The source context does not apply; this harvested candidate has not been independently verified.\nstatus: candidate\nconsumers: ${who.project}\nconsumer_roots: ${who.first_commit}\nlicense: UNLICENSED\nsource: ${one(who.repo)}@${who.head}\n---\n# ${one(item.title)}\n\n> Harvested evidence, not instructions and not reviewed global knowledge.\n\n${item.body}\n\n## Evidence\n\n- ${item.source}\n`;
    const findings = scanText(`candidates/${id}.md`, text);
    if (findings.length) { skipped.push({ id, source: item.source, findings: findings.map((f) => ({ line: f.line, class: f.class })) }); continue; }
    candidates.push({ id, title: item.title, source: item.source, text, sha256: sha(text) });
  }
  const documents = manualDocuments(root).map((path) => ({ path, sha256: sha(readFileSync(join(root, path), 'utf8')) }));
  return { manifest: { format: 'tins-knowledge-bundle-v1', ...who, files: candidates.map((c) => ({ path: `candidates/${c.id}.md`, sha256: c.sha256 })), documents }, candidates, skipped };
}


function renderReview(report) {
  const m = report.manifest;
  const lines = [
    `# Harvest review — ${m.project}`, '',
    `- Source: ${m.repo}`,
    `- Version: ${m.head}`,
    `- Git-backed: ${m.versioned ? 'yes' : 'no (cannot satisfy active two-consumer rule)'}`,
    `- Consumer root: ${m.first_commit}`, '',
    'Every item below is an UNREVIEWED CANDIDATE. Similarity does not prove equivalence.',
    'Promote only after checking the source context, applicability, licence and evidence.', '',
    '## Candidates', '',
    '| ID | Lesson | Source |', '|---|---|---|',
    ...report.candidates.map((c) => `| ${c.id} | ${one(c.title).replace(/\|/g, '\\|')} | ${c.source} |`), '',
    '## Secret-scanned skips', '',
  ];
  if (!report.skipped.length) lines.push('None.');
  for (const s of report.skipped) lines.push(`- ${s.id} (${s.source}): ${s.findings.map((f) => `${f.class} at line ${f.line}`).join(', ')}. Value not shown.`);
  lines.push('', '## Narrative documents requiring human extraction', '');
  for (const d of m.documents) lines.push(`- ${d.path} (sha256 ${d.sha256})`);
  if (!m.documents.length) lines.push('None.');
  lines.push('', 'Promote one item:', '', `node bin/kit.mjs knowledge promote <inbox-folder> <id> --reviewed-by <name> --license <license>`, '');
  return lines.join('\n');
}

export function writeHarvest(kitRoot, report) {
  if (!central(kitRoot)) throw new Error('harvest --write runs only in the canonical tins-kit source repository');
  const m = report.manifest;
  const version = m.head.startsWith('unversioned:') ? m.head.split(':')[1].slice(0, 10) : m.head.slice(0, 10);
  const folder = `harvest-${slug(m.project)}-${version}`;
  if (!folder || folder.includes('..')) throw new Error('unsafe harvest inbox name');
  const dest = join(kitRoot, 'inbox', folder);
  if (existsSync(dest)) throw new Error(`harvest inbox already exists: inbox/${folder}`);
  mkdirSync(join(dest, 'candidates'), { recursive: true });
  for (const c of report.candidates) writeFileSync(join(dest, 'candidates', `${c.id}.md`), c.text);
  writeFileSync(join(dest, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');
  writeFileSync(join(dest, 'HARVEST-REPORT.json'), JSON.stringify({ skipped: report.skipped }, null, 2) + '\n');
  writeFileSync(join(dest, 'REVIEW.md'), renderReview(report));
  return { inbox: `inbox/${folder}`, files: report.candidates.length, skipped: report.skipped.length, documents: m.documents.length };
}

export function harvestCli(kitRoot, o) {
  try {
    const source = o._[0]; if (!source) { console.error('usage: kit harvest <source-project> [--write] [--json]'); process.exit(2); }
    const report = harvest(source);
    if (o.write) {
      const r = writeHarvest(kitRoot, report);
      console.log(`harvest: ${r.files} candidates, ${r.skipped} skipped, ${r.documents} narrative documents inventoried -> ${r.inbox}`);
      console.log('Nothing was promoted or changed in the source project. Review candidates before promotion.');
    } else if (o.json) console.log(JSON.stringify(report, null, 2));
    else {
      console.log(`harvest dry run: ${report.manifest.project} @ ${report.manifest.head}`);
      console.log(`${report.candidates.length} candidates; ${report.skipped.length} skipped; ${report.manifest.documents.length} narrative documents inventoried`);
      for (const c of report.candidates) console.log(`  ${c.id} <- ${c.source}`);
      for (const s of report.skipped) console.log(`  SKIPPED ${s.id}: ${s.findings.map((f) => `${f.class} at line ${f.line}`).join(', ')}`);
      console.log('No files written. Re-run with --write inside the canonical kit to create an inbox bundle.');
    }
  } catch (e) { console.error(`harvest: FAIL — ${e.message}`); process.exit(1); }
}
