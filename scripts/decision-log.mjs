#!/usr/bin/env node
// scripts/decision-log.mjs
//
// Append a new decision to a consumer's `BUILDER-DECISIONS-REVIEW.md` or `REVIEWER-DECISIONS-REVIEW.md`.
//
// Usage:
//   node scripts/decision-log.mjs builder \
//     --title="Money is Decimal(18,4)" \
//     --context="The spec said Decimal, we picked 18,4 at three layers" \
//     --decision="Postgres: Decimal(18,4); Zod: regex; Prisma: Prisma.Decimal" \
//     --alternatives="Float (rejected: drift); BigInt paise (rejected: unreadable)" \
//     --consequences="Frontend must parse Decimal; ESLint rule blocks Number()"
//
//   node scripts/decision-log.mjs reviewer --title="Approve Mode A" --evidence="5-command smoke test green" --decision="approved"
//   options: --cross-refs="..."  --date=YYYY-MM-DD (default: today, UTC)  --number=N (see below)  --dir=<project root>
//
// Every new decision gets a `**Date:** YYYY-MM-DD` line (round-1 retrieval M1: decisions carried no dates, so
// "did the pattern exist before the decision?" could not be computed).
//
// NUMBERING. The next number is max(existing)+1 over the WHOLE file, reading both heading styles ("## D12 —" and
// "### Decision 12 —", via scripts/_lib/decision-parse.mjs). The new section is APPENDED (never a rewrite), and the
// file is re-read afterwards: if the number now appears twice (two writers raced) the script says so and exits 1.
// It also refuses when another writer has already CLAIMED that number: a file `sessions/claims/decision-number/<n>`
// (created by `session.mjs claim decision-number:<n>`). THIS SCRIPT DOES NOT MAKE ITS OWN CLAIMS. Real multi-agent
// allocation is `node scripts/session.mjs claim decision-number:<n>`, then `decision-log.mjs ... --number=<n>`.
// In a project that has a `sessions/claims/decision-number/` directory, --number is REQUIRED to name a claimed number,
// because a bare max+1 cannot be known to be safe there. Single-agent projects need none of this.

import { readFileSync, appendFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import process from 'node:process';

let parseDecisions;
try {
  ({ parseDecisions } = await import('./_lib/decision-parse.mjs'));
} catch (e) {
  console.error('ERROR: scripts/_lib/decision-parse.mjs is missing next to this script (' + (e && e.message) + '). Copy the whole scripts/_lib directory.');
  process.exit(2);
}

const SIDE = process.argv[2]; // 'builder' or 'reviewer'
if (SIDE !== 'builder' && SIDE !== 'reviewer') {
  console.error('Usage: decision-log.mjs {builder|reviewer} --title="..." [...]');
  process.exit(2);
}

const args = process.argv.slice(3);
function argValue(name) {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=').slice(1).join('=') : null;
}

const title = argValue('title');
const context = argValue('context') || '(no context provided)';
const decision = argValue('decision') || '(no decision provided)';
const alternatives = argValue('alternatives') || '(none)';
const consequences = argValue('consequences') || '(none)';
const crossRefs = argValue('cross-refs') || '';

if (!title) {
  console.error('ERROR: --title is required');
  process.exit(2);
}
const dateArg = argValue('date');
if (dateArg !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error('ERROR: --date must be YYYY-MM-DD');
  process.exit(2);
}
const numberArg = argValue('number');
if (numberArg !== null && !/^[1-9]\d*$/.test(numberArg)) {
  console.error('ERROR: --number must be a positive integer');
  process.exit(2);
}

const filename = SIDE === 'builder' ? 'BUILDER-DECISIONS-REVIEW.md' : 'REVIEWER-DECISIONS-REVIEW.md';
const prefix = SIDE === 'builder' ? 'D' : 'R';
const root = resolve(argValue('dir') || process.cwd());
const filePath = join(root, filename);

if (!existsSync(filePath)) {
  console.error(`ERROR: ${filename} not found in ${root}`);
  process.exit(2);
}

const existing = readFileSync(filePath, 'utf8');
const decisions = parseDecisions(existing).filter((d) => d.prefix === prefix);
const max = decisions.reduce((m, d) => Math.max(m, d.num), 0);

// ---- claims (written by session.mjs claim decision-number:<n>) ----
const claimsDir = join(root, 'sessions', 'claims', 'decision-number');
const claimed = new Set();
const usesClaims = existsSync(claimsDir);
if (usesClaims) {
  for (const f of readdirSync(claimsDir)) {
    const m = f.match(/^(?:[DR])?(\d+)(?:\..*)?$/i);
    if (m) claimed.add(parseInt(m[1], 10));
  }
}

let next;
if (numberArg !== null) {
  next = parseInt(numberArg, 10);
  if (decisions.some((d) => d.num === next)) {
    console.error(`ERROR: ${prefix}${next} already exists in ${filename}. Refusing to write a duplicate number.`);
    process.exit(1);
  }
  if (usesClaims && !claimed.has(next)) {
    console.error(`ERROR: this project uses claims (sessions/claims/decision-number/) but ${prefix}${next} is not claimed.`);
    console.error(`       Run: node scripts/session.mjs claim decision-number:${next}   then retry.`);
    process.exit(1);
  }
} else {
  next = max + 1;
  if (usesClaims) {
    console.error(`ERROR: this project allocates decision numbers with claims (sessions/claims/decision-number/).`);
    console.error(`       The file's next free number is ${prefix}${next}${claimed.has(next) ? ', which another writer has already claimed' : ''}.`);
    console.error(`       Run: node scripts/session.mjs claim decision-number:<n>   then: decision-log.mjs ${SIDE} --number=<n> ...`);
    process.exit(1);
  }
  if (claimed.has(next)) { // unreachable when usesClaims, kept as a belt-and-braces check
    console.error(`ERROR: ${prefix}${next} is claimed by another writer.`);
    process.exit(1);
  }
}

// ---- heading style: follow what the file already uses ----
// "### Decision N —" is what templates/BUILDER-DECISIONS-REVIEW.md ships; "## D<n> —" is the kit's own convention.
const level3 = decisions.filter((d) => d.level === 3).length;
const level2 = decisions.filter((d) => d.level === 2).length;
const templateStyle = SIDE === 'builder' && (level3 > level2 || (level3 === 0 && level2 === 0));
const today = dateArg || new Date().toISOString().slice(0, 10);

let newSection;
if (SIDE === 'builder' && templateStyle) {
  newSection = `
### Decision ${next} — ${title}

**Date:** ${today}
**Status:** accepted
**Cross-references:** ${crossRefs || '—'}

**What changed.** ${context}

**Why.** ${decision}

**Alternatives considered.**
- ${alternatives.split(';').map((s) => s.trim()).join('\n- ')}

**Impact on downstream.** ${consequences.split(';').map((s) => s.trim()).join('; ')}

`;
} else if (SIDE === 'builder') {
  newSection = `
## ${prefix}${next} — ${title}

**Date:** ${today}
**Status:** ✅ accepted
**Decided by:** <name>
**Cross-references:** ${crossRefs || '—'}

**Context.** ${context}

**Decision.** ${decision}

**Alternatives considered.**
- ${alternatives.split(';').join('\n- ')}

**Consequences.**
- ${consequences.split(';').join('\n- ')}

**How to verify.** <see test, run command, or read section>

`;
} else {
  newSection = `
## ${prefix}${next} — ${title}

**Date:** ${today}
**Reviewer:** <name>
**Subject:** <PR / milestone / spec amendment>
**Status:** ✅ approved

**Context.** ${context}

**Evidence reviewed.**
- ${(argValue('evidence') || '(no evidence)').split(';').join('\n- ')}

**Decision.** ${decision}

**Conditions (if any).** <list or "None">

`;
}

// Append only: never rewrite the file, so two near-simultaneous writers cannot lose each other's text.
appendFileSync(filePath, (existing.endsWith('\n') ? '' : '\n') + newSection, 'utf8');

const after = parseDecisions(readFileSync(filePath, 'utf8')).filter((d) => d.prefix === prefix && d.num === next);
if (after.length > 1) {
  console.error(`ERROR: ${prefix}${next} now appears ${after.length} times in ${filename}: another writer used the same number.`);
  console.error('       Renumber one of them by hand (numbers are stable references: keep the earlier one) and use `session.mjs claim` next time.');
  process.exit(1);
}

console.log(`✅ Appended ${prefix}${next} to ${filename}`);
console.log(`   Title: ${title}`);
console.log(`   Date: ${today}`);
