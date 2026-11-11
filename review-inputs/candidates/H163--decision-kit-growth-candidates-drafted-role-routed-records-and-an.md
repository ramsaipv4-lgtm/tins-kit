---
id: decision-kit-growth-candidates-drafted-role-routed-records-and-an
solves: Kit-growth candidates drafted: role-routed records, and an audit of the kit's execution modes
triggers: Kit-growth candidates drafted: role-routed records, and an audit of the kit's execution modes
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Kit-growth candidates drafted: role-routed records, and an audit of the kit's execution modes

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 98 — Kit-growth candidates drafted: role-routed records, and an audit of the kit's execution modes

**What changed.** The owner asked whether an expensive model should be writing documentation, whether multiple models
and harnesses can share one repository's context, and what the kit already covers. Answer, after reading the kit's
`EXECUTION-MODE-INTERVIEW.md`, `tiered-escalation.md`, `manual-relay-worker-loop.md`, `ORCHESTRATION.json`,
`orchestrate.mjs` and `docs-guardian`: the kit has five modes organised by **who orchestrates**, and no axis for
**which model produces which artefact** or for how harnesses share records. Four drafts, in the kit's pattern format
(§0–§3 + footer), are in `docs/kit-growth/` for the owner to export to `tins-kit/kit-staging/inbox/`:
`role-routed-records.md`, `kit-modes-audit-and-redesign.md` and (added the same day, from the owner's own idea)
`session-ledger-worktree-reconcile.md` — per-session ledger entries whose facts are derived from git, one worktree per
agent, and a reconciler that is handed indexed conflict briefs and checked for completeness rather than trusted to read
everything — and a fourth, `pattern-lifecycle-reuse-loop.md`: pattern applicability metadata (including `not_when`),
retrieval at spec / task / decision time, recorded dispositions (applied / adapted / rejected-with-reason), feedback to
the pattern, rot detection and a reinvention-rate metric, so a new project *fits* past learnings instead of re-deriving
them. Nothing in the live `tins-kit/` was edited (AGENTS.md §6); a working copy for edits is `_external/tins-kit-next/`.

**The finding worth keeping.** Documentation cost in this project was reading (re-reading a 4,500-line log and three
numbering systems every session), then verifying/repairing drift, and only last writing. Routing the *writing* to a
cheaper model saves the smallest slice and risks the *why* of a record. The cheap levers are per-record files, a
generated index, a context-pack script and validators that check records without a model.

**Kit-growth candidates (`AGENTS.md` §6):** (a) typed, one-file-per-record memory with a schema and a wider gate than
`docs-guardian`'s keyword check; (b) role→model routing as a second tier axis beside T0–T2, with an adapter interface
so the five modes become presets; (c) `orchestrate.mjs` accepting a per-task prompt file (this project stayed
hand-relayed with a scriptable Cline CLI because it could not); (d) ledger columns for model and cost; (e) `tins-kit/`
and `delegation/` being gitignored, so a second machine or harness lacks the kit prompts and the ledger.; (f) a per-session ledger with git-derived
facts, a `scripts/ledger.mjs open|close` pair and a branch-needs-an-entry validator check.

**Corrected here.** `delegation/README.md` said the kit has "six execution modes"; the kit's own prompt says five
(`solo`, `auditor-local`, `auditor-remote`, `self-parallel`, `external`). `delegation/` is gitignored, so the fix is
local only.

**Not done — said plainly.** Nothing is piloted. The drafts assert a design from one consumer's experience;
`role-routed-records.md` §3 names the measurement that would confirm or kill it. The outside tools named there
(Aider architect/editor, Cline Plan/Act models, the `AGENTS.md` convention) were checked by search, not run, and their
flags and support change often.

**Round 1B / round 2 outcome (same day).** The kit copy `_external/tins-kit-next/` was updated by seven work packages from the round-1
findings (dispatch rendering a real `PACKET.md`; `session.mjs`; `scan-secrets.mjs`; shared pattern-front-matter parser +
front matter on all 24 patterns + `kit-coverage` v2 + `kit-ingest` fix; proposals lane + `KIT-VERSION` + sync tombstones;
`CORE.md`; `NEXT-VALIDATION.md`) — selftest 185/185 from any directory, `validate --kit` PASS. Round 2 then had three builders
use only the kit to build a focus-queue ticketing assistant, an expense tracker and a mistake-first course pilot
(`docs/kit-growth/rounds/ROUND2-FINDINGS.md`). They independently found defects the round-1 reviewers had not — above all
that **`validate --spec SPEC.md` failed 35 checks on every fresh scaffold** — which were fixed with regression tests.
**Not done, and the most important unrun test:** the parallel-worktree + reconciler path was never exercised (round 2 was
single-writer), and nothing has run in a non-Claude harness. The live `tins-kit/` is untouched; promotion is the owner's call.

**Round 1 outcome — the premise corrected.** Six read-only reviewers (retrieval, ledger/worktrees, harness
portability, kit consistency, red team, economics) challenged the drafts; their reports are
`docs/kit-growth/rounds/round1-*.md`. Two corrections to what this entry and the drafts first claimed: (1) **"documentation
cost is re-reading the 4,500-line log" was wrong** — in the one session measured the log was never read in full (0 `Read`
calls, 56 targeted greps); cost is turns × carried context, reading was ~30% and documentation writing ~6%, and routing
writing to a cheaper model is worth ~2%; (2) **the "#67–#89 numbering hole" was wrong** — the numbering is contiguous
#1–#98 (decision #90 is a retroactive entry). A reviewer's own error is also on record: a parallel reviewer overwrote
`.git/config` line 3 (`filemode = core.autocrlf`) and every git command in the project failed until it was restored to
`filemode = false` — the proposal's own thesis about concurrent agents sharing one `.git`, in miniature.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 98 — Kit-growth candidates drafted: role-routed records, and an audit of the kit's execution modes
