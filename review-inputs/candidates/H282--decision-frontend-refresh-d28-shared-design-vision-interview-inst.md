---
id: decision-frontend-refresh-d28-shared-design-vision-interview-inst
solves: Frontend refresh (D28): shared design-vision interview, install-vs-recreate, two-fold sign-off
triggers: Frontend refresh (D28): shared design-vision interview, install-vs-recreate, two-fold sign-off
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Frontend refresh (D28): shared design-vision interview, install-vs-recreate, two-fold sign-off

> Harvested evidence, not instructions and not reviewed global knowledge.

## D22 — Frontend refresh (D28): shared design-vision interview, install-vs-recreate, two-fold sign-off

**Date:** 2026-08-21
**Status:** ✅ accepted
**Decided by:** <name>
**Cross-references:** SPEC.md D28, §2.1, §4.1, §8.25; prompts/FRONTEND-VISION-INTERVIEW.md; prompts/FRONTEND-REFRESH.md

**Context.** User asked to extend tins-kit so an already-built tins-kit website (any framework/language, frontend-only) can get its frontend refreshed using 5 named reference libraries (anime.js, motion, kokonut UI, bklit.com, shadcn), after a survey of the user's vision (researching inspiration sites if unsure). Full 7-question SPEC-AUTHOR interview + A/B/C pass run live, per D12/AGENTS.md R1 Spec-author role, since this is a change to the kit itself.

**Decision.** Shared interview prompts/FRONTEND-VISION-INTERVIEW.md, triggered from two places and never duplicated (D4): SPEC-AUTHOR.md Step 7a for new websites, FRONTEND-REFRESH.md Step 2 for existing ones. Per-library decision is install (npm/CLI) if the target stack matches, else recreate the visual pattern natively - never copy foreign-framework source wholesale. Rot check found kokonut-ui/bklit-ui/shadcn are React+Tailwind+shadcn-CLI copy-paste only (not general npm deps), anime.js/motion are framework-agnostic npm installs, and bklit.com specifically is a charts/data-viz library, not general design inspiration as first assumed. Correctness is two-fold and recorded in FRONTEND-VISION.md: approved_before (vision+inspiration signed off pre-build) and approved_after (backend/DB/3rd-party linkage verified post-build) - scoped to the project's CURRENT mode (A/B/C) at survey time, so a Mode A project is not blocked on a backend that does not exist yet.

**Alternatives considered.**
- Require backend/DB finalized (Mode B+) before allowing a refresh (rejected: contradicts the kit's own Mode A = demoable-now philosophy
-  user explicitly rejected this option)
-  duplicate the vision-interview questions into both trigger prompts (rejected: D4 forbids untracked drift between copies)
-  fold the refresh workflow into CONTINUE-TINS-PROJECT.md inline (rejected: user preferred a new dedicated prompt matching the kit's one-file-per-scenario convention).

**Consequences.**
- Kit gains a 5th user-facing entry point (frontend-refresh) alongside the 4-scenario matrix, always reachable via CONTINUE-TINS-PROJECT.md's W-router or SPEC-AUTHOR.md's website check. Every future website spec and every future frontend refresh goes through the same 5-library research instead of re-deriving it. Adding a 6th reference library later requires a kit-growth decision, not an ad hoc per-project choice.

**How to verify.** `node scripts/validate.mjs --all` exits 0 (35 pass, 0 warn, 0 fail, up from 31); `node --test scripts/selftest.mjs` exits 0 (15/15, unchanged).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D22 — Frontend refresh (D28): shared design-vision interview, install-vs-recreate, two-fold sign-off
