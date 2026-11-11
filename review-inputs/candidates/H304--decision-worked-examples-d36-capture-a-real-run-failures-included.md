---
id: decision-worked-examples-d36-capture-a-real-run-failures-included
solves: Worked examples (D36): capture a real run, failures included
triggers: Worked examples (D36): capture a real run, failures included
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Worked examples (D36): capture a real run, failures included

> Harvested evidence, not instructions and not reviewed global knowledge.

## D30 — Worked examples (D36): capture a real run, failures included

**What changed.** Added `examples/autonomous-todo-app/` — a complete D32 auditor + worker run that built a zero-dependency todo app from a locked spec: the verbatim worker prompts, each worker's returned report, all four decision logs, the run digest, the run's real state files, and the finished code. Added D36 + §8.33a–e to `SPEC.md`, five validator checks, and an `examples/` exclusion in `kit-sync.mjs`.

**Why run it rather than write it.** `HANDOVER.md` had carried the same caveat since D32 shipped: *"D32's design rests on assumptions about how worker sessions behave that only a real unattended run can check."* A hand-written example would have restated the design, not tested it. The run found three kit defects, one contradiction in the spec it was building, and one worker misdiagnosis another worker corrected. A clean result would have been evidence the exercise was too easy.

**Why an example must document its failures.** The validator enforces this (§8.33c) rather than trusting the author. An example that only shows the happy path teaches a workflow nobody will recognise when they run it — the first time a real ledger breaks a parser or a worker misdiagnoses a gate, a reader whose only reference was a clean transcript concludes they are doing it wrong. Showing the parse bug, the misdiagnosis, and the parked ending is the useful part.

**Why the parked ending was preserved rather than resolved.** It would have taken one line each to amend the spec and turn exit 3 into exit 0. That would have been a worse example and a false one: the whole point of the tier system is that a spec amendment is a human's call, and an auditor that quietly made both calls to produce a tidy result would have demonstrated the failure mode instead of the mechanism.

**Why the planted ambiguity is reported as not firing.** The spec deliberately left the §2.5-vs-§3-rule-1 tension unsettled to exercise the escalation path. It did not fire — T2 resolved it at T1 with sound reasoning and said explicitly why it had considered T2 and declined. Two *unplanted* defects triggered the escalations instead. Reporting that honestly is more informative than quietly re-rigging the spec until the intended path fired.

**Why examples are not synced to consumers.** One example is ~440 KB of transcript. It is reference material for a person reading the kit; a consumer project inherits no value from it. `kit-sync.mjs` now skips it, and §8.33e pins that — D36 asserting it in prose while the code did the opposite was the third defect this session found, and it was found by checking the code against the decision rather than by trusting the decision.

**Why no sync mechanism for stale examples.** A run that no longer matches the workflow gets re-run or deleted, never edited to look current. A patched transcript is a fabricated one, and the entire value of an example is that it happened.

**Impact on downstream.** D32 is no longer theoretical, and the three defects it exposed are fixed or recorded rather than waiting to surface in a user's first real run.

**Cross-references:** SPEC.md D36 + §8.33, examples/autonomous-todo-app/README.md, scripts/orchestrate.mjs, scripts/check-task-independence.mjs, scripts/kit-sync.mjs.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D30 — Worked examples (D36): capture a real run, failures included
