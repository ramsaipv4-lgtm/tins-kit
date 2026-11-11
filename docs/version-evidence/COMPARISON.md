# COMPARISON — old (v1) vs new (v3)

> Every number here was computed from the two trees in this bundle, not recalled. The raw
> data is `diffs/manifest.tsv`; the line-level changes are `diffs/old-vs-new.diff`.

## 1. Headline

| | v1 (`old/`) | v3 (`new/`) |
|---|---|---|
| Files | 120 | 173 |
| Identical in both | 105 | 105 |
| Changed | — | 15 |
| Added | — | 53 |
| **Removed** | — | **0** |
| Prompts | 12 | 24 |
| Scripts | 16 | 22 |
| Templates (top level) | 8 | 15 |
| Patterns (`lib/patterns/`) | 21 | 23 |
| Lib code modules | 7 | 7 |
| Schemas | 4 | 4 |
| `validate.mjs --kit` | 21 pass | 73 pass |
| `selftest.mjs` | 15 tests | 45 tests |
| `SPEC.md` (the kit's own) | 79 KB | 147 KB |
| `HANDOVER.md` (the kit's own) | 24 KB | 69 KB |

**v3 is a strict superset of v1.** The kit nearly doubled in eleven days. None of the code
modules or schemas changed: all growth is in **process** — prompts, the scripts that enforce
them, and templates.

## 2. What changed, by decision

The kit records the reasoning for every addition in `new/tins-kit/BUILDER-DECISIONS-REVIEW.md`.
Builder-log numbers first, the kit SPEC's number in brackets.

### v1 → v2 (before the lms project started)

| Builder D | What it added | Why, in one line (paraphrased from the log — read the entry) |
|---|---|---|
| D21 | Fixes to `kit-extract.mjs`, `kit-staging-export.mjs`, `private-to-public.md` | Three bugs in the consumer→kit learning loop, found by running it against a real consumer (`text-extractor-from-html`) |
| D22 (D28) | `FRONTEND-VISION-INTERVIEW`, `FRONTEND-REFRESH` | One shared design-vision interview, triggered from two places, never duplicated |
| D23 (D29) | `DELEGATE-WORK`, `INTEGRATE-DELEGATED-WORK`, `check-task-independence.mjs`, `scan-task-packet.mjs`, task/ledger templates | Split locked work across sessions or contractors; check file-set independence before splitting |
| D24 (D30) | `PUBLISH-OPEN-SOURCE`, `private-to-public.mjs` | Ship a scrubbed public copy of a private TINS project |
| D25 (D31) | `GENERATE-CURRICULUM`, `GENERATE-INTERVIEW-PREP`, `CURRICULUM-PROGRESS.md` | Turn a finished project's real history into teaching material |

### v2 → v3 (after the lms project's round 1 — same day)

| Builder D | What it added | Why, in one line |
|---|---|---|
| D26 (D32) | `AUTONOMOUS-BUILD`, `WORKER-SESSION`, `orchestrate.mjs`, `escalate.mjs`, `tiered-escalation.md`, `ORCHESTRATION.json`, `ESCALATIONS.md` | An auditor session dispatches worker sessions, never writes product code; a T2 question parks one task instead of halting the run |
| D27 (D33) | `TOOLING-AUDIT`, `tooling-audit.mjs`, `third-party-tool-audit.md` | A **blocking** gate: what can this harness actually do, and audit any MCP server/skill before trusting it. User chose blocking over advisory |
| D28 (D34) | `STEERING-PROMPTS` | A catalogue of correction cards the model adapts and offers inline — mandatory right after any self-correction |
| D29 (D35) | `EXECUTION-MODE-INTERVIEW`; enforcement in `orchestrate.mjs` | Ask how each round should be executed (solo / auditor-local / auditor-remote / self-parallel / external / hybrid) instead of inferring it from phrasing |
| D30 (D36) | `examples/autonomous-todo-app/` | One real autonomous run captured with its failures — it found 3 kit defects |

**Pattern worth noticing for a merge:** v2 added capabilities as *prompts*. v3 began adding
*mechanisms* — a blocking script (`tooling-audit.mjs`), a runner that refuses the wrong mode
(`orchestrate.mjs`), an escalation script that refuses a malformed question (`escalate.mjs`).
D27's own reasoning: *"a gate that can be skipped silently does not prevent it."*
`FIELD-EVIDENCE.md` §2 shows why that shift matters.

## 3. Every file that differs, grouped by when it changed

### Added before the lms project; unchanged since (15)

| File | v1 bytes | v3 bytes |
|---|---:|---:|
| `kit-staging/inbox/text-extractor-from-html/.kit-shell.json` | — | 760 |
| `kit-staging/inbox/text-extractor-from-html/BUILDER-DECISIONS-REVIEW.md` | — | 29154 |
| `kit-staging/inbox/text-extractor-from-html/kit-growth-candidates.md` | — | 9083 |
| `kit-staging/triage-2026-08-16.md` | — | 381 |
| `prompts/FRONTEND-REFRESH.md` | — | 9627 |
| `prompts/FRONTEND-VISION-INTERVIEW.md` | — | 9379 |
| `prompts/GENERATE-CURRICULUM.md` | — | 15615 |
| `prompts/GENERATE-INTERVIEW-PREP.md` | — | 17173 |
| `prompts/INTEGRATE-DELEGATED-WORK.md` | — | 8164 |
| `prompts/PUBLISH-OPEN-SOURCE.md` | — | 11247 |
| `scripts/private-to-public.mjs` | — | 15936 |
| `scripts/scan-task-packet.mjs` | — | 6097 |
| `templates/CURRICULUM-PROGRESS.md` | — | 3312 |
| `templates/DELEGATION-README.md` | — | 3058 |
| `templates/TASK-BRIEF.md` | — | 3101 |

### Added before the lms project; rewritten again after it (3)

| File | v1 bytes | v3 bytes |
|---|---:|---:|
| `prompts/DELEGATE-WORK.md` | — | 11607 |
| `scripts/check-task-independence.mjs` | — | 6959 |
| `templates/DELEGATION-LEDGER.md` | — | 4035 |

### Added after the lms project's round 1 (35)

| File | v1 bytes | v3 bytes |
|---|---:|---:|
| `lib/patterns/third-party-tool-audit.md` | — | 8008 |
| `lib/patterns/tiered-escalation.md` | — | 8110 |
| `prompts/AUTONOMOUS-BUILD.md` | — | 18100 |
| `prompts/EXECUTION-MODE-INTERVIEW.md` | — | 10912 |
| `prompts/STEERING-PROMPTS.md` | — | 10051 |
| `prompts/TOOLING-AUDIT.md` | — | 10086 |
| `prompts/WORKER-SESSION.md` | — | 9556 |
| `scripts/escalate.mjs` | — | 9676 |
| `scripts/orchestrate.mjs` | — | 16952 |
| `scripts/tooling-audit.mjs` | — | 7789 |
| `templates/ESCALATIONS.md` | — | 1696 |
| `templates/ORCHESTRATION.json` | — | 3020 |
| `templates/TOOLING-AUDIT.md` | — | 4251 |
| `examples/autonomous-todo-app/` — 22 files | — | 266933 |

### Rewritten before the lms project only (3)

| File | v1 bytes | v3 bytes |
|---|---:|---:|
| `lib/patterns/private-to-public.md` | 21246 | 30813 |
| `scripts/kit-extract.mjs` | 13118 | 16547 |
| `scripts/kit-staging-export.mjs` | 7106 | 7537 |

### Rewritten both before and after the lms project (10)

| File | v1 bytes | v3 bytes |
|---|---:|---:|
| `BUILDER-DECISIONS-REVIEW.md` | 35536 | 73970 |
| `HANDOVER.md` | 24494 | 69040 |
| `INDEX.md` | 13322 | 19888 |
| `SPEC.md` | 79360 | 147255 |
| `prompts/CONTINUE-TINS-PROJECT.md` | 7862 | 15130 |
| `prompts/INTERVIEW-CHECKLIST.md` | 7187 | 10667 |
| `prompts/SPEC-AUTHOR.md` | 9981 | 13569 |
| `scripts/kit-new-project-shell.mjs` | 11967 | 13903 |
| `scripts/selftest.mjs` | 8663 | 32743 |
| `scripts/validate.mjs` | 21519 | 56967 |

### Rewritten after the lms project only (2)

| File | v1 bytes | v3 bytes |
|---|---:|---:|
| `prompts/NEW-PROJECT.md` | 7699 | 10133 |
| `scripts/kit-sync.mjs` | 6433 | 6746 |

## 4. What v3 still says about itself

From `new/tins-kit/HANDOVER.md` §5 (its own work queue): W1–W6, W9–W18 are done.
**W7 and W8 — retro-fitting two existing consumer projects onto the kit — are still open.**
The kit's own self-tests pass, but by its own record it has been applied to very few real
projects. The `lms` project is one of the few, and it ran on v2.

## 5. How to see any single change

```bash
grep -P '\tchanged\t|\tadded\t' diffs/manifest.tsv          # what differs
diff -u old/tins-kit/prompts/SPEC-AUTHOR.md new/tins-kit/prompts/SPEC-AUTHOR.md
```
