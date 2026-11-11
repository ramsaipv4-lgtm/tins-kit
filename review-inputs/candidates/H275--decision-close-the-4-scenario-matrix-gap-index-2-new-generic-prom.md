---
id: decision-close-the-4-scenario-matrix-gap-index-2-new-generic-prom
solves: Close the 4-scenario matrix gap: INDEX + 2 new generic prompts (D27 realised)
triggers: Close the 4-scenario matrix gap: INDEX + 2 new generic prompts (D27 realised)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Close the 4-scenario matrix gap: INDEX + 2 new generic prompts (D27 realised)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D20 — Close the 4-scenario matrix gap: INDEX + 2 new generic prompts (D27 realised)

**What changed.** Session 11 (2026-08-15) shipped the entry point + the
remaining 2 scenarios that the prior sessions didn't cover.

The user pointed out (rightly) that the kit had 2 generic prompts
(NEW-PROJECT for Scenario 1, KIT-GROWTH-SESSION for Scenario 4) but
was missing Scenarios 2 and 3, plus an INDEX so a fresh LLM could
"selectively choose which skill to take ... not reinvent the wheel."

- **`INDEX.md`** (~13.3 KB, the 1-page selective-chooser): 8 sections
  covering all 65+ kit assets with 1-line briefs each:
  1. **Patterns (21)**: when to use each architect recipe.
  2. **Lib code modules (7)**: when to use each drop-in code module.
  3. **Prompts (12)**: when to use each paste-into-session prompt,
     including a "The 4 generic prompts (the user-facing flow)"
     cross-reference that maps each prompt to its scenario.
  4. **Templates (12)**: when to use each TINS doc template.
  5. **Scripts (14)**: when to use each zero-dep Node ESM script.
  6. **Schemas (4)**: what each JSON Schema validates.
  7. **Docs (4)**: what each top-level doc covers.
  8. **Top-level files (8)**: INDEX, PIPELINE, VERSIONING, SPEC,
     HANDOVER, AGENTS, BUILDER-DECISIONS-REVIEW, kit-staging/README.

  Plus a "How to read the kit in 30 minutes" fast path, a "How to
  add a new asset to the kit" maintenance path, and a "When this
  file is wrong" rule (the INDEX is the source of truth for
  "what's in the kit"; if an asset is missing, the file is wrong).

- **`prompts/PROMOTE-TO-TINS.md`** (~10.6 KB, Scenario 2): the 7-step
  retro-fit workflow for taking an existing project (built WITHOUT
  the kit) and turning it into a TINS project. The 7 steps are
  confirm location → read the kit shell → read the existing project →
  interview the user (4 retro-fit questions) → draft SPEC.md
  (describing what IS) → run kit-coverage → create the kit's
  standard handover docs + extract decisions to BUILDER-DECISIONS-REVIEW
  → mine learnings + ship via kit-staging-export. The 4 retro-fit
  questions are different from the 7 greenfield questions because
  you're not asking "what do you want to build?" — you're asking
  "what does this project ALREADY do, and what kit value do you want
  to extract from it?"

- **`prompts/CONTINUE-TINS-PROJECT.md`** (~7.9 KB, Scenario 3): the
  6-step pickup workflow for picking up an existing TINS project
  and adding a new W. The 6 steps are confirm location → read
  the project shell → pick the right W (or run coverage) → interview
  the user (5 W questions) → spec first + code second + record decisions
  → mine learnings + leave the gate green. The 5 W questions are:
  what is the W? what's the user's pain? what does "done" look like?
  are there constraints? is this kit-worthy?

- **Validator §8.24** (3 new checks): `INDEX.md` is present and
  non-trivial, `PROMOTE-TO-TINS.md` is present and non-trivial,
  `CONTINUE-TINS-PROJECT.md` is present and non-trivial. The
  expectedPrompts list extended from 8 to 12 (4 generic + 8 other).
  The order array extended with the 3 new §8.24 IDs.

**Why.** The user pointed out (rightly) that:
1. A fresh LLM at a new project root, with only the kit vendored,
   has to "ls + cat" every file to know what's available. That's
   30+ minutes of exploration per session. With INDEX.md, the LLM
   can see the whole menu in 3 minutes and selectively pick.
2. The kit had 2 generic prompts but the user-facing flow has 4
   scenarios. Scenarios 2 and 3 (existing non-TINS project, existing
   TINS project) were unaddressed.
3. The user's stated constraint: "selectively choose which skill
   to take ... not reinvent the wheel" — the INDEX is the wheel
   catalogue, the 4 prompts are the workflows.

**Impact on downstream.** The kit now has complete scenario coverage.
Every consumer LLM session can pick one of 4 prompts based on which
scenario it's in:
- New project from scratch → NEW-PROJECT
- Existing non-TINS project → PROMOTE-TO-TINS
- Existing TINS project → CONTINUE-TINS-PROJECT
- At the kit root, triaging the inbox → KIT-GROWTH-SESSION

The INDEX is the entry point: a fresh LLM reads INDEX first (3 min),
picks a prompt, runs it, and gets to work in 30 min instead of 60+.

**Cross-references:** SPEC.md §0.2 D27 (the 4-scenario matrix
decision, locked this session), §8.24 (3 new acceptance criteria:
§8.24a INDEX, §8.24b PROMOTE-TO-TINS, §8.24c CONTINUE-TINS-PROJECT),
`INDEX.md` (the selective-chooser, 8 sections), `prompts/PROMOTE-TO-TINS.md`
(Scenario 2, 7-step retro-fit), `prompts/CONTINUE-TINS-PROJECT.md`
(Scenario 3, 6-step pickup), `prompts/NEW-PROJECT.md` (Scenario 1,
already existed), `prompts/KIT-GROWTH-SESSION.md` (Scenario 4, already
existed), `scripts/validate.mjs` (3 new checks + extended expectedPrompts
list), `PIPELINE.md` (the 4 prompts are referenced in "Beyond the 7
steps"), `VERSIONING.md` (the 4 prompts are part of the staging
transport's version control).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D20 — Close the 4-scenario matrix gap: INDEX + 2 new generic prompts (D27 realised)
