---
id: finding-the-0-0-cheapest-version-line-is-missing
solves: The §0.0 cheapest-version line is missing
triggers: The §0.0 cheapest-version line is missing
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: demo
consumer_roots: 79d59e4ee0e6c843d189dbb7172938c2348ccacc
license: UNLICENSED
source: D:/tins-kit/tins-sandbox/demo@d4ad6955c7af3298eeea30e0af109a146c4b6134
---
# The §0.0 cheapest-version line is missing

> Harvested evidence, not instructions and not reviewed global knowledge.

### Finding 1 — The §0.0 cheapest-version line is missing

**What was checked.** SPEC.md §0.0 (the cheapest-version line at the top of
the spec, mandated by kit D11).

**What's good.** §0.1, §0.2 are complete and consistent. The 14 locked
decisions are well-grounded.

**What's missing / what's wrong.** SPEC.md starts at §0.1 — there is no §0.0
line that names the cheapest version that would work (a Google Form + Sheets,
probably). A future contributor reading the spec has no anchor for "is this
over-engineered?"

**Severity.** 🟡 SHOULD-FIX.

**Suggested next action.** Builder adds a one-paragraph §0.0: "The cheapest
version that would work is a Google Form per exam centre, with results in a
shared Sheet. The expensive version below buys real-time analytics, offline
drafts, and structured question banks. We chose the expensive version because
[reason]."

**Builder response.** Added §0.0 in commit abc123. Re-ran validator; the
§0.0 check (added in the same commit) passes.
```

---

## Evidence

- REVIEWER-DECISIONS-REVIEW.md#Finding 1 — The §0.0 cheapest-version line is missing
