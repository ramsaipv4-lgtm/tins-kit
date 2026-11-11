# START-HERE — two versions of the TINS kit, side by side

> **If you are an LLM:** read this file, then `MERGE-BRIEF.md` (your task), then
> `COMPARISON.md` and `FIELD-EVIDENCE.md`. Only then open the kits themselves.
> Do not edit anything under `old/`, `new/`, `related/` or `evidence/` — they are the record.

Bundle built: 2026-10-20, by the session that wrote the `lms` project's Phase 1 spec.
Owner: SAI (freelance technical trainer). The kit is SAI's own methodology.

---

## 1. What is in here

| Folder | What it is | Taken from (on SAI's disk) | Last modified | Files | Its own checks, run from this bundle |
|---|---|---|---|---|---|
| `old/tins-kit/` | **The old TINS kit** (call it **v1**) | `D:\Takeu-Forward\content\notes\(IRIS) – Proficiency Level 2\tins-kit\` | 2026-08-15 | 120 | `validate --kit` 21 pass / 0 fail · `selftest` 15/15 |
| `new/tins-kit/` | **The new TINS kit** (call it **v3**) | `D:\Takeu-Forward\tins-kit\` | 2026-08-26 | 173 | `validate --kit` 73 pass / 0 fail · `selftest` 45/45 |
| `related/skill-template/` | A **different methodology**: SAI's syllabus-to-study-plan skill (v1.2) for mass-producing teaching content | `D:\Takeu-Forward\skill-template\` | 2026-08-14 | 6 | none — it has no scripts |
| `evidence/lms/` | Selected files from **one real project built with the kit** — incomplete, Phase 1 of ~4 | `D:\Takeu-Forward\lms\` | 2026-08-26 | 19 | — |
| `diffs/` | `manifest.tsv` (every file, both versions, sha + bytes) and `old-vs-new.diff` (unified diff of the 15 changed files) | generated | — | 2 | — |

Both kits pass their own validator and self-test **when run from inside this bundle**, so each
folder is self-contained. Run them yourself before trusting that line:

```bash
cd old/tins-kit && node scripts/validate.mjs --kit && node scripts/selftest.mjs
cd new/tins-kit && node scripts/validate.mjs --kit && node scripts/selftest.mjs
```

Zero-dependency Node. No `npm install` needed.

## 2. There were three versions, not two

| | When | Where it is |
|---|---|---|
| **v1** | 2026-08-15 | `old/` |
| **v2** | 2026-08-26 00:56 | **Not included as a tree.** This is the version the `lms` project was built with. It exists only in git: commit `9c308e5`, path `tins-kit/`, in SAI's repo at `D:\Takeu-Forward` |
| **v3** | 2026-08-26 09:19–10:29 | `new/` |

This matters for exactly one reason: **the field evidence in `evidence/lms/` was produced on v2.**
Some of what that project found missing was added in v3 a few hours later; some was not.
`FIELD-EVIDENCE.md` says which, finding by finding, verified against v3's code — not
against its prose.

## 3. Four things not to assume

1. **"Newer is better."** v3 removed nothing. Every v1 file is still in v3, and 105 of 120 are
   byte-identical (after CRLF normalisation). So the real question is never *which version to
   keep*. It is **which of v3's 53 additions and 15 rewrites earned their place** — and on what
   evidence.
2. **"The lms project is a verdict."** It is not finished. It exercised `NEW-PROJECT`,
   `SPEC-AUTHOR` (interview + A/B/C pass), `FRONTEND-VISION-INTERVIEW` (late), `DELEGATE-WORK` and
   `check-task-independence` (one round, four tasks). It never exercised autonomous build,
   tooling audit, steering prompts, execution-mode interview, open-source release, curriculum
   generation, or `kit-extract`. **No evidence is not negative evidence.**
3. **"`skill-template` is TINS v0."** It is not the same kind of thing. The kit is a methodology
   for building *software* from a spec. `skill-template` is a methodology for producing
   *teaching content* from a syllabus. They overlap at one point: v2 added
   `prompts/GENERATE-CURRICULUM.md`, which also produces teaching material. Whether those two
   should merge, stay separate, or reference each other is a real question; it is in
   `MERGE-BRIEF.md`.
4. **"D27 means the same thing everywhere."** The kit has **two decision-numbering schemes**.
   `BUILDER-DECISIONS-REVIEW.md` numbers its entries D1–D30; the kit's own `SPEC.md` numbers its
   locked decisions D1–D36. They are offset: builder-log **D26** is SPEC **D32**. Headings
   usually carry both — `## D26 — Autonomous orchestration (D32)` — so always quote which file
   a D-number came from.

## 4. What was deliberately left out

| Left out | Why |
|---|---|
| `new/tins-kit/_to_delete/`, `new/tins-kit/.trash_kitstaging/` | Two tarballs already marked for deletion by their names. Listed in neither kit's INDEX |
| `lms/MEASUREMENT.md`, `lms/delegation/tasks/T3/NOTES.md` | **Contain real student names** next to scores. Not needed for a kit merge |
| `lms/interview-answers.odt`, `lms/ASSUMPTIONS.md`, `REPURPOSING-MAP.md`, `EXAM-FORGE-SURVEY.md` | Project-specific surveys; nothing kit-level in them that `BUILDER-DECISIONS-REVIEW.md` does not already record |
| `exam-forge/` | A separate git repository and a separate, earlier TINS project. It is the code base `lms` extends, not a kit version |
| The v2 tree | See §2. Recover any file with `git show 9c308e5:tins-kit/<path>` in SAI's repo |

## 5. Reading order

1. `MERGE-BRIEF.md` — the task
2. `COMPARISON.md` — what changed, grouped by when and why
3. `FIELD-EVIDENCE.md` — what one real project showed, and what v3 already fixed
4. `new/tins-kit/INDEX.md` — v3's own one-page map of every asset
5. `new/tins-kit/BUILDER-DECISIONS-REVIEW.md` from **D21 onward** — the reasoning for every
   addition since v1. The kit records *why*, not just *what*; read the why before judging
6. `old/tins-kit/INDEX.md` — to see the kit before it doubled
7. `related/skill-template/SKILL.md`
8. `evidence/lms/NEXT-STEPS.md` §5, then `evidence/lms/BUILDER-DECISIONS-REVIEW.md` D1
