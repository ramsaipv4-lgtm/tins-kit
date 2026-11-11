---
id: decision-pull-forward-the-5-new-scripts-g31-g35
solves: Pull forward the 5 new scripts (G31–G35)
triggers: Pull forward the 5 new scripts (G31–G35)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Pull forward the 5 new scripts (G31–G35)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D14 — Pull forward the 5 new scripts (G31–G35)

**What changed.** Wrote 5 new `scripts/<name>.mjs` files, all zero-dep Node ESM (D3) except `migration-runner.mjs` (which uses `pg`):
- `migration-runner.mjs` (G31) — apply SQL migrations in order, idempotent, track in `migrations_applied` table. Supports `--dry-run`, `--check`, `--dir=<path>`. Source: Jayshankar supabase CLI + atal-incubation prisma migrate.
- `decision-log.mjs` (G32) — append a date-stamped decision to `BUILDER-DECISIONS-REVIEW.md` or `REVIEWER-DECISIONS-REVIEW.md`. Source: atal-incubation `scripts/decision-log.mjs` (already existed, promoted to first-class).
- `kit-coverage.mjs` (G33) — given a consumer's `SPEC.md`, print which `lib/patterns/` entries are likely to apply (keyword-based classifier). Source: new.
- `kit-listing.mjs` (G34) — list every pattern / prompt / schema / template / script / lib module / doc. Supports `--json` and `--kind=<name>`. Source: new.
- `kit-new-pattern.mjs` (G35) — scaffold a new `lib/patterns/<name>.md` from the canonical 4-section template. Source: new. Closes the evergrowing-project loop (D17).

**Why.** The SPEC §2.4 promised these scripts; the gap analysis identified the gap.

**Impact on downstream.** The `migration-runner.mjs` is the consumer's CI gate for SQL changes. The `decision-log.mjs` is the consumer's discipline for recording decisions. The `kit-coverage.mjs` + `kit-listing.mjs` + `kit-new-pattern.mjs` are the kit's self-maintenance tools.

**Cross-references:** SPEC.md §2.4 (the scripts layer), §8.17 (the acceptance criteria), docs/KITTING.md §5–6 (where kit-new-pattern.mjs fits).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D14 — Pull forward the 5 new scripts (G31–G35)
