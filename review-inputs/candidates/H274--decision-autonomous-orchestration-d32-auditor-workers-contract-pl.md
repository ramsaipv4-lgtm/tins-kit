---
id: decision-autonomous-orchestration-d32-auditor-workers-contract-pl
solves: Autonomous orchestration (D32): auditor + workers, contract plus reference runner, tiered escalation that parks rather than halts
triggers: Autonomous orchestration (D32): auditor + workers, contract plus reference runner, tiered escalation that parks rather than halts
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Autonomous orchestration (D32): auditor + workers, contract plus reference runner, tiered escalation that parks rather than halts

> Harvested evidence, not instructions and not reviewed global knowledge.

## D26 — Autonomous orchestration (D32): auditor + workers, contract plus reference runner, tiered escalation that parks rather than halts

**What changed.** Added `prompts/AUTONOMOUS-BUILD.md` (the auditor's contract — 9 steps from preconditions to run digest) and `prompts/WORKER-SESSION.md` (the worker's contract, dispatched by the auditor rather than pasted by the user), `scripts/orchestrate.mjs` (the reference runner: `--dry-run` / `--status` / dispatch, exit 0/1/2/3), `scripts/escalate.mjs` (files a tiered escalation, parks the task), `lib/patterns/tiered-escalation.md` (the rule), and `templates/ORCHESTRATION.json` + `templates/ESCALATIONS.md`. Wired routing into `CONTINUE-TINS-PROJECT.md` Step 2 and a handoff from `SPEC-AUTHOR.md`'s closing section. Extended `templates/DELEGATION-LEDGER.md` with the autonomous status vocabulary and an optional `Depends` column.

**Why contract-plus-runner rather than a single mechanism.** The kit has never picked a hosting target (D15) and should not pick a harness either. But "just plug an LLM in and it runs" needs something executable, not only prose. Splitting it settles both: `AUTONOMOUS-BUILD.md` is normative and `orchestrate.mjs` is one conforming implementation, so a harness with native subagent spawning skips the script while a harness without one still has a working runner. The user picked this shape over script-only and prompt-only.

**Why the state lives in files.** An auditor holding run state in its context cannot hand off, cannot resume after a crash, and cannot survive its own context window on a long run. Putting `LEDGER.md` / `ORCHESTRATION.json` / `ESCALATIONS.md` in the repo makes a fresh auditor a drop-in replacement — which is the only reason an unattended multi-hour run is safe to start at all.

**Why the auditor writes no product code.** This is D10's role separation applied inside a single run. A session that wrote the code will verify its own assumptions rather than the acceptance criteria. Once the auditor starts patching worker output "just this once", its verification stops meaning anything and the run has no reviewer. Failing tasks are therefore re-issued to a fresh worker up to `maxRetries`, never fixed in place.

**Why a T2 parks instead of halting.** Chosen live by the user over halting the whole run. One unanswered question idling every independent task is the same pathology as a build system serialising on one slow test. Exit code 3 keeps "parked, owed an answer" distinct from both success and failure, because a human reading the outcome needs to tell those apart.

**Why uncertainty resolves to T2 and not T1.** The cost asymmetry only runs one way. An unnecessary T2 costs one parked task and a question answered in a minute; a genuine uncertainty misfiled as T1 compounds unattended for hours with other tasks built on top of it. This is the rule most likely to get quietly softened as "efficiency", so it is stated in the pattern, in both prompts, and enforced by `escalate.mjs` refusing an underspecified T2.

**Why `escalate.mjs` rejects a T0.** Escalation queues that fill with narration get skimmed, and a skimmed queue is one where the real question gets a reflex answer. Making the script refuse a T0 outright turns `tiered-escalation.md` §2.1 from advice into a mechanism.

**Impact on downstream.** A consumer whose spec is locked and whose tooling gate is green can hand the remaining build to a fresh session and get back a built project, a digest of every T1 judgement, and a short queue of genuinely necessary questions.

**Cross-references:** SPEC.md D32 + §8.29, lib/patterns/tiered-escalation.md, prompts/AUTONOMOUS-BUILD.md, prompts/WORKER-SESSION.md, scripts/orchestrate.mjs, scripts/escalate.mjs.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D26 — Autonomous orchestration (D32): auditor + workers, contract plus reference runner, tiered escalation that parks rather than halts
