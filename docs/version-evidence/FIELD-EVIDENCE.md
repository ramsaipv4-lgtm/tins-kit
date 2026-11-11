# FIELD-EVIDENCE — what one real project showed

> **Source:** the `lms` project (SAI's LMS for technical training), Phase 1, built on kit
> **v2**. Phase 1 is a content-quality pipeline: measure whether a question bank actually
> measures anything. Round 1 (four parallel tasks) is merged; W5 and W6 are not started.
> **The project is incomplete. Treat everything here as evidence, not as a verdict.**
>
> **Confidence tiers used below**
> - **OBSERVED** — happened in the lms run; the record is in `evidence/lms/`.
> - **VERIFIED-IN-CODE** — checked against v3's actual code/prompts in this bundle, by grep or
>   by running it, on the date this bundle was built.
> - **INFERRED** — reasoning from the above. Weigh accordingly.

---

## 1. Summary

| # | Finding | Tier | Still true in v3? |
|---|---|---|---|
| F1 | The scaffolder silently skips the project brief | OBSERVED + VERIFIED-IN-CODE | **Yes — unfixed** |
| F2 | Four mandated steps were skipped; none had a mechanism | OBSERVED | **Partly fixed** — 1 of 4 |
| F3 | The A/B/C pass, Step A (measure the real data), was the highest-value step | OBSERVED | Unchanged — keep it |
| F4 | Parallel delegation round 1 worked as designed | OBSERVED | Unchanged in substance |
| F5 | The integrating session made a false negative from a timed-out search | OBSERVED + VERIFIED-IN-CODE | Not addressed — the gate runs tests, not claims |
| F6 | Nested git repos and a large tracked tree broke the git workflow | OBSERVED | No kit guidance in either version |
| F7 | Content-generation methodology now lives in three places | INFERRED | Unchanged |

---

## F1 — `kit-new-project-shell.mjs` silently skips the project brief

**OBSERVED** (lms `BUILDER-DECISIONS-REVIEW.md` D1). The scaffolder copies
`templates/AGENT-BRIEF.md`. The template is named `templates/PROJECT-AGENT-BRIEF.md`. The copy
loop does `if (!existsSync(srcPath)) continue;`, so the missing file produces **no error and
no warning**. The project started without the very file every prompt says to read first.

**VERIFIED-IN-CODE, v3:** still present. `new/tins-kit/scripts/kit-new-project-shell.mjs`
line 87 maps `['templates/AGENT-BRIEF.md', 'AGENT-BRIEF.md']`; line 94 is the silent
`continue`; `new/tins-kit/templates/` contains `PROJECT-AGENT-BRIEF.md` and no `AGENT-BRIEF.md`.
v1 has the identical bug (line 86). `INDEX.md` tells readers to open `AGENT-BRIEF.md`.

**Merge implication:** fix regardless of anything else — rename one side, and make a missing
source file **fail loudly**. A copy loop that skips silently will hide the next rename too.

## F2 — Four mandated steps were skipped, and nothing noticed

**OBSERVED** (lms `NEXT-STEPS.md` §5). The session building lms skipped all four. SAI had to
catch two of them himself.

| Step | Where the kit asks for it | What happened in lms | v3 status (VERIFIED-IN-CODE) |
|---|---|---|---|
| Fill in `HANDOVER.md` | project brief, step 7 | Left as the raw template — 8 placeholders — through the whole spec phase | **Not addressed.** No script checks a consumer's HANDOVER for template placeholders. Grep of v3 `scripts/` found none |
| Frontend vision interview (SPEC-AUTHOR Step 7a) | `SPEC-AUTHOR.md` | The session *recorded* that the gate fired, then continued past it. SAI caught it | **Not addressed.** Still a prose instruction in `SPEC-AUTHOR.md` |
| Offer parallel delegation | `CONTINUE-TINS-PROJECT.md` Step 2 | Never offered. SAI asked for it himself | **Addressed in v3.** `EXECUTION-MODE-INTERVIEW` is now wired into `SPEC-AUTHOR`, `NEW-PROJECT` Step 3a and `CONTINUE` Step 2, and `orchestrate.mjs` refuses to run a round in the wrong mode. The interview itself is still prose-triggered |
| Run `kit-extract.mjs` | `NEW-PROJECT.md` Step 6 | Never run. The project has contributed nothing back to the kit | **Not addressed.** Still the last step of a long prompt |

**The pattern.** Every one of these prompts is good. None of them fires on its own. The
lms project's whole subject was a generator ignoring instructions, and its central lesson
applies here one level up: *an instruction the generator has already ignored is not a
control.*

**v3 already contains the fix, applied to one step.** D27's tooling gate is exactly the right
shape: a script that exits non-zero, a waiver that must name what it gives up, wired into the
prompts as Step 0. The same shape applied to the four steps above is the proposal in lms
`NEXT-STEPS.md` §5 — a `PHASE-GATE.yml` the validator refuses to pass until each gate is met
or explicitly waived:

```yaml
phase: 1
gates:
  interview_complete:     true   # SPEC-AUTHOR questions answered
  frontend_gate_7a:       true   # FRONTEND-VISION.md exists, or waived with a reason
  abc_pass_complete:      true
  spec_validates:         true
  handover_current:       true   # no template placeholders left — mechanically greppable
  delegation_considered:  true   # LEDGER.md has a round mode, or explicitly solo
  kit_extract_run:        false  # ← blocks phase close
```

**INFERRED:** this generalises D27 rather than adding a new idea, which makes it cheap to
adopt. It has **not** been built or tested.

## F3 — Step A of the A/B/C pass was the highest-value step

**OBSERVED** (lms `SPEC.md` §0.4, `BUILDER-DECISIONS-REVIEW.md` D8/D10). `SPEC-AUTHOR`'s
A-pass says: measure the real data before specifying. Measuring 240 real questions found
the longest option was the correct answer **82%** of the time against a 25% baseline. Every
Phase 1 decision follows from that number. Specifying from SAI's description alone would
have missed it. The first measurement was also *wrong* — it was run on banks from an older
prompt — and only re-measuring caught that.

**Merge implication:** keep the A/B/C pass in any merged version. If anything, make Step A
harder to skip.

## F4 — Parallel delegation worked

**OBSERVED** (lms `delegation/LEDGER.md`, `BUILDER-DECISIONS-REVIEW.md` D20–D24). Mode:
SAI drove a second LLM himself (v3 calls this `self-parallel`). Four tasks.
`check-task-independence.mjs` exited 0. The work merged cleanly and post-merge tests
passed (42 / 96 / 13). It split cleanly because the spec pinned the interface (a JSON schema)
before any task started — `DELEGATE-WORK`'s own precondition that the spec be locked first.

**INFERRED:** this suits *continuing* a project better than starting one, because only
then is a spec section locked.

## F5 — The integrator was the weak link, not the workers

**OBSERVED** (lms `HANDOVER.md` Gotcha #4, `BUILDER-DECISIONS-REVIEW.md` D24). The returned
report was 22/22 accurate. The integrating session ran a file search that **hit its timeout**,
printed "not found anywhere" regardless, and accused the worker of inventing a file. The file
existed. The record was corrected — the false claim was retracted, not deleted.

**VERIFIED-IN-CODE, v3:** `INTEGRATE-DELEGATED-WORK.md` does tell the integrator to run the
project's own gate (tests) after each merge — so *positive* claims about behaviour get
checked. It has no rule about a worker's claims of *what it produced* (files, paths), and none
about treating a search that timed out or errored as inconclusive rather than as "absent".
`STEERING-PROMPTS.md` (v3) makes self-correction trigger a correction card, which helps after
the mistake, not before it.

**Merge implication:** one rule — *an unverified negative is not a verified negative* —
belongs in the integration prompt.

## F6 — Git across nested repos broke the workflow

**OBSERVED** (lms `GIT-WORKFLOW.md`). The project folder held five git repos, one of them
tracked by the root as a gitlink. The root tracked ~4,600 files; through a network-mounted
bridge, `git status` **timed out and returned empty on a dirty tree**, which looked clean.
That caused five duplicate commits. The two repos also had different trunk branch names, and
an instruction that assumed one name failed.

**VERIFIED-IN-CODE:** `VERSIONING.md` in both versions says the kit itself is
"filesystem-versioned (no git for v1)" and leaves consumer VCS to the consumer. Neither version
says anything about nested repos, gitlinks, or branch-per-task across more than one repo.

**INFERRED:** partly specific to that harness. The branch-per-task + verify-before-merge
convention from lms `GIT-WORKFLOW.md` §3 is general and may belong in `DELEGATE-WORK` /
`INTEGRATE-DELEGATED-WORK`.

## F7 — Content methodology now lives in three places

**INFERRED** from reading, not from a failure.

| Where | What it generates |
|---|---|
| `related/skill-template/` (v1.2) | A day-by-day study plan from a syllabus: code, slides, diagrams, quizzes, whiteboard and teleprompter scripts, recall exercises |
| `new/tins-kit/prompts/GENERATE-CURRICULUM.md` (added in v2) | A curriculum from a *finished TINS project's* real history |
| `evidence/lms/prompts/` (5 prompts + `registry.json`) | Question banks, study notes, a failure-mode ("landmine") inventory, item repair, item analysis. `PROMPT-INVENTORY.md` traces their lineage from SAI's earlier prompts |

All three make teaching material for the same person. None references the others.

---

## What the lms run did NOT test

Autonomous build (D26), tooling audit (D27), steering prompts (D28), execution-mode
interview (D29), open-source release, curriculum generation, `kit-extract`, `kit-sync`,
`PROMOTE-TO-TINS`. **For these there is no field evidence either way.** The only real run of
the autonomous build is the kit's own example (`new/tins-kit/examples/autonomous-todo-app/`),
a small todo app — informative, but it is the kit testing itself.
