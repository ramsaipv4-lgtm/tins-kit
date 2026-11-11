---
id: decision-pull-forward-the-6-new-prompts-g14-g19
solves: Pull forward the 6 new prompts (G14–G19)
triggers: Pull forward the 6 new prompts (G14–G19)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Pull forward the 6 new prompts (G14–G19)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D11 — Pull forward the 6 new prompts (G14–G19)

**What changed.** Wrote 6 new `prompts/<name>.md` files, all complete paste-into-fresh-session prompts (D4):
- `BUILDER-REVIEW-TEMPLATE.md` (G14) — the consumer's `BUILDER-DECISIONS-REVIEW.md` template, with worked example D1.
- `REVIEWER-REVIEW-TEMPLATE.md` (G15) — the consumer's `REVIEWER-DECISIONS-REVIEW.md` template, with worked example R1.
- `INTERVIEW-CHECKLIST.md` (G16) — the one-page reference for `SPEC-AUTHOR.md`'s 7 questions + A/B/C pass + §0.3 "what I guessed".
- `SPEC-REVIEWER.md` (G17) — the prompt a separate reviewer session runs against a frozen-for-v1 SPEC.md (6 review passes).
- `KITTING.md` (G18) — the machine-facing workflow for adding a new pattern to the kit (9 steps).
- `RELEASE-CHECKLIST.md` (G19) — the pre-deploy gate (8 sections: typecheck/build/test, smoke test, 5-min soak, private-to-public, docs, security, observability, backout).

**Why.** The kit's SPEC §2.1 promised these prompts but they weren't shipped. The gap analysis identified the gap; this decision closes it.

**Impact on downstream.** Every TINS consumer gets a complete prompt library. The `SPEC-REVIEWER` prompt is the discipline that prevents "writer's bias" (a separate session reviews the spec).

**Cross-references:** SPEC.md §0.2 D4 (paste-into-session format), §2.1 (the prompts layer), §8.7 + §8.15 (the acceptance criteria), docs/WORKFLOW.md (where the prompts fit in the consumer flow).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D11 — Pull forward the 6 new prompts (G14–G19)
