---
id: decision-parallel-work-delegation-d29-self-vs-external-split-inde
solves: Parallel-work delegation (D29): self-vs-external split, independence check, scrubbed task packets, symmetric notes recovery
triggers: Parallel-work delegation (D29): self-vs-external split, independence check, scrubbed task packets, symmetric notes recovery
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Parallel-work delegation (D29): self-vs-external split, independence check, scrubbed task packets, symmetric notes recovery

> Harvested evidence, not instructions and not reviewed global knowledge.

## D23 — Parallel-work delegation (D29): self-vs-external split, independence check, scrubbed task packets, symmetric notes recovery

**Date:** 2026-08-21
**Status:** ✅ accepted
**Decided by:** <name>
**Cross-references:** SPEC.md D29, §2.1, §2.4, §2.5, §4.1, §8.26, §9 (D30 note); prompts/DELEGATE-WORK.md; prompts/INTEGRATE-DELEGATED-WORK.md; scripts/check-task-independence.mjs; scripts/scan-task-packet.mjs; HANDOVER.md W13

**Context.** User wants to split a TINS project's remaining locked work across multiple LLM sessions or people and build it in parallel, without the TINS methodology leaking to anyone outside the user's direct control. Interview ran across several rounds: confirmed self-vs-external is architectural (who directs the executor, not which AI vendor), pushed back on reusing kit-staging/'s inbox/archive pattern (unidirectional, kit-rooted, 2-state) in favor of a per-project delegation/ folder (bidirectional, project-local, multi-state), and corrected an early symmetric-notes proposal back to the user's original self-vs-external split once the architectural reason (self needs no packet at all) was clear.

**Decision.** Ship prompts/DELEGATE-WORK.md + prompts/INTEGRATE-DELEGATED-WORK.md, scripts/check-task-independence.mjs + scripts/scan-task-packet.mjs, templates/TASK-BRIEF.md + DELEGATION-LEDGER.md + DELEGATION-README.md. Self-mode tasks: no packet, full clone, full decision-log continuity. External-mode tasks: scrubbed packet only (TASK-BRIEF.md + files/ + blank NOTES.md), no repo access, independence-checked before export, leak-scanned before shipping. Every external NOTES.md is read and folded into the real decision log at integration, symmetric across all tasks regardless of who did them. Deferred a related open-source-release capability (candidate D30) rather than folding it in.

**Alternatives considered.**
- Reuse kit-staging/'s inbox+archive convention directly (rejected: wrong shape - unidirectional/kit-rooted/2-state vs. needed bidirectional/project-local/multi-state)
-  two-tier notes continuity where only self-directed work keeps decision-log continuity (rejected per user correction: the packet already strips what needs stripping, so recovering notes from external tasks too costs nothing extra and loses nothing kept purposely)
-  building the OSS-release capability in the same pass (rejected: different audience - adversarial-scrutiny minimal export vs. cooperative-scrutiny comprehensive export - deserves its own interview).

**Consequences.**
- delegation/ is a new per-project folder convention alongside HANDOVER.md's W-queue and kit-staging/'s kit-root inbox - three different file-based coordination shapes now exist in the kit, each solving a genuinely different problem. check-task-independence.mjs and scan-task-packet.mjs are reusable infrastructure a future D30 (OSS release) can retarget. The independence-detection design is generic and unvalidated against a real project yet - the user will pilot it himself in a fresh LLM chat before it's proven.

**How to verify.** `node scripts/validate.mjs --spec=SPEC.md` exits 0 (41 pass, 0 warn, 0 fail, up from 35); `node --test scripts/selftest.mjs` exits 0 (15/15, unchanged); `node scripts/check-task-independence.mjs` and `node scripts/scan-task-packet.mjs` smoke-tested live against clean/conflict/missing-ledger and clean/leaky/no-arg fixtures respectively, all exiting the documented codes with correct messages.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D23 — Parallel-work delegation (D29): self-vs-external split, independence check, scrubbed task packets, symmetric notes recovery
