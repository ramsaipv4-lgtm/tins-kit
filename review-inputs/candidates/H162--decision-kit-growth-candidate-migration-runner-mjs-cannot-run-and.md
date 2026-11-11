---
id: decision-kit-growth-candidate-migration-runner-mjs-cannot-run-and
solves: Kit-growth candidate: `migration-runner.mjs` cannot run, and cannot apply to this project
triggers: Kit-growth candidate: `migration-runner.mjs` cannot run, and cannot apply to this project
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Kit-growth candidate: `migration-runner.mjs` cannot run, and cannot apply to this project

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 92 — Kit-growth candidate: `migration-runner.mjs` cannot run, and cannot apply to this project

**What changed.** Nothing in `tins-kit/` — the kit is read-only for consumers (its
`docs/LIBRARY-CONVENTIONS.md` §10). Recorded here as a candidate for
`tins-kit/prompts/KITTING.md` to triage at the kit machine.

**Why.** Two defects found while trying to use it to apply the Phase B migrations:
1. It calls `require('node:crypto')` inside an `.mjs` module (`lines 70–75`), which throws
   `require is not defined` before it applies anything. In ESM the import has to be static or via
   `createRequire`.
2. It is not usable against a project whose earlier migrations were applied by hand: it tracks state
   in its own `migrations_applied` table, so on this project it would attempt **all 46** files rather
   than the 10 pending. A runner whose ledger can only be populated by the runner itself is
   unusable for adoption, which is the normal case — every project starts without the ledger.

**What this cost.** Nothing was broken, but a tested security fix (`0046`) has sat unapplied partly
because there is no working apply path at all (no `DATABASE_URL` in this repo, no `psql`/`pg_dump`/
Supabase CLI/`pg`). That finding is recorded as CRITICAL in `REVIEWER-DECISIONS-REVIEW.md` Finding 7;
the apply order and the two possible paths are in `docs/BACKEND-PHASE-B-STATUS.md` §9.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 92 — Kit-growth candidate: `migration-runner.mjs` cannot run, and cannot apply to this project
