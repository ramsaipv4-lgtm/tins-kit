// scripts/_lib/retrieval.mjs
//
// Pattern retrieval used by kit-coverage (task/spec -> patterns) and kit-ingest (decision -> similar patterns).
// Zero dependencies; deterministic; no embeddings (round-1 retrieval: embeddings are not warranted below ~50
// patterns; they are a documented deferred design in docs/changes/round1-D1.md).
//
// Matching rules (round-1 retrieval H1):
//   - WORD-BOUNDARY matching on normalised text ("worlds" never fires "rls"; "sqlite" never fires "sql").
//     Hyphens/underscores/punctuation are spaces on both sides; a final plural "s"/"es" is tolerated.
//   - A pattern's own `triggers` (front matter) are the strong signal. `solves`, the title and, for a pattern WITHOUT
//     front matter, the first ~35 lines of its body supply weak, idf-weighted terms (the reviewer's experiment: that
//     index recovered 5/9, 3/7, 7/11 of the human-applicable sets where the old keyword map found 3/9, 1/7, 8/11).
//   - Ranked with a score floor; a pattern whose status is not "active" is never returned.

export const BODY_INDEX_LINES = 35;

const STOP = new Set(('the a an and or of to in is it for on with as by at be this that are from not no but if then so ' +
  'we our was were has have had will can its into than which when what how why all any one two per also more most only ' +
  'just do does done use used using via vs e g i s t you your they them their there here these those such each every ' +
  'should must may might could would about over under between within without before after while where who whom whose ' +
  'new old need needs needed make makes made get gets got set sets pattern recipe kit ' +
  // generic software/prose words that appear in every spec and carry no topic signal
  'work works run runs out user users app apps file files change changes data time call calls read write form plus ' +
  'three next node api screen same sync side live total single first both view role roles level list state action ' +
  'level code step steps way ways like let say show shown known number order record records value values error ' +
  'spec specs run running public client project plan').split(' '));

/** lower-case; every non-alphanumeric run becomes one space. */
export function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function words(s) {
  return norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
}

/** crude plural stemmer: "migrations"/"migration", "queues"/"queue", "policies"/"policy". */
export function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
  return w;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** RegExp matching `phrase` on word boundaries in a *normalised* haystack. */
export function phraseRegex(phrase) {
  const ws = norm(phrase).split(' ').filter(Boolean);
  if (ws.length === 0) return null;
  const last = ws.length - 1;
  const parts = ws.map((w, i) => escapeRe(w) + (i === last ? '(?:s|es)?' : ''));
  return new RegExp(`(?<![a-z0-9])${parts.join('\\s+')}(?![a-z0-9])`, 'g');
}

export function countPhrase(haystackNorm, phrase) {
  const re = phraseRegex(phrase);
  if (!re) return 0;
  const m = haystackNorm.match(re);
  return m ? m.length : 0;
}

/**
 * True when every content word of a multi-word `phrase` occurs (stem-equal) within `win` consecutive content words
 * of `toks` (the spec's stemmed content words), in any order. "Supabase (Postgres, Auth)" thus matches the trigger
 * "supabase auth" without letting two words from opposite ends of a document match.
 */
export function nearMatch(toks, phrase, win = 8) {
  const need = [...new Set(words(phrase).map(stem))];
  if (need.length < 2) return false;
  const last = new Map();
  let have = 0;
  const inWin = new Map();
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (need.includes(t)) {
      if (!inWin.has(t)) inWin.set(t, []);
      inWin.get(t).push(i);
    }
  }
  if (inWin.size < need.length) return false;
  // slide: for each occurrence of the first needed word, check the others lie within the window
  for (const i0 of inWin.get(need[0])) {
    let ok = true;
    for (const w of need.slice(1)) {
      if (!inWin.get(w).some((j) => Math.abs(j - i0) < win)) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// ---- pattern index ---------------------------------------------------------------------------------------------

function stripMd(line) {
  return line.replace(/^\s*>\s?/, '').replace(/[*_`#]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}

/** First `n` body lines with markdown noise removed. */
export function headLines(body, n = BODY_INDEX_LINES) {
  return String(body).replace(/\r/g, '').split('\n').slice(0, n).map(stripMd).join('\n');
}

/** The pattern's lede: first blockquote paragraph, else first prose paragraph. Plain text, <= max chars. */
export function ledeOf(body, max = 400) {
  const lines = String(body).replace(/\r/g, '').split('\n');
  let para = [];
  let i = 0;
  while (i < lines.length && !/^\s*>/.test(lines[i])) { if (/^##\s/.test(lines[i])) break; i++; }
  if (i < lines.length && /^\s*>/.test(lines[i])) {
    for (; i < lines.length && /^\s*>/.test(lines[i]); i++) {
      const t = lines[i].replace(/^\s*>\s?/, '');
      if (t.trim() === '') break;
      para.push(t);
    }
  } else {
    for (i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '' || /^(#|---|```)/.test(lines[i].trim())) { if (para.length) break; continue; }
      para.push(lines[i]);
    }
  }
  let t = para.join(' ').replace(/\*\*Source:?\*\*.*$/i, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
  if (t.length > max) t = t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  return t;
}

/**
 * Remove anything that would trip the external-packet scrubber (scan-task-packet fails on the string "tins-kit")
 * or point at a file the external worker cannot see.
 */
export function scrub(s) {
  return String(s)
    .replace(/tins-kit[\w./\\-]*/gi, 'the kit')
    .replace(/\b(?:lib|scripts|prompts|templates|schemas|kit-staging)[\\/][\w./\\-]+/g, '<kit file>');
}

export function isActive(p) {
  return !p.meta || p.meta.status == null || p.meta.status === 'active';
}

/**
 * Build the search index for loaded patterns ([{file,id,meta,body}]).
 * Only active patterns are indexed.
 */
export function buildIndex(patterns) {
  const entries = [];
  for (const p of patterns) {
    if (!isActive(p)) continue;
    const meta = p.meta;
    const title = (String(p.body).match(/^#\s+(.+?)\s*$/m) || [null, ''])[1];
    const triggers = meta && Array.isArray(meta.triggers) ? meta.triggers.filter(Boolean) : [];
    const solves = meta && typeof meta.solves === 'string' ? meta.solves : '';
    const weakText = meta
      ? `${title} ${solves} ${triggers.join(" ")} ${headLines(p.body)}`  // triggers + solves lead; first lines add recall
      : `${title} ${headLines(p.body)}`;                        // legacy: index the first ~35 lines
    const weak = [...new Set(words(weakText).map(stem))];
    entries.push({
      id: p.id, file: p.file, meta, body: p.body, triggers, weak, hasFrontMatter: !!meta,
      solves: solves || ledeOf(p.body, 300),
    });
  }
  const N = entries.length || 1;
  const df = new Map();
  for (const e of entries) for (const w of e.weak) df.set(w, (df.get(w) || 0) + 1);
  const idf = (w) => Math.log(1 + N / (df.get(w) || 1));
  return { entries, idf, df, N };
}

const W_TRIGGER_1 = 2;      // single-word trigger
const W_TRIGGER_N = 3;      // multi-word trigger (more specific)
const W_TRIGGER_NEAR = 1.5; // all words of a multi-word trigger within a short window, not adjacent
const W_WEAK = 0.5;         // multiplier on idf for a weak term
const FM_MIN_WEAK = 2;
const FM_WEAK_CAP = 2.4;
const LEGACY_MIN_WEAK = 3;  // a legacy pattern needs this many distinct rare-term hits
const HUB_FRACTION = 0.2;  // a weak term shared by more than this fraction of patterns carries no signal

/**
 * Rank patterns for a task/spec text.
 * opts: { minScore = 1.2, top = 12, scrub = true }  (scrub: strip kit paths and the word "tins-kit" from returned strings)
 * -> [{ id, score, matched:[...], solves, not_when:[...], excerpt, hasFrontMatter, evidence:'trigger'|'weak' }]
 * Strings in the result are scrubbed (no kit path / "tins-kit").
 */
export function rankPatterns(taskText, patterns, opts = {}) {
  const { minScore = 1.2, top = 12, scrub: doScrub = true } = opts;
  const S = doScrub ? scrub : (x) => String(x);
  const index = patterns.entries ? patterns : buildIndex(patterns);
  const hay = norm(taskText);
  const hayToks = words(taskText).map(stem);
  const hayStems = new Set(hayToks);
  const out = [];
  for (const e of index.entries) {
    let score = 0;
    const matched = [];
    for (const t of e.triggers) {
      const c = countPhrase(hay, t);
      if (c === 0) {
        if (nearMatch(hayToks, t)) { score += W_TRIGGER_NEAR; matched.push(t + ' (near)'); }
        continue;
      }
      const multi = norm(t).includes(' ');
      score += (multi ? W_TRIGGER_N : W_TRIGGER_1) + Math.min(0.5, 0.25 * (c - 1));
      matched.push(t);
    }
    const nTrig = matched.length;
    let weakScore = 0; let nWeak = 0;
    for (const w of e.weak) {
      if (!hayStems.has(w)) continue;
      if ((index.df.get(w) || 0) > Math.max(2, HUB_FRACTION * index.N)) continue;
      weakScore += W_WEAK * index.idf(w);
      nWeak++;
      matched.push(w);
    }
    if (e.hasFrontMatter) {
      // front matter is the machine surface: only `triggers` can qualify a pattern. Weak terms (title, solves,
      // assumes) merely break ties among patterns that already have a trigger hit. (Weak-only qualification was
      // tried and scored every pattern identically: spec words like react/vite/postgres are in everyone's `assumes`.)
      if (nTrig > 0) score += Math.min(weakScore, 0.5);
      else if (nWeak >= FM_MIN_WEAK) score += Math.min(weakScore * 0.35, FM_WEAK_CAP);
      else matched.length = 0;
    } else if (nWeak >= LEGACY_MIN_WEAK) {
      // legacy pattern (no front matter): the first ~35 lines are all we have; demand several rare-term hits
      score += Math.min(weakScore, 4);
    } else {
      matched.length = 0;
    }
    if (score < minScore) continue;
    out.push({
      id: e.id,
      score: Math.round(score * 100) / 100,
      matched,
      solves: S(e.solves),
      not_when: e.meta && Array.isArray(e.meta.not_when) ? e.meta.not_when.map(S) : [],
      excerpt: S(ledeOf(e.body, 400)),
      hasFrontMatter: e.hasFrontMatter,
      evidence: nTrig > 0 ? 'trigger' : 'weak',
    });
  }
  out.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return out.slice(0, top);
}

// ---- decision -> pattern similarity (HINTS ONLY, never a gate) --------------------------------------------------

/**
 * Cosine similarity of a decision's text against each pattern's index text (title + solves + triggers + lede,
 * or first ~35 lines for legacy patterns), idf-weighted over the patterns. Returns the top `k` above `theta`,
 * skipping ids in `exclude` (a pattern's own derived_from sources). Reviewer data: ~0.55 precision at top-1,
 * so these are leads for a human, not verdicts.
 */
export function similarPatterns(text, patterns, { k = 3, theta = 0.08, exclude = new Set() } = {}) {
  const idx = patterns.entries ? patterns : buildIndex(patterns);
  const docs = idx.entries.map((e) => {
    const t = `${e.id} ${e.solves} ${e.triggers.join(' ')} ${e.hasFrontMatter ? ledeOf(e.body, 600) : headLines(e.body)}`;
    return { id: e.id, vec: termVec(words(t).map(stem)) };
  });
  const N = docs.length || 1;
  const df = new Map();
  for (const d of docs) for (const w of d.vec.keys()) df.set(w, (df.get(w) || 0) + 1);
  const idf = (w) => Math.log(1 + N / (df.get(w) || 0.5));
  const weigh = (v) => { const o = new Map(); for (const [w, c] of v) o.set(w, (1 + Math.log(c)) * idf(w)); return o; };
  const q = weigh(termVec(words(text).map(stem)));
  const qn = Math.sqrt([...q.values()].reduce((a, b) => a + b * b, 0)) || 1;
  const res = [];
  for (const d of docs) {
    if (exclude.has(d.id)) continue;
    const dv = weigh(d.vec);
    const dn = Math.sqrt([...dv.values()].reduce((a, b) => a + b * b, 0)) || 1;
    let dot = 0;
    for (const [w, x] of q) { const y = dv.get(w); if (y) dot += x * y; }
    const s = dot / (qn * dn);
    if (s >= theta) res.push({ id: d.id, similarity: Math.round(s * 1000) / 1000 });
  }
  res.sort((a, b) => b.similarity - a.similarity);
  return res.slice(0, k);
}

function termVec(ws) {
  const v = new Map();
  for (const w of ws) v.set(w, (v.get(w) || 0) + 1);
  return v;
}
