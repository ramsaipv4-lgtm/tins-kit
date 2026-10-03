// scripts/_lib/decision-parse.mjs
//
// The ONE parser for a consumer's BUILDER-DECISIONS-REVIEW.md / REVIEWER-DECISIONS-REVIEW.md.
// Shared by kit-extract, kit-ingest and decision-log, because round-1 found them disagreeing: kit-ingest split
// on "\n##\s+" and returned 0 candidates from a real 98-decision log written as "### Decision N —".
//
// Recognised decision headings (level 2 or 3, case-insensitive on "Decision"):
//     ## D12 — Title            (the kit's own convention)
//     ### Decision 12 — Title   (what templates/BUILDER-DECISIONS-REVIEW.md ships to consumers)
//     ## R3 — Title             (reviewer log)
// separator: em dash, en dash, hyphen or colon. Headings inside ``` fences are ignored (the template's own
// worked example is fenced and must not count). Other headings (## W6 — date, ### subsections) are not decisions;
// a ### subsection stays inside the preceding decision's body.
//
// parseDecisions(text) -> [{ id:'D12', prefix:'D', num:12, title, level, line, body, date,
//                            context, decision, alternatives, consequences, crossRefs, kitLevelImplication }]

const HEAD_RE = /^(#{1,6})\s+(.*?)\s*$/;
const DECISION_TITLE_RE = /^(?:(D|R)(\d+)|Decision\s+(\d+))\s*[—–:-]\s*(.+)$/i;

export function parseDecisions(text) {
  const lines = String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  // 1. find headings outside code fences
  const heads = [];
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const fm = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fm) {
      if (!fence) fence = fm[1][0];
      else if (fm[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    const h = lines[i].match(HEAD_RE);
    if (h) heads.push({ line: i, level: h[1].length, text: h[2] });
  }
  // 2. decisions and their extents
  const out = [];
  for (let k = 0; k < heads.length; k++) {
    const h = heads[k];
    if (h.level !== 2 && h.level !== 3) continue;
    const m = h.text.match(DECISION_TITLE_RE);
    if (!m) continue;
    let prefix; let num;
    if (m[3] !== undefined) { prefix = 'D'; num = parseInt(m[3], 10); }
    else { prefix = m[1].toUpperCase(); num = parseInt(m[2], 10); }
    const title = m[4].trim();
    // body ends at the next heading that is shallower than this one, or the next decision heading
    let end = lines.length;
    for (let j = k + 1; j < heads.length; j++) {
      const n = heads[j];
      if (n.level < h.level || ((n.level === 2 || n.level === 3) && DECISION_TITLE_RE.test(n.text))) { end = n.line; break; }
    }
    const body = lines.slice(h.line + 1, end).join('\n');
    const dm = body.match(/\*\*Date:?\*\*:?\s*(\d{4}-\d{2}-\d{2})/i) || body.match(/^\s*Date:\s*(\d{4}-\d{2}-\d{2})/im);
    const rec = {
      id: `${prefix}${num}`, prefix, num, title, level: h.level, line: h.line + 1, body,
      date: dm ? dm[1] : null,
    };
    Object.assign(rec, extractFields(body));
    out.push(rec);
  }
  return out;
}

export function extractField(body, fieldName) {
  const re = new RegExp(`\\*\\*${fieldName}[.:]\\*\\*\\s*(.+?)(?=\\n\\*\\*[A-Z]|$)`, 's');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

/** Split a body into bold-labelled paragraphs and read the consumer template's positional fields. */
function extractPositionalFields(body) {
  const fieldRe = /\*\*([^*\n]+?)[.:]\*\*\s*/g;
  const matches = [...body.matchAll(fieldRe)];
  if (matches.length === 0) return null;
  const fields = matches.map((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
    return { label: m[1].trim().toLowerCase(), text: body.slice(start, end).trim() };
  });
  const firstIdx = fields.findIndex((f) => /what changed/.test(f.label));
  if (firstIdx === -1) return null;
  const impactIdx = fields.findIndex((f) => /impact on downstream/.test(f.label));
  const middleEnd = impactIdx === -1 ? fields.length : impactIdx;
  const afterImpact = impactIdx === -1 ? [] : fields.slice(impactIdx + 1);
  return {
    whatChanged: fields[firstIdx].text,
    middle: fields.slice(firstIdx + 1, middleEnd).map((f) => f.text).join(' '),
    impact: impactIdx === -1 ? '' : fields[impactIdx].text,
    kitLevelImplication: afterImpact.map((f) => f.text).join(' '),
  };
}

export function extractFields(body) {
  // Path A: the kit's own field names. Path B: the consumer template's (What changed / ... / Impact on downstream).
  let context = extractField(body, 'Context');
  let decision = extractField(body, 'Decision');
  const alternatives = extractField(body, 'Alternatives') || extractField(body, 'Alternatives considered');
  let consequences = extractField(body, 'Consequences');
  const crossRefs = extractField(body, 'Cross-references') || '';
  let kitLevelImplication = extractField(body, 'Kit-level implication');
  if (!context && !decision) {
    const p = extractPositionalFields(body);
    if (p) {
      context = p.whatChanged;
      decision = p.middle;
      consequences = p.impact;
      kitLevelImplication = kitLevelImplication || p.kitLevelImplication;
    }
  }
  return {
    context: context || '', decision: decision || '', alternatives: alternatives || '',
    consequences: consequences || '', crossRefs, kitLevelImplication: kitLevelImplication || '',
  };
}

/** Highest decision number with this prefix ('D' or 'R'), 0 when none. */
export function maxDecisionNumber(text, prefix = 'D') {
  let max = 0;
  for (const d of parseDecisions(text)) if (d.prefix === prefix && d.num > max) max = d.num;
  return max;
}
