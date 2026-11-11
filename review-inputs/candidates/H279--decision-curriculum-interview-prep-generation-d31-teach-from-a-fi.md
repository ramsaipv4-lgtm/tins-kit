---
id: decision-curriculum-interview-prep-generation-d31-teach-from-a-fi
solves: Curriculum / interview-prep generation (D31): teach from a finished project's real history
triggers: Curriculum / interview-prep generation (D31): teach from a finished project's real history
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Curriculum / interview-prep generation (D31): teach from a finished project's real history

> Harvested evidence, not instructions and not reviewed global knowledge.

## D25 — Curriculum / interview-prep generation (D31): teach from a finished project's real history

**Date:** 2026-08-21
**Status:** ✅ accepted
**Decided by:** <name>
**Cross-references:** —

**Context.** D30 closed with a deferred candidate: repurposing a finished project's documentation into full teaching/interview-prep material. The user asked to finish it this session ("lets finish d31"). Interview ran across three AskUserQuestion rounds plus prose discussion: Round 1 confirmed all three heavy content pieces in v1 (real-bug debugging case studies, scenario questions from real requirements, first-principles reimplementation drills) at maximum breadth, including the full ambitious reimplementation-drills version over a deferred/scoped-down option. The user then raised two design questions unprompted: wanting the LLM to reply in parts so the output context window is not hit and each turn can be maximally descriptive, and asking whether curriculum generation needs the same (expensive) model the original builder used or a cheaper one, specifically flagging that first-principles reimplementation drills might need a smarter model because that task is monumental in itself.

**Decision.** Ship two new fresh-session prompts, prompts/GENERATE-CURRICULUM.md and prompts/GENERATE-INTERVIEW-PREP.md, plus templates/CURRICULUM-PROGRESS.md, with no new script — both reuse scripts/private-to-public.mjs --scan-only as-is for the safety gate. Both generate output strictly ONE FILE PER TURN into a sibling <project>-curriculum/ folder (never inside the private working copy or the D30 public repo), tracked via a CURRICULUM-PROGRESS.md manifest so an interrupted run resumes instead of restarting. The model/context question resolved via the kit's own D4 fresh-session discipline: a prompt should work from real project artifacts (SPEC.md, BUILDER-DECISIONS-REVIEW.md, HANDOVER.md, code), never from the original builder session's memory; GENERATE-INTERVIEW-PREP.md additionally and explicitly recommends running it on a frontier model at extended/max thinking, reusing check-task-independence.mjs (D29) as the kit's existing precedent for that exact recommendation. GENERATE-CURRICULUM.md is written in direct second-person instructional voice, deliberately distinct from PUBLISH-OPEN-SOURCE.md's corporate voice, since the two serve different audiences (someone evaluating the software vs. someone learning from it). CONTINUE-TINS-PROJECT.md gained a 4th specialized-W routing paragraph.

**Alternatives considered.**
- (1) Route curriculum generation through the same session/model that built the project, for continuity — rejected because it breaks the kit's fresh-session discipline (D4) and does not scale to a curriculum generated long after the original build session ended. (2) Compress all curriculum files into a single large response — rejected per the user's own stated concern about hitting the output context window and wanting maximal per-file descriptiveness
-  the manifest-first, one-file-per-turn design was chosen instead. (3) Write a new scanner/banned-terms list specific to curriculum content — rejected because the curriculum's own process-teaching content must already avoid the same two fingerprint categories (methodology, LLM-authorship) D30's scanner blocks
-  a second list would duplicate that coverage for no benefit. (4) Build the curriculum inside D30's public repo — rejected because the corporate product voice and the instructional teaching voice are incompatible in one folder
-  a sibling folder was chosen instead. (5) Defer the full ambitious reimplementation-drills scope again — offered to the user as the Recommended option but explicitly declined in favor of building it now.

**Consequences.**
- Two new prompts (~15KB and ~17KB) and one new template ship
-  no new script, keeping D31 a pure-prompt addition per the D28/D29 precedent, so no new scripts/selftest.mjs cases were added (the validator's presence/content checks cover it). scripts/validate.mjs gained 5 new §8.28a-e checks
-  SPEC.md gained §0.2 D31 and §8.28
-  INDEX.md and HANDOVER.md updated to match. A real curriculum run against a finished project (not yet attempted) will be the first test of whether a fresh session, working only from real artifacts, produces teaching material as good as the design intends -- if it falls short, that is a signal to improve the project's own decision-log discipline upstream, not a reason to route around fresh-session sourcing.

**How to verify.** `node scripts/validate.mjs --spec=SPEC.md` exits 0 (52 pass, 0 warn, 0 fail, up from 47 — the 5 new §8.28a-e checks); `node scripts/validate.mjs --kit` exits 0 (42 pass, 0 warn, 0 fail, up from 37); `node --test scripts/selftest.mjs` exits 0 (19/19, unchanged from D30 — no new cases added, per the D28/D29 precedent that a pure-prompt addition with no new script can rely on the validator's presence/content checks); `cat prompts/GENERATE-CURRICULUM.md` and `cat prompts/GENERATE-INTERVIEW-PREP.md` show both explicitly instruct one-file-per-turn generation and reference `scripts/private-to-public.mjs --scan-only` as the safety gate, and `GENERATE-INTERVIEW-PREP.md` explicitly recommends a frontier model at extended/max thinking; `cat prompts/CONTINUE-TINS-PROJECT.md` shows the new routing paragraph for teaching-material W's.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D25 — Curriculum / interview-prep generation (D31): teach from a finished project's real history
