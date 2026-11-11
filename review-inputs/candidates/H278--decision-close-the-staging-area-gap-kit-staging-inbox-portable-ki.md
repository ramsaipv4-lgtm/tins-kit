---
id: decision-close-the-staging-area-gap-kit-staging-inbox-portable-ki
solves: Close the staging-area gap: kit-staging/ inbox + portable kit shell + 2 generic prompts (D26 realised)
triggers: Close the staging-area gap: kit-staging/ inbox + portable kit shell + 2 generic prompts (D26 realised)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Close the staging-area gap: kit-staging/ inbox + portable kit shell + 2 generic prompts (D26 realised)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D19 — Close the staging-area gap: kit-staging/ inbox + portable kit shell + 2 generic prompts (D26 realised)

**What changed.** Session 10 (2026-08-15) shipped the third leg of the
bidirectional loop that D17 + D18 set up but didn't finish: the
**transport layer** for projects that aren't adjacent to the kit
(different machine, future project, project the kit doesn't know about
yet, project that predates the kit).

- **`kit-staging/`** (new top-level dir): the inbox. `kit-staging/README.md`
  documents the 4-thing-can-be-dropped table (BUILDER-DECISIONS-REVIEW.md /
  kit-growth-candidates.md / lib/patterns / lib/<module> / prompts), the
  flow diagram, the inbox lifecycle, and why a staging area (not direct
  sync). `kit-staging/inbox/` and `kit-staging/archive/` are self-cleaning.
- **`scripts/kit-ingest.mjs`** (~12.9 KB): the inbox scanner. Reads every
  `<project>/BUILDER-DECISIONS-REVIEW.md` in the inbox, re-runs the
  `kit-extract.mjs` heuristic on each, and produces a merged triage
  report at `kit-staging/triage-<date>.md`. Exits 0 if no candidates,
  1 if there are. `--archive` moves the consumed entries to
  `kit-staging/archive/<date>/`. Zero-dep.
- **`scripts/kit-new-project-shell.mjs`** (~12 KB): the portable kit
  shell scaffolder. Produces a `.kit-shell/` directory (~10 files,
  ~50 KB) containing the minimum kit: `decision-log.mjs`,
  `kit-extract.mjs`, `kit-staging-export.mjs`, the 3 prompts
  (SPEC-AUTHOR, INTERVIEW-CHECKLIST, BUILDER-REVIEW-TEMPLATE), the
  templates (HANDOVER, BUILDER-DECISIONS-REVIEW, SPEC), and the
  `.kit-shell.json` marker. The shell ships with the project; the user
  copies the whole project (or just `.kit-shell/`) to a different
  machine. Zero-dep.
- **`scripts/kit-staging-export.mjs`** (~7.1 KB): the consumer-side
  dump helper. Bundles the consumer's `BUILDER-DECISIONS-REVIEW.md`
  + `kit-growth-candidates.md` + any `lib/patterns/*.md` + any
  `lib/<module>/` + any `prompts/*.md` + the `.kit-shell.json` marker
  into a single `.tar.gz` (POSIX) or `.zip` (Windows) file. The user
  copies that file to the kit machine and extracts it into
  `kit-staging/inbox/<project-name>/`. Zero-dep.
- **`prompts/NEW-PROJECT.md`** (~7.7 KB): the 7-step generic
  copy-paste prompt for starting a TINS project in any directory on
  any machine. The LLM reads the kit shell, runs the interview
  (SPEC-AUTHOR.md), drafts the spec, builds the project, records
  decisions, mines the learnings, and ships a tarball back. The
  5 commands to memorise: pwd, decision-log, kit-extract,
  kit-staging-export, validate.
- **`prompts/KIT-GROWTH-SESSION.md`** (~8.7 KB): the 8-step generic
  copy-paste prompt for triaging the inbox at the kit root. The LLM
  runs `kit-ingest.mjs`, triages each candidate via
  `KITTING-REVIEW.md`'s 3-question rubric (generalises? worked example?
  duplicates existing?), runs the KITTING workflow for each accepted
  candidate, syncs the new kit to every project via `kit-sync.mjs`,
  and archives the inbox. The 2-consumer rule is enforced.
- **Validator §8.23** (8 new checks): the validator now checks
  `kit-staging/README.md` is present + non-trivial, the inbox and
  archive dirs exist, the 2 new scripts are present, and the 2 new
  prompts are present + non-trivial.

**Why.** The user pointed out (rightly) that the kit's loop, while
project-aware (D18), still assumed the consumer was a sibling of the
kit (`../<project>/`). That doesn't work for:
- A project on a **different machine** (the user has a laptop + a server).
- A **future project** (one the user hasn't scaffolded yet but wants to
  start with the kit's discipline).
- A **project the kit doesn't know about yet** (a friend sent a tarball).
- A **project that predates the kit** (a working app the user wants to
  bring into the growth loop retroactively).

The staging area is the solution. It's the inbox any project, anywhere,
can drop its kit-worthy artefacts into. The portable kit shell is the
minimum kit a project needs to participate in the loop without
installing the full kit. The 2 generic prompts are the LLM-facing
workflows that make the participation drop-in.

**Impact on downstream.** The kit's loop is now machine-agnostic. A
fresh LLM session, on any machine, with just the kit shell + the
NEW-PROJECT prompt, can start a TINS project from scratch, build it,
record decisions, mine learnings, and ship them back to the kit
machine via a single tarball. The next kit-growth session at the kit
root triages the tarball and adds the keepers. The kit grows by
N patterns per remote project. The 2-consumer rule still holds (a
remote project is still 1 consumer; the second observation may come
later from a different remote project).

**Cross-references:** SPEC.md §0.2 D26 (the staging-area decision,
locked this session), §8.23 (the new acceptance criteria, 8 checks
across the staging area + the 2 new scripts + the 2 new prompts),
`kit-staging/README.md` (the transport-layer spec), `prompts/NEW-PROJECT.md`
(the 7-step generic workflow), `prompts/KIT-GROWTH-SESSION.md` (the
8-step generic workflow), the 3 new scripts (`kit-ingest.mjs`,
`kit-new-project-shell.mjs`, `kit-staging-export.mjs`), the
`PIPELINE.md` "Beyond the 7 steps" section (added this session),
the `VERSIONING.md` §7 "The transport layer" section (added this session).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D19 — Close the staging-area gap: kit-staging/ inbox + portable kit shell + 2 generic prompts (D26 realised)
