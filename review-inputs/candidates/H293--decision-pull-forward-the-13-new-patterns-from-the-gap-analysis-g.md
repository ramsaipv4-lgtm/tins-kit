---
id: decision-pull-forward-the-13-new-patterns-from-the-gap-analysis-g
solves: Pull forward the 13 new patterns from the gap analysis (G01–G13)
triggers: Pull forward the 13 new patterns from the gap analysis (G01–G13)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Pull forward the 13 new patterns from the gap analysis (G01–G13)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D10 — Pull forward the 13 new patterns from the gap analysis (G01–G13)

**What changed.** Wrote 13 new `lib/patterns/<name>.md` files, all bundling 2+ lessons from 2+ reference projects, with the 4-section structure (D19) and the canonical footer:
- `two-prisma-clients.md` (G01) — multi-tenant Postgres isolation via two Prisma clients + `withTenantTx` + `app.current_tenant`. Source: atal-incubation.
- `cross-tenant-404.md` (G02) — return 404, never 403, when a resource exists in another tenant. Source: atal-incubation HANDOVER §9.
- `outbox-job-queue.md` (G03) — decouple email/webhook/cron from request handling. Source: atal-incubation NotificationOutbox + JobQueue + CronLog.
- `append-only-audit-log.md` (G04) — every mutation writes via a SECURITY DEFINER trigger; no UPDATE/DELETE policy. Source: atal-incubation + Jayshankar.
- `multi-tenant-rls.md` (G05) — architect's-eye view of tenant RLS (companion to `two-prisma-clients.md`).
- `fifo-cascade-algorithm.md` (G06) — numbered procedure + JS fixture + selftest for FIFO algorithms. Source: Jayshankar + atal-incubation.
- `shortfall-pattern.md` (G07) — never fail silently; return `{ result, shortfall, warnings }`. Source: Jayshankar + Data-cleaning-script.
- `idempotent-migrations.md` (G08) — 6 primitives every migration must use. Source: Jayshankar + atal-incubation.
- `pinned-deps.md` (G09) — exact versions in `package.json`, `.gitignore` for generated, manifest-in-lockstep. Source: atal-incubation + Data-cleaning-script.
- `observability-first.md` (G10) — liveness/readiness split + 5 must-have alerts + 5 runbooks + per-tenant metric labels. Source: atal-incubation.
- `env-vs-config.md` (G11) — 3 env files, compose vs. app env, build-time vs. runtime. Source: atal-incubation + Data-cleaning-script.
- `prisma-extensions-rls.md` (G12) — the `$extends` + AsyncLocalStorage recipe. Source: atal-incubation.
- `versioned-spec-amendment.md` (G13) — merge-ready amendment file convention. Source: Jayshankar SPEC-AMENDMENT-v2.md + atal-incubation SPEC-v3 supersedes AICL_updated.md.

**Why.** The 5 reference projects (exam-forge, Jayshankar, atal-incubation, Data-cleaning-script, package5) crystallised 60 patterns that recur in 2+ projects but were not in the kit. The gap analysis (`docs/GAP-ANALYSIS.md`) is the live record. This is the evergrowing loop (D17) in action.

**Impact on downstream.** Any TINS consumer can `cp -r lib/patterns/<name>.md src/lib/patterns/` and follow the recipe. The kit's `scripts/kit-coverage.mjs` automatically recommends which patterns apply to a given consumer's SPEC.md.

**Cross-references:** SPEC.md §0.4 (13 new rows), §0.2 D17–D19 (the decisions), §2.3 (the patterns section), §4.1 (the directory tree), §8.13 (the acceptance criteria), docs/GAP-ANALYSIS.md (the source).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D10 — Pull forward the 13 new patterns from the gap analysis (G01–G13)
