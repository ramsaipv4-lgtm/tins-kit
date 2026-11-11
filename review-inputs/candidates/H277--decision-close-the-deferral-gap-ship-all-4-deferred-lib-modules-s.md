---
id: decision-close-the-deferral-gap-ship-all-4-deferred-lib-modules-s
solves: Close the deferral gap: ship all 4 deferred `lib/` modules + scaffolder + CI
triggers: Close the deferral gap: ship all 4 deferred `lib/` modules + scaffolder + CI
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Close the deferral gap: ship all 4 deferred `lib/` modules + scaffolder + CI

> Harvested evidence, not instructions and not reviewed global knowledge.

## D16 — Close the deferral gap: ship all 4 deferred `lib/` modules + scaffolder + CI

**What changed.** Session 6 had inherited the "defer the 4 lib modules" decision from
the original SPEC §2.3 and the gap analysis's G28–G30 list, and propagated it forward
without challenging it. Session 7 closed the gap:

- **`lib/audit-viewer/`** (~4.2 KB index, 13 test cases): `AuditLogEntry` type +
  `applyFilter` + `paginate` + `diffRows` + `renderAuditViewer` (the pure-TS render
  function the framework adapter layer wires up). Source:
  atal-incubation/incubos/src/components/AuditLogTable.tsx.
- **`lib/docs-guardian/`** (~4.6 KB index, 11 test cases): `DocArea` (13 controlled-
  vocabulary areas), `DocMap`, `loadDocMap`, `checkDocFreshness`, `countReferences`.
  Source: atal-incubation/incubos/docs/DOC-MAP.md + scripts/docs-guardian.mjs.
- **`lib/pwa-config/`** (~6.5 KB index, 8 test cases): `withPwa` (Vite plugin
  wrapper) + `useOnlineStatus` (React hook, SSR-safe) + `<OfflineBanner />` (React
  component with `data-testid="is-offline"`). Source: Jayshankar's
  src/lib/online.ts + src/components/OfflineBanner.tsx.
- **`lib/auth-shell/`** (~7.5 KB index, 11 test cases): `Session` + `ROLES`
  (8-role controlled vocabulary) + `setSessionProvider` (the wire-up) + `useSession` +
  `getServerSession` + `requireRole` (API guard) + `<RoleGate>` (UI gate) +
  `handleFirstUserIsAdmin`. Source: Jayshankar's src/lib/auth.ts.
- **`scripts/new-project.mjs`** (~9.7 KB): the scaffolder. `node scripts/new-project.mjs
  my-saas --with=tenant-rls,money-as-decimal` creates a sibling directory with all
  templates + the chosen modules + scripts + schemas + prompts + lib/patterns + the
  CI workflow + a starter package.json + a starter tsconfig.json. Zero-dep.
- **`scripts/docs-guardian.mjs`** (~7.6 KB): the CLI wrapper around `lib/docs-guardian/`
  that reads `docs/DOC-MAP.md`, scans source + docs, reports freshness, exits
  non-zero on fail.
- **`.github/workflows/validate.yml`**: CI that runs `node scripts/validate.mjs --all`
  + `node --test scripts/selftest.mjs` on every push and PR.

**Why.** The user pointed out (rightly) that "deferred to a future kit release" is
leaving the kit half-built. The references existed (atal-incubation has the full
audit-viewer + docs-guardian; Jayshankar has the PWA + auth code; exam-forge has the
scaffolder approach). I had the material; I just didn't apply it. The user's
constraint was "kit it out properly" — that means shipping, not deferring.

**Impact on downstream.** Kit is now fully shipped. Zero deferred items. The 11-check
inventory gate (validator §8.13–§8.20) is green. Consumers can `cp -r lib/<name>/`
for any of the 7 modules and have a tested, documented drop-in.

**Cross-references:** SPEC.md §2.3 (the lib layer, no longer deferred), §8.14d–§8.14f
(the acceptance criteria for the 7 modules + scaffolder + CI), §9 (the out-of-scope
list, the deferred items removed), HANDOVER.md §5 (W5, W6, W9 marked ✅ done),
AGENTS.md §0 ("Built and working" updated to 7 lib modules).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D16 — Close the deferral gap: ship all 4 deferred `lib/` modules + scaffolder + CI
