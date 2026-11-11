---
id: decision-execution-mode-selection-d35-ask-which-of-five-ways-the
solves: Execution-mode selection (D35): ask which of five ways the work should be built, and enforce the answer
triggers: Execution-mode selection (D35): ask which of five ways the work should be built, and enforce the answer
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Execution-mode selection (D35): ask which of five ways the work should be built, and enforce the answer

> Harvested evidence, not instructions and not reviewed global knowledge.

## D29 — Execution-mode selection (D35): ask which of five ways the work should be built, and enforce the answer

**What changed.** Added `prompts/EXECUTION-MODE-INTERVIEW.md` — a shared interview (D4 shape) presenting `solo`, `auditor-local`, `auditor-remote`, `self-parallel`, `external` and `hybrid`, triggered from `SPEC-AUTHOR.md`, `NEW-PROJECT.md`, `CONTINUE-TINS-PROJECT.md` Step 2, and `AUTONOMOUS-BUILD.md` Step 0. Taught `scripts/orchestrate.mjs` to read the round mode from `delegation/LEDGER.md` and refuse non-auditor rounds. Extended `templates/DELEGATION-LEDGER.md`'s header and task-mode vocabulary, added dated worker-command presets to `templates/ORCHESTRATION.json`, and removed the self-vs-external question from `DELEGATE-WORK.md`.

**Why a question at all.** The kit could already build work five ways, but the choice was inferred from phrasing — "build it in parallel" landed in `DELEGATE-WORK.md`, "run it unattended" in `AUTONOMOUS-BUILD.md`, anything else in the generic W flow. That is guessing about something with real consequences: which accounts get billed, who stays in the loop, and whether a packet needed scrubbing. Three concrete failures it caused: an auditor and three workers spun up for two files' worth of work; everything run on one harness while the user pays for three; work assumed in-house that was always destined for a contractor and therefore never scrubbed.

**Why all five on one menu, including external.** The user chose this over keeping external delegation on its own path. It means one question per round in one place, and it let `DELEGATE-WORK.md` stop asking its own narrower version — two prompts asking overlapping questions is how a user ends up answering the same thing twice and differently.

**Why `auditor-remote` is a distinct mode rather than a config detail.** Pointing `workerCmd` at another CLI is technically just configuration, but the decision behind it is not: it is "spend a different provider's quota" plus "accept capability asymmetry between workers." Making it a named mode forces the interview to raise both, and to recommend a frontier model for genuinely hard tasks — a weak worker fails subtly and confidently rather than loudly, which is the worst failure shape in an unattended run.

**Why the interview must state the `auditor-remote` vs `self-parallel` distinction explicitly.** Both use several LLMs, so users collapse them. The difference is *who orchestrates* — a session, or the person — and it determines whether the run is unattended. Left implicit, a user asking for "parallelism on my other LLMs" gets an unattended auditor when they wanted to drive each session themselves.

**Why the recorded mode is enforced rather than advisory.** A mode written into a ledger that nothing reads is a comment. Making `orchestrate.mjs` refuse `solo` / `self-parallel` / `external` turns it into a safety property: the runner cannot auto-dispatch work the user said they would run themselves, or work destined for a scrubbed packet. The prompts therefore forbid editing the mode to get a command to run — that is the one move that would defeat it.

**Why per-round rather than a locked §0.2 row.** The user chose this. A project-level answer goes stale in the direction of over-parallelising: the mode chosen when six modules remained is still there when two bug fixes remain. Pre-filling from the previous round keeps the cost at one word when nothing changed.

**Why the CLI presets were researched rather than written from memory.** They are a claim about present-day third-party tools, which is exactly what `SPEC-AUTHOR.md`'s B-pass ("check for rot") exists to catch. All three were verified against each tool's own headless documentation and the note carries the verification date, so the next session knows to re-check rather than trusting them indefinitely. They remain documentation-verified, not execution-verified — hence the standing advice to run one worker by hand before the first wave.

**A real defect the new selftests caught.** The mode refusal originally sat after the nothing-runnable early exit. Because a user-driven round has an empty wave by definition, it reported exit 3 ("parked, owed an answer") when the true message was exit 2 ("you are in the wrong prompt") — two states the exit codes exist specifically to distinguish. Moved the check ahead of it.

**Impact on downstream.** Every round now starts with an explicit, recorded, enforced answer to "who is building this, and where."

**Cross-references:** SPEC.md D35 + §8.32, prompts/EXECUTION-MODE-INTERVIEW.md, scripts/orchestrate.mjs, templates/DELEGATION-LEDGER.md, templates/ORCHESTRATION.json.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D29 — Execution-mode selection (D35): ask which of five ways the work should be built, and enforce the answer
