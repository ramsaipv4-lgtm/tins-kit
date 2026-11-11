---
id: decision-close-the-auto-extraction-half-of-the-bidirectional-loop
solves: Close the auto-extraction half of the bidirectional loop (D17 fully realised)
triggers: Close the auto-extraction half of the bidirectional loop (D17 fully realised)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Close the auto-extraction half of the bidirectional loop (D17 fully realised)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D17 — Close the auto-extraction half of the bidirectional loop (D17 fully realised)

**What changed.** Session 6 had established D17 ("the kit is evergrowing, not
exhaustive") and shipped the *manual* KITTING workflow (`prompts/KITTING.md` +
`scripts/kit-new-pattern.mjs`). But the *extraction* half was missing: a consumer
that crystallised a new pattern had to have a human (or LLM) read its
BUILDER-DECISIONS-REVIEW and decide which decisions were kit-worthy. Session 8
shipped:

- **`scripts/kit-extract.mjs`** (~13 KB): the heuristic classifier. Reads a
  consumer's `BUILDER-DECISIONS-REVIEW.md` + `lib/patterns/` + `lib/`, scores
  each decision 0-7 (title keywords +2, body substance +1 each, lesson/anti-pattern
  keywords +1, worked example +2, project-specific penalty -3, deferred/rejected
  penalty -2, novel bonus +1), and produces a `kit-growth-candidates.md` report
  with the triage template. Exits 0 if no candidates, 1 if there are — so a CI
  step can trigger the kit-growth session.
- **`prompts/KITTING-REVIEW.md`** (~6 KB): the triage prompt a fresh LLM
  session runs. 3-question rubric (generalises? worked example? duplicates
  existing pattern?), accept/reject/defer per candidate, then for each accepted
  one runs the KITTING workflow.
- **`lib/patterns/kit-self-application.md`** (~9 KB): the canonical pattern for
  the loop end-to-end. Documents the 2-consumer rule, the heuristic
  classifier, and the 3 known anti-patterns (in-place editing of the kit,
  skipping the decision log, auto-extracting from 1 consumer).
- **`docs/WORKFLOW.md`**: updated with the full bidirectional loop end-to-end
  (Kit → Consumer → Kit), with the worked example being the kit's own growth
  across sessions 1, 6, 7, 8.

**Why.** The user pointed out (rightly) that the kit had a one-way loop: it
could scaffold a new consumer, but the consumer's learnings had no automated
path back to the kit. Without the auto-extraction, the kit would stay frozen
at the patterns from session 6; the third consumer would repeat the same
mistakes the first two had already made and documented. With the auto-extraction,
the kit grows by 5-10 patterns per consumer session, and the third consumer
is dramatically better-served than the first.

**Impact on downstream.** The kit's loop is now closed. The next consumer that
finishes Mode A + records its decisions will trigger `kit-extract.mjs` (the
exits-1 design means CI can flag "growth candidates available") and the
kit-growth session will triage the report. The kit's pattern count will grow
organically as more consumers adopt it.

**Cross-references:** SPEC.md §0.2 D17 (now fully realised), §2.1 (the
prompts layer, KITTING-REVIEW.md added), §2.4 (the scripts layer,
kit-extract.mjs added), §2.3 (the lib patterns, kit-self-application.md
added), §4.3 (the consume-the-kit flow), HANDOVER.md §5 (this is session 8's
deliverable), docs/WORKFLOW.md (the full loop documented).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D17 — Close the auto-extraction half of the bidirectional loop (D17 fully realised)
