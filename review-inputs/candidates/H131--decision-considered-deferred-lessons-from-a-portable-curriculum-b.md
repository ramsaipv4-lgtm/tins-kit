---
id: decision-considered-deferred-lessons-from-a-portable-curriculum-b
solves: Considered, deferred: lessons from a "portable curriculum builder" bundle
triggers: Considered, deferred: lessons from a "portable curriculum builder" bundle
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Considered, deferred: lessons from a "portable curriculum builder" bundle

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 32 — Considered, deferred: lessons from a "portable curriculum builder" bundle

**What happened.** The user added `data-analysis-curriculum-builder.skill` and
`portable_curriculum_builder.zip` to the project root and asked for anything useful to be
extracted for `tins-kit` and for this project. Both are the same workflow (a Claude-Code skill
that turns a course syllabus into a verified teaching package — unrelated to fish-wholesale
inventory), one rewritten to be harness-agnostic so a different AI tool can pick it up honestly.
Read in full; findings reported to the user in chat.

**What was proposed, not built:**
- A `tins-kit/lib/patterns/` doc distilling the bundle's "hand a workflow to a genuinely
  different harness" pattern (explicit capability self-report with literal test commands, a
  persistence-mechanism menu, permission to say "I can't do part of this") — directly relevant
  to the MiniMax delegation setup in `delegation/README.md`, which arrived at a narrower version
  of the same idea ad hoc.
- Porting `scripts/contrast_checker.py` (real WCAG contrast-ratio math, ~40 lines, zero
  dependencies) from the bundle into this project as a zero-dep Node script, since `SPEC.md` §6's
  WCAG 2.1 AA checklist currently has no automated check anywhere in the codebase.

**Decision: deferred, not implemented.** User chose to leave this as a written proposal rather
than act on it now. Recording it here so it isn't lost and doesn't need re-discovering later —
this is a considered deferral, not an oversight.

**When this changes.** Whenever the user wants either piece picked up: the `tins-kit` pattern doc
is a kit-growth candidate for a session actually working in `tins-kit/`; the `contrast_checker`
port is a normal Jayshankar task (candidate T4 alongside T2/T3, `delegation/LEDGER.md`) whenever
accessibility verification becomes a priority.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 32 — Considered, deferred: lessons from a "portable curriculum builder" bundle
