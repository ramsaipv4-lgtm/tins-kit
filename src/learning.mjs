// Project candidates -> sanitized bundle -> central review -> vendored global knowledge.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import * as G from './git.mjs';
import { parseFrontMatter } from './patterns.mjs';
import { scanText } from './secrets.mjs';
import { safeRelative } from './scope.mjs';
import { KIT_ROOT, kitVersion } from './version.mjs';
import { knowledgeConfig } from './knowledge.mjs';
import { readState } from './session.mjs';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const one = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const canon = (p) => {
  let r = resolve(p); try { r = realpathSync.native(r); } catch {}
  r = r.replace(/\\/g, '/'); return process.platform === 'win32' ? r.toLowerCase() : r;
};
/** True only inside the canonical kit source repository (the one whose code is running, not a vendored copy). */
const central = (root) => canon(root) === canon(KIT_ROOT) && !existsSync(join(root, '.tins', 'kit', 'bin', 'kit.mjs'));
const slug = (s) => /^[a-z0-9][a-z0-9-]{1,60}$/.test(s || '');

function identity(root) {
  const first = G.lines(G.git(['rev-list', '--max-parents=0', 'HEAD'], { cwd: root })).pop();
  let repo = G.git(['remote', 'get-url', 'origin'], { cwd: root, allowFail: true }) || basename(root);
  repo = repo.replace(/(https?:\/\/)[^/@\s]+@/, '$1');
  return { project: basename(root), repo, first_commit: first, head: G.head(root) };
}

function reviewDate() {
  const d = new Date(Date.now() + 90 * 86400000); return d.toISOString().slice(0, 10);
}

function candidateText(id, fm, title, body, evidence) {
  return `---\nid: ${id}\nsolves: ${one(fm.solves)}\ntriggers: ${one(fm.triggers)}\nnot_when: ${one(fm.notWhen)}\nstatus: candidate\nconsumers: ${one(fm.consumer)}\nconsumer_roots: ${fm.firstCommit}\nlicense: ${one(fm.license)}\nsource: ${one(fm.source)}\n---\n# ${one(title)}\n\n${String(body).trim()}\n\n## Evidence\n\n${evidence.map((e) => `- ${one(e)}`).join('\n')}\n`;
}

export function learn(root, o) {
  const id = o._[0];
  const title = o.title; const body = o.body || o.m;
  const evidence = typeof o.evidence === 'string' ? o.evidence.split(',').map(one).filter(Boolean) : [];
  if (!slug(id) || !title || !o.solves || !o.triggers || !body || !evidence.length) {
    throw new Error('usage: kit learn <id> --title T --solves S --triggers a,b --not-when N --evidence path#ID --body "lesson" [--license MIT]');
  }
  if (knowledgeConfig(root).required && !readState(root)) throw new Error('start a recall session before recording a lesson');
  for (const ref of evidence) {
    const [path, anchor] = ref.split('#');
    if (!safeRelative(path) || !existsSync(join(root, path))) throw new Error(`evidence path is unsafe or missing: ${path}`);
    if (anchor && !readFileSync(join(root, path), 'utf8').includes(anchor)) throw new Error(`evidence anchor ${anchor} is absent from ${path}`);
  }
  const who = identity(root);
  const text = candidateText(id, {
    solves: o.solves, triggers: o.triggers, notWhen: o['not-when'], license: o.license || 'UNLICENSED',
    consumer: who.project, firstCommit: who.first_commit, source: `${who.repo}@${who.head}`,
  }, title, body, evidence);
  const rel = `knowledge/candidates/${id}.md`;
  const findings = scanText(rel, text);
  if (findings.length) throw new Error(`lesson contains secret-like text at ${findings[0].path}:${findings[0].line}; nothing written`);
  const path = join(root, rel);
  if (existsSync(path)) throw new Error(`candidate already exists: ${rel}`);
  mkdirSync(join(root, 'knowledge', 'candidates'), { recursive: true }); writeFileSync(path, text);
  return { path: rel, status: 'candidate', source: who };
}

export function exportKnowledge(root, outDir) {
  if (!outDir) throw new Error('kit knowledge export requires --out <empty-directory>');
  const out = resolve(outDir);
  if (out === resolve(root) || out.startsWith(resolve(root) + '\\') || out.startsWith(resolve(root) + '/')) throw new Error('export directory must be outside the project');
  if (existsSync(out) && readdirSync(out).length) throw new Error('export directory is not empty');
  const dir = join(root, 'knowledge', 'candidates');
  const names = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : [];
  if (!names.length) throw new Error('no local knowledge candidates to export');
  const who = identity(root); const files = [];
  mkdirSync(join(out, 'candidates'), { recursive: true });
  for (const name of names) {
    const text = readFileSync(join(dir, name), 'utf8'); const rel = `candidates/${name}`;
    const findings = scanText(rel, text);
    if (findings.length) { rmSync(out, { recursive: true, force: true }); throw new Error(`secret scan refused candidate ${name} at line ${findings[0].line}`); }
    writeFileSync(join(out, rel), text); files.push({ path: rel, sha256: sha(text) });
  }
  const manifest = { format: 'tins-knowledge-bundle-v1', ...who, kit_version: kitVersion(), files };
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { out, manifest };
}

function readBundle(bundle) {
  const root = resolve(bundle); const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
  if (manifest.format !== 'tins-knowledge-bundle-v1' || !manifest.first_commit || !Array.isArray(manifest.files)) throw new Error('invalid knowledge bundle manifest');
  for (const f of manifest.files) {
    if (!safeRelative(f.path) || !f.path.startsWith('candidates/') || !f.path.endsWith('.md')) throw new Error(`unsafe bundle path ${f.path}`);
    const text = readFileSync(join(root, f.path), 'utf8');
    if (sha(text) !== f.sha256) throw new Error(`bundle hash mismatch: ${f.path}`);
    const findings = scanText(f.path, text); if (findings.length) throw new Error(`bundle contains secret-like text in ${f.path}:${findings[0].line}`);
  }
  return { root, manifest };
}

export function importKnowledge(root, bundle) {
  if (!central(root)) throw new Error('knowledge import runs only in the canonical tins-kit source repository');
  const { root: src, manifest } = readBundle(bundle);
  const folder = `${manifest.project.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${manifest.head.slice(0, 10)}`;
  if (!slug(folder)) throw new Error('unsafe project name in bundle');
  const dest = join(root, 'inbox', folder);
  if (existsSync(dest)) throw new Error(`inbox entry already exists: inbox/${folder}`);
  mkdirSync(dest, { recursive: true });
  for (const f of manifest.files) {
    const text = readFileSync(join(src, f.path), 'utf8'); const target = join(dest, f.path);
    mkdirSync(join(target, '..'), { recursive: true }); writeFileSync(target, text);
  }
  writeFileSync(join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { inbox: `inbox/${folder}`, files: manifest.files.length };
}

function mergeFrontMatter(existing, incoming, opts) {
  const old = existing ? existing.fm : {};
  const consumers = [...new Set([...one(old.consumers).split(','), ...one(incoming.consumers).split(',')].map(one).filter(Boolean))];
  const roots = [...new Set([...one(old.consumer_roots).split(','), ...one(incoming.consumer_roots).split(',')].map(one).filter(Boolean))];
  const triggers = [...new Set([...one(old.triggers).split(','), ...one(incoming.triggers).split(',')].map(one).filter(Boolean))];
  const active = old.status === 'active' || opts.activate;
  if (opts.activate && roots.length < 2) throw new Error('active global knowledge needs evidence from two independent consumer root commits');
  const license = opts.license || old.license || incoming.license;
  if (!license || license === 'UNLICENSED') throw new Error('promotion requires an explicit reusable --license');
  return [
    `id: ${incoming.id}`, `solves: ${one(old.solves || incoming.solves)}`, `triggers: ${triggers.join(', ')}`,
    `not_when: ${one(old.not_when || incoming.not_when)}`, `status: ${active ? 'active' : 'tested'}`,
    `consumers: ${consumers.join(', ')}`, `consumer_roots: ${roots.join(', ')}`, `license: ${one(license)}`,
    `source: centrally reviewed knowledge bundles`, `reviewed_by: ${one(opts.reviewedBy)}`, `review_by: ${reviewDate()}`,
  ].join('\n');
}

export function promoteKnowledge(root, inboxFolder, id, opts) {
  if (!central(root)) throw new Error('consumer projects cannot promote their own knowledge; use the canonical kit repository');
  if (!opts.reviewedBy || !slug(id) || !/^[a-z0-9][a-z0-9-]*$/.test(inboxFolder)) throw new Error('usage: kit knowledge promote <inbox-folder> <id> --reviewed-by NAME [--activate] --license MIT');
  const base = join(root, 'inbox', inboxFolder); const manifest = JSON.parse(readFileSync(join(base, 'manifest.json'), 'utf8'));
  const rel = `inbox/${inboxFolder}/candidates/${id}.md`; const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`no imported candidate ${rel}`);
  const incomingText = readFileSync(path, 'utf8'); const incoming = parseFrontMatter(incomingText);
  if (!incoming || incoming.fm.id !== id || incoming.fm.status !== 'candidate') throw new Error('imported item is not a candidate with the expected id');
  if (!one(incoming.fm.consumer_roots).split(',').includes(manifest.first_commit)) throw new Error('candidate consumer root does not match its signed bundle manifest');
  const globalRel = `knowledge/${id}.md`; const globalPath = join(root, globalRel);
  const oldText = existsSync(globalPath) ? readFileSync(globalPath, 'utf8') : null;
  const old = oldText ? parseFrontMatter(oldText) : null;
  const fm = mergeFrontMatter(old, incoming.fm, opts);
  const addition = incomingText.split(/^---$/m).slice(2).join('---').trim();
  const oldBody = old ? oldText.split(/^---$/m).slice(2).join('---').trim() : '';
  const text = `---\n${fm}\n---\n${oldBody || addition}${oldBody ? `\n\n## Additional reviewed evidence — ${one(opts.reviewedBy)}\n\n${addition}` : ''}\n`;
  const findings = scanText(globalRel, text); if (findings.length) throw new Error(`promoted knowledge contains secret-like text at line ${findings[0].line}`);
  mkdirSync(join(root, 'knowledge'), { recursive: true }); writeFileSync(globalPath, text);
  return { path: globalRel, status: /status: active/.test(fm) ? 'active' : 'tested', consumers: fm.match(/^consumers: (.*)$/m)?.[1] };
}

const KNOWLEDGE_README = `# Project knowledge\n\nThis directory is the project's human-readable, Git-backed local memory. Candidates here are evidence, not governing instructions.\n\n- kit learn <id> ... records a candidate with evidence anchors.\n- kit recall <query> searches candidates, current SPEC rows and the vendored global knowledge.\n- kit knowledge export --out <outside-dir> creates a secret-scanned review bundle.\n- Only the canonical tins-kit source repository can import and promote bundles.\n\nObsidian may open the repository as a vault. Do not copy these files into a second vault or edit the vendored .tins/kit copy.\n`;

export function enableKnowledge(root) {
  if (knowledgeConfig(root).required) return { already: true };
  if (readState(root)) throw new Error('a session is open; close or abort it before enabling knowledge enforcement');
  if (!G.isClean(root)) throw new Error('knowledge enable needs a clean worktree; close existing sessions first');
  const cfgPath = join(root, 'tins.json'); const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  const base = G.head(root); cfg.knowledge = { ...(cfg.knowledge || {}), required: true, cutover: base };
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
  const readme = join(root, 'knowledge', 'README.md'); mkdirSync(join(root, 'knowledge'), { recursive: true });
  if (!existsSync(readme)) writeFileSync(readme, KNOWLEDGE_README);
  G.git(['add', '--', 'tins.json', 'knowledge/README.md'], { cwd: root });
  G.git(['commit', '-q', '--no-verify', '-m', 'tins: enable evidence-first knowledge', '-m', `Tins-Knowledge-Cutover: ${base}`], { cwd: root });
  return { already: false, cutover: base, commit: G.head(root) };
}

export function learnCli(root, o) {
  try { const r = learn(root, o); console.log(`candidate: ${r.path} [candidate]\nIt is local evidence only. Export and centrally review it before other projects receive it as global knowledge.`); }
  catch (e) { console.error(`learn: FAIL — ${e.message}`); process.exit(1); }
}

export function learningCli(root, o) {
  const [sub, ...args] = o._;
  try {
    if (sub === 'enable') { const r = enableKnowledge(root); console.log(r.already ? 'knowledge: already enabled' : `knowledge: enabled at ${r.commit}; future sessions require committed pre-work recall`); return; }
    if (sub === 'export') { const r = exportKnowledge(root, o.out); console.log(`knowledge bundle: ${r.out}\n${r.manifest.files.length} candidate(s), project root ${r.manifest.first_commit}`); return; }
    if (sub === 'import') { const r = importKnowledge(root, args[0]); console.log(`imported ${r.files} candidate(s) into ${r.inbox}; review before promotion`); return; }
    if (sub === 'promote') {
      const r = promoteKnowledge(root, args[0], args[1], { reviewedBy: o['reviewed-by'], activate: !!o.activate, license: o.license });
      console.log(`promoted: ${r.path} [${r.status}] consumers: ${r.consumers}\nRun version --write, tests, review and commit in the canonical kit; then upgrade consumers.`); return;
    }
    console.error('usage: kit knowledge enable|export|import|promote ...'); process.exit(2);
  } catch (e) { console.error(`knowledge ${sub || ''}: FAIL — ${e.message}`); process.exit(1); }
}


