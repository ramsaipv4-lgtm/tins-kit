// scripts/_lib/unified-diff.mjs
// A small zero-dependency unified diff writer and applier, for the proposals lane: a consumer
// exports `proposals/<id>/patch.diff` (a diff against a NAMED kit version) and the kit-side
// reviewer applies it to a SCRATCH copy of the kit (scripts/kit-proposal-check.mjs) and runs the
// gate there. It exists because the kit has no git (VERSIONING.md Rule 5) and `patch`/`git apply`
// cannot be assumed on every OS.
//
// Scope: text files, whole-file add/modify/delete, 3 lines of context, no renames, no binary.
// Line endings: both sides are compared with CRLF folded to LF; applied output uses LF.

// ---- diff -----------------------------------------------------------------------------------

function splitLines(text) {
  const t = text.replace(/\r\n/g, '\n');
  if (t === '') return { lines: [], eofNewline: true };
  const eofNewline = t.endsWith('\n');
  const lines = (eofNewline ? t.slice(0, -1) : t).split('\n');
  return { lines, eofNewline };
}

// Edit script over two arrays of lines: [{op:' '|'-'|'+', line}]. Common prefix/suffix are peeled
// first; the middle is an LCS table. Beyond ~25M cells the middle is emitted as one replace hunk
// (valid, just not minimal).
function editScript(a, b) {
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const am = a.slice(pre, a.length - suf);
  const bm = b.slice(pre, b.length - suf);
  const ops = [];
  for (let i = 0; i < pre; i++) ops.push({ op: ' ', line: a[i] });
  const n = am.length;
  const m = bm.length;
  if (n * m > 25_000_000) {
    for (const l of am) ops.push({ op: '-', line: l });
    for (const l of bm) ops.push({ op: '+', line: l });
  } else {
    const w = m + 1;
    const t = new Uint32Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        t[i * w + j] = am[i] === bm[j] ? t[(i + 1) * w + j + 1] + 1 : Math.max(t[(i + 1) * w + j], t[i * w + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (am[i] === bm[j]) {
        ops.push({ op: ' ', line: am[i] });
        i++;
        j++;
      } else if (t[(i + 1) * w + j] >= t[i * w + j + 1]) {
        ops.push({ op: '-', line: am[i++] });
      } else {
        ops.push({ op: '+', line: bm[j++] });
      }
    }
    while (i < n) ops.push({ op: '-', line: am[i++] });
    while (j < m) ops.push({ op: '+', line: bm[j++] });
  }
  for (let k = a.length - suf; k < a.length; k++) ops.push({ op: ' ', line: a[k] });
  return ops;
}

// oldText === null means "file does not exist" (an added file); newText === null means deleted.
export function unifiedDiff(oldText, newText, path, { context = 3 } = {}) {
  const A = oldText === null ? { lines: [], eofNewline: true } : splitLines(oldText);
  const B = newText === null ? { lines: [], eofNewline: true } : splitLines(newText);
  const ops = editScript(A.lines, B.lines);
  // A line can only be context if it ends the same way on both sides (newline or not). A line that
  // is last in one file and not in the other cannot, so it is shown as a replacement, like git does.
  {
    const fixed = [];
    let oi = 0;
    let ni = 0;
    for (const e of ops) {
      if (e.op === ' ') {
        const oldEol = !(oi === A.lines.length - 1 && !A.eofNewline);
        const newEol = !(ni === B.lines.length - 1 && !B.eofNewline);
        if (oldEol !== newEol) fixed.push({ op: '-', line: e.line }, { op: '+', line: e.line });
        else fixed.push(e);
      } else fixed.push(e);
      if (e.op !== '+') oi++;
      if (e.op !== '-') ni++;
    }
    ops.length = 0;
    ops.push(...fixed);
  }
  // Mark which op carries the "no newline at end of file" note: the last old / last new line.
  const header = `--- ${oldText === null ? '/dev/null' : `a/${path}`}\n+++ ${newText === null ? '/dev/null' : `b/${path}`}\n`;
  const changed = ops.map((o) => o.op !== ' ');
  if (!changed.some(Boolean) && A.eofNewline === B.eofNewline) return '';
  // Group ops into hunks separated by more than 2*context unchanged lines.
  const hunks = [];
  let idx = 0;
  while (idx < ops.length) {
    if (!changed[idx]) {
      idx++;
      continue;
    }
    let start = Math.max(0, idx - context);
    let end = idx;
    let k = idx;
    while (k < ops.length) {
      if (changed[k]) {
        end = k;
        k++;
        continue;
      }
      let run = 0;
      while (k + run < ops.length && !changed[k + run]) run++;
      if (k + run >= ops.length || run > context * 2) break;
      k += run;
    }
    end = Math.min(ops.length - 1, end + context);
    hunks.push([start, end]);
    idx = end + 1;
  }
  // Positions: old/new line numbers at each op index.
  const oldAt = [];
  const newAt = [];
  let o = 1;
  let nw = 1;
  for (const e of ops) {
    oldAt.push(o);
    newAt.push(nw);
    if (e.op !== '+') o++;
    if (e.op !== '-') nw++;
  }
  const totalOld = A.lines.length;
  const totalNew = B.lines.length;
  let out = header;
  for (const [s, e] of hunks) {
    const slice = ops.slice(s, e + 1);
    const oc = slice.filter((x) => x.op !== '+').length;
    const nc = slice.filter((x) => x.op !== '-').length;
    const os = oc === 0 ? Math.max(0, oldAt[s] - 1) : oldAt[s];
    const ns = nc === 0 ? Math.max(0, newAt[s] - 1) : newAt[s];
    out += `@@ -${os},${oc} +${ns},${nc} @@\n`;
    for (let q = 0; q < slice.length; q++) {
      const x = slice[q];
      out += `${x.op}${x.line}\n`;
      const isLastOld = x.op !== '+' && oldAt[s + q] === totalOld;
      const isLastNew = x.op !== '-' && newAt[s + q] === totalNew;
      if ((x.op === '-' && isLastOld && !A.eofNewline) || (x.op === '+' && isLastNew && !B.eofNewline) || (x.op === ' ' && isLastOld && isLastNew && !A.eofNewline)) {
        out += '\\ No newline at end of file\n';
      }
    }
  }
  return out;
}

// ---- parse / apply --------------------------------------------------------------------------

// Parse a (possibly multi-file) unified diff into [{ oldPath, newPath, hunks:[{oldStart,lines:[{op,text}], noEolOld, noEolNew}] }].
export function parsePatch(text) {
  const rows = text.replace(/\r\n/g, '\n').split('\n');
  const files = [];
  let cur = null;
  let hunk = null;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.startsWith('--- ') && rows[i + 1]?.startsWith('+++ ')) {
      const stripPath = (s) => (s === '/dev/null' ? null : s.replace(/^[ab]\//, '').replace(/\t.*$/, ''));
      cur = { oldPath: stripPath(r.slice(4)), newPath: stripPath(rows[i + 1].slice(4)), hunks: [] };
      files.push(cur);
      hunk = null;
      i++;
      continue;
    }
    const h = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(r);
    if (h && cur) {
      hunk = { oldStart: Number(h[1]), oldCount: h[2] === undefined ? 1 : Number(h[2]), lines: [], noEolOld: false, noEolNew: false };
      cur.hunks.push(hunk);
      continue;
    }
    if (!hunk) continue;
    if (r.startsWith('\\')) {
      const prev = hunk.lines[hunk.lines.length - 1];
      if (prev) {
        if (prev.op !== '+') hunk.noEolOld = true;
        if (prev.op !== '-') hunk.noEolNew = true;
      }
      continue;
    }
    const op = r[0];
    if (op === ' ' || op === '-' || op === '+') hunk.lines.push({ op, text: r.slice(1) });
    else if (r === '' && i === rows.length - 1) continue; // trailing newline of the patch text
    else if (r === '') hunk.lines.push({ op: ' ', text: '' }); // an editor stripped the single space
  }
  return files;
}

// Apply one file's hunks to `oldText` (null = file absent). Context must match exactly; a hunk may
// float up to 200 lines from its stated position (the kit moved on a little since the patch's
// version). Returns { ok, text, errors }.
export function applyFilePatch(oldText, filePatch) {
  const errors = [];
  const src = oldText === null ? { lines: [], eofNewline: true } : splitLines(oldText);
  let lines = src.lines.slice();
  let eofNewline = src.eofNewline;
  let shift = 0;
  for (const [hi, h] of filePatch.hunks.entries()) {
    const expected = h.lines.filter((l) => l.op !== '+').map((l) => l.text);
    const replacement = h.lines.filter((l) => l.op !== '-').map((l) => l.text);
    const nominal = Math.max(0, h.oldStart - 1 + shift) + (expected.length === 0 && h.oldStart > 0 ? 1 : 0);
    let at = -1;
    for (let d = 0; d <= 200 && at === -1; d++) {
      for (const cand of d === 0 ? [nominal] : [nominal - d, nominal + d]) {
        if (cand < 0 || cand + expected.length > lines.length) continue;
        if (expected.every((l, k) => lines[cand + k] === l)) {
          at = cand;
          break;
        }
      }
    }
    if (at === -1) {
      errors.push(`hunk ${hi + 1} (@@ -${h.oldStart}) does not match the current file - the kit has changed since the version this patch was made against`);
      continue;
    }
    lines.splice(at, expected.length, ...replacement);
    shift += replacement.length - expected.length;
    if (h.noEolNew) eofNewline = false;
    else if (replacement.length && at + replacement.length === lines.length) eofNewline = true;
  }
  if (errors.length) return { ok: false, text: null, errors };
  return { ok: true, text: lines.length === 0 ? '' : lines.join('\n') + (eofNewline ? '\n' : ''), errors };
}
