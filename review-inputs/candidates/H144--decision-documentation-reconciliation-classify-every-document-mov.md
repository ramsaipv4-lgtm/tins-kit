---
id: decision-documentation-reconciliation-classify-every-document-mov
solves: Documentation reconciliation: classify every document, move what is superseded, keep what is the owner's
triggers: Documentation reconciliation: classify every document, move what is superseded, keep what is the owner's
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Documentation reconciliation: classify every document, move what is superseded, keep what is the owner's

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 94 — Documentation reconciliation: classify every document, move what is superseded, keep what is the owner's

**What changed.** Every project `.md` outside `tins-kit/`, `archive/`, `_external/`, `delegation/` and the generated
`hyperframes-video/` scaffolds (about 80 files) was read, compared against `SPEC.md` and the code, and classified.
**No application code, `package.json`, migration or locked `SPEC.md` §0.2 row was changed.**

*Moved to `docs/deprecated/` with `git mv`* (index and old-path → new-path table: `docs/deprecated/README.md`):
`SPEC-AMENDMENT-v2.md` (merged); `AGENT-BRIEF.md` (executed); `AUDIT-2026-09-10.md` (snapshot; gitignored, so moved on
disk only); `client-qa/session3/plan.defered-flutter.md` (superseded by the rebased `plan.md`); `docs/recommendations/`
(10 files); `docs/competitive-audit-2026-09-16.md` and `docs/design-sample/` (8.9 MB); the W2–W5 manual checklists and
`W3-DIAGNOSTIC.md`; and, **verbatim**, `HANDOVER.md`'s per-session diary (~560 lines) and the 2026-09-16
`NEXT-AGENT-ONBOARDING.md`.

*Rewritten or corrected in place:* `README.md` (still described Mode A), `docs/ARCHITECTURE.md` (said `BrowserRouter`,
nine tables, two locations, three roles, "no CRM"), `NEXT-AGENT-ONBOARDING.md` (stale snapshot sections dropped,
evergreen ones kept), `docs/CONTRIBUTING.md`, `HANDOVER.md` (back to the kit's shape; the duplicated W3 entry, the
unmarked W4 and the stale iOS/offline gotchas fixed; W12 and a carried-forward backlog added), `AGENTS.md` (read list,
numbering table, documentation standard), `docs/BACKEND-PHASE-B-STATUS.md` (a verbatim-duplicated §9 block removed),
`docs/BACKEND-REQUIREMENTS-phase-b.md` (its "nothing implemented" status line was false) and `SPEC.md` §0.3 ("Not yet
built") plus a new **§0.2c supersession map**, which adds no decision.

*Kept live, with status banners:* both amendments, `client-qa/` (new index `client-qa/README.md`; stale status lines
corrected on five files).

**What the comparison found** (beyond the staleness): (1) **Amendment v3 and the Phase B migrations disagree** about
blind receiving — v3's `procurement_mode` toggle, `receiving-storage` role and `procurement_trip` task appear in none of
the 46 migrations, while Phase B built `procurement`/`truck_loads` and a `receiving_blind` flag with "no sixth role", and
neither document mentions the other. v4 contradicts itself on the same point. Recorded, **not resolved** (`HANDOVER.md`
W12). (2) `docs/recommendations/` proposed migrations `0040`–`0050` that collide with the real `0037`–`0046`.
(3) `client-qa/feature-comparison.md` proposes a second "D63–D65" that collides with v3. (4) D6, D9 and D13 are still
`LOCKED` although D30, D29 and D18 supersede them; `SPEC.md` §2.1's route map is Mode A history; three documents the
spec cites (`docs/OFFLINE-WRITE-QUEUE.md`, `ROADMAP.md`, `scripts/import-legacy.mjs`) were never written. (5) The offline
write queue (D30, §8.16) is **decided and unbuilt**; `plan.md` and the code agree. (6) The live project's audit trail
covers 8 of 24 tables until `0037` is applied.

**Why.** The owner reported that some sessions built without understanding the methodology. The pattern in the
documents matches it: each session left a snapshot instead of updating the canonical file, so by now five documents
each claimed to be "the" onboarding file and a sixth (`HANDOVER.md`) had grown a 560-line diary above its real
brief. The kit's own shape — one orientation file, one state file, one decision log — was restored by moving, not
deleting, so no history is lost.

**What was deliberately NOT done.**
- **No amendment was merged, retired or rewritten.** The owner said the amendments are their way of listing intended
  changes. v3's header was not edited either — a verified status block was *added above* it.
- **No choice between v3 and Phase B.** That is a design decision (the owner chose "record only").
- **D6/D9/D13 were not re-marked.** Editing a locked row is *Ask first*; `SPEC.md` §0.2c records the supersession
  beside the table instead.
- **Old paths inside applied migrations and code comments were not edited** (SPEC D2). `docs/deprecated/README.md`
  lists each stale reference and where it now points.
- **`client-qa/` was not tidied.** Its open questions are the owner's; only wrong status lines were corrected.
- **The 5 `scripts/capture-*.mjs`** still write to the old `docs/design-sample/` path. They are research tooling
  with no consumer; left as found and noted in the deprecated README.
- **Not read in full, and so not independently verified:** `docs/SCHEMA.md` (1,102 lines, generated),
  `docs/API-REFERENCE.md`, `SUPABASE-SETUP.md`, `DEPLOY-*`, `REVIEW-BUILD.md`, `LOOKER-STUDIO-SETUP.md`, and the
  bodies of `docs/deprecated/recommendations/01–09`. They were classified from their headers and status lines; none
  was moved on that basis except the recommendations, whose collision with Phase B was checked against the migration
  list.

**Impact on downstream.** A new session now meets one orientation file (`AGENTS.md`), one hand-off file
(`NEXT-AGENT-ONBOARDING.md`), one state file in the kit's shape (`HANDOVER.md`), and a `docs/deprecated/README.md` that
explains every retired file. `npm run validate`, `selftest` and the tooling gate are unchanged and green.

**Kit-growth candidates (`AGENTS.md` §6):** (a) the kit's `templates/HANDOVER.md` should say where a per-session diary
goes (the decision log, or a `docs/history/` file) — here it accreted inside the state file for six weeks; (b) a kit
check that **a document may not be moved without a `docs/deprecated/` row** would have caught the five competing
"start here" files; (c) a kit rule for **how to supersede a locked `D` row without editing it** — the supersession map
in `SPEC.md` §0.2c is the improvised answer, and it should be a template section.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 94 — Documentation reconciliation: classify every document, move what is superseded, keep what is the owner's
