---
id: decision-pull-forward-the-3-lib-code-modules-g28-g30
solves: Pull forward the 3 lib code modules (G28–G30)
triggers: Pull forward the 3 lib code modules (G28–G30)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Pull forward the 3 lib code modules (G28–G30)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D13 — Pull forward the 3 lib code modules (G28–G30)

**What changed.** Wrote 3 new `lib/<name>/` modules, each with `index.ts` + `README.md` + `tests/<name>.test.ts` (D20):
- `lib/no-backend/` (G28) — `useLocalState` + `clearLocalState` + `isLocalStorageAvailable` + `LocalStateError`. 5 source files, 7 test cases. Source: exam-forge + Jayshankar.
- `lib/money-as-decimal/` (G29) — Zod schema + `fromString` / `toString` / `format` / `sum` / `subtract` / `multiply` / `divide` / `equals` / `gt` / `lt` + `ZERO`. 1 source file, 8 test cases including the load-bearing "0.1 + 0.2 === 0.3" test. Source: atal-incubation + Jayshankar.
- `lib/tenant-rls/` (G30) — `basePrisma` + `restrictedPrisma` + `getPrismaClient` + `withTenantTx` + `tenantTxStorage`. 1 source file, 3 test cases. Source: atal-incubation.

**Why.** The SPEC §2.3 promised the modules; the gap analysis identified the gap. The 4 deferred modules (audit-viewer, docs-guardian, pwa-config, auth-shell) are documented in SPEC §9.

**Impact on downstream.** Consumers `cp -r lib/<name>/ src/lib/<name>/` and have a tested, documented drop-in. The `tenant-rls` module is the most consequential: it ships the two-Prisma-clients + AsyncLocalStorage + `withTenantTx` primitive, the `TENANT_SCOPED` set, and the rules (no `basePrisma` outside the approved list, always wrap `restrictedPrisma` in `withTenantTx`, keep `TENANT_SCOPED` in sync).

**Cross-references:** SPEC.md §2.3 (the lib layer), §8.14 (the acceptance criteria), docs/LIBRARY-CONVENTIONS.md (the conventions).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D13 — Pull forward the 3 lib code modules (G28–G30)
