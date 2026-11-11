---
id: decision-restructure-the-workspace-lift-the-kit-to-top-level-extr
solves: Restructure the workspace: lift the kit to top-level, extract the 5 projects to siblings, vendor the kit into each, ship the methodology + sync machinery
triggers: Restructure the workspace: lift the kit to top-level, extract the 5 projects to siblings, vendor the kit into each, ship the methodology + sync machinery
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Restructure the workspace: lift the kit to top-level, extract the 5 projects to siblings, vendor the kit into each, ship the methodology + sync machinery

> Harvested evidence, not instructions and not reviewed global knowledge.

## D18 — Restructure the workspace: lift the kit to top-level, extract the 5 projects to siblings, vendor the kit into each, ship the methodology + sync machinery

**What changed.** Session 9 (2026-08-15) executed the user's request:
"separate the projects into separate folders, include tins-kit in each,
and a new LLM session from any project can update the kit when there's
progress."

**The restructure:**

1. **Lifted `tins-kit/` to top-level.** Was at
   `C:\Users\user\Desktop\TINS-projects\atal-incubation\Jayshankar\tins-kit\`;
   now at `C:\Users\user\Desktop\TINS-projects\atal-incubation\tins-kit\`.
2. **Extracted the 5 reference projects to siblings of the kit:**
   - `Jayshankar/` (stays; was the parent of `tins-kit/`)
   - `incubos/` (stays; was the atal-incubation app)
   - `Data-cleaning-script/` (lifted from `Jayshankar/Data-cleaning-script/`)
   - `package5/` (lifted from `Jayshankar/package5/`)
   - `exam-forge/` (extracted from `Jayshankar/archive/exam-forge-reference/`)
3. **Vendored the kit into each project** (105 files × 5 projects =
   525 vendored files; each project has `<project>/tins-kit/`).
4. **Wrote the 4 new top-level files:**
   - `PIPELINE.md` (~9.5 KB): the 7-step methodology the LLM absolutely
     follows. Universal — applies at kit root AND at consumer root.
   - `VERSIONING.md` (~13 KB): the version control strategy. The 7
     rules (top-level is source of truth, vendored is read-only for the
     kit, kit-sync.mjs is the workhorse, kit-extract.mjs is the pull-back,
     filesystem-versioned, etc.). The 3 worked examples. The 4 edge cases.
   - `scripts/kit-sync.mjs` (~6.4 KB): the workhorse. Idempotent. SHA-256
     diffing. Additive + update (preserves project-added files). Writes
     a `.kit-sync.json` marker for "when was this last synced."
   - `templates/PROJECT-AGENT-BRIEF.md` (~5.7 KB): the per-project
     "absolutely must follow" template.
5. **Generated per-project `AGENT-BRIEF.md`** for all 5 projects. Each
   one says "you are at PROJECT-X; here's the project-specific stuff; the
   methodology is in `./tins-kit/PIPELINE.md`; the kit's growth is in
   `./tins-kit/HANDOVER.md`; the version control is in `./tins-kit/VERSIONING.md`."
6. **Synced all 5 projects** to pick up the new files (4 per project:
   PIPELINE.md, VERSIONING.md, HANDOVER.md, kit-sync.mjs).

**Why.** The kit had the auto-extraction loop (D17) but it was only
usable from the kit root. The user pointed out (rightly) that any LLM
working at a consumer project root should be able to mine its learnings
back to the kit. That requires:
- The kit to be physically present at the consumer root (so the
  consumer can run `node tins-kit/scripts/...`).
- The methodology to be a single, sharp doc the LLM reads first
  (PIPELINE.md replaces the longer WORKFLOW.md for the "what do I do?"
  question).
- The version control strategy to be explicit (VERSIONING.md, with
  the 7 rules, the kit-sync.mjs script, the worked example).
- The per-project brief to be a 1-page starter (AGENT-BRIEF.md), not a
  long AGENTS.md that no one reads.

**Impact on downstream.** The kit's loop is now project-aware. A new
LLM session at any of the 5 consumer projects can:
1. Read `./tins-kit/PIPELINE.md` (universal methodology).
2. Read `./AGENT-BRIEF.md` (project-specific).
3. Build + record decisions.
4. Run `node tins-kit/scripts/kit-extract.mjs --consumer=.` to produce
   the growth candidates.
5. The kit-growth session at the kit root accepts the candidates and
   runs `node scripts/kit-sync.mjs --to=<project>` to push the new kit.

The new 6th project (a future domain) scaffolds with
`node tins-kit/scripts/new-project.mjs <name> --with=<modules>` and gets
the vendored kit on day 1.

**Cross-references:** SPEC.md §0.2 D25 (the workspace structure decision),
§2 (the new PIPELINE.md, VERSIONING.md, kit-sync.mjs, PROJECT-AGENT-BRIEF.md),
§8.22 (the §8 acceptance criteria for the methodology + version control),
HANDOVER.md (session 9 deliverable), BUILDER-DECISIONS-REVIEW.md (this entry),
the 5 per-project `AGENT-BRIEF.md` files at the project roots.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D18 — Restructure the workspace: lift the kit to top-level, extract the 5 projects to siblings, vendor the kit into each, ship the methodology + sync machinery
