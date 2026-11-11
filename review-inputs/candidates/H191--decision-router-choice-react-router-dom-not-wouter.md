---
id: decision-router-choice-react-router-dom-not-wouter
solves: Router choice: `react-router-dom` (not wouter)
triggers: Router choice: `react-router-dom` (not wouter)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Router choice: `react-router-dom` (not wouter)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 15 — Router choice: `react-router-dom` (not wouter)

**What changed.** SPEC §4.1 says "wouter (or `react-router-dom` with `HashRouter`)";
W2 picks `react-router-dom` 6.x.

**Why.** `react-router-dom` has more documentation, more Stack Overflow answers,
and is more familiar to the user (per their profile: Node.js/React basics). The
bundle size difference (~3 KB gzipped) is irrelevant for an internal B2B app.
`wouter` is smaller but the docs advantage of `react-router-dom` wins for a
2-3 hour build where the user is doing the verification.

**Trade-off accepted.** ~3 KB more in the bundle. We don't load wouter's docs
in our heads.

**Impact on downstream.** If the user later wants wouter, the migration is ~10
lines in `src/main.tsx` + `src/App.tsx`. The role-based routing logic is router-
agnostic; only the imports change.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 15 — Router choice: `react-router-dom` (not wouter)
