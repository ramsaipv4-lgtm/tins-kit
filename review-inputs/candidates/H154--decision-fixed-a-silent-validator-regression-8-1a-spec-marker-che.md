---
id: decision-fixed-a-silent-validator-regression-8-1a-spec-marker-che
solves: Fixed a silent validator regression (§8.1a spec-marker check drifted from the kit)
triggers: Fixed a silent validator regression (§8.1a spec-marker check drifted from the kit)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Fixed a silent validator regression (§8.1a spec-marker check drifted from the kit)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 30 — Fixed a silent validator regression (§8.1a spec-marker check drifted from the kit)

**What was wrong.** `npm run validate` was failing (71 pass, 1 fail) and `npm run selftest`
was failing (8/9), contradicting `HANDOVER.md`'s session-11 claim of "72/72, 9/9 green."
`scripts/validate.mjs`'s `§8.1a` check — explicitly labeled `// Part A — Kit's structural
checks (re-implemented)`, meant to mirror `tins-kit/scripts/validate.mjs`'s own `§8.1a` check
verbatim — required the literal marker `<!-- Jayshankar Specification v1.0 -->`. `SPEC.md`'s
header has read `<!-- TINS Specification v1.0 -->` unchanged since W1 (2026-08-05) and was
never edited to add a project-specific marker; no prior decision here documents intending to
add one. `scripts/selftest.mjs`'s `defectNoSpecMarker()` regression test had the same string
swapped in, so it was silently stripping a marker that was never present and testing nothing.

**Root cause, by file-mtime evidence.** `scripts/validate.mjs` was last modified 2026-08-14
07:56 — after `HANDOVER.md`'s last save (2026-08-14 04:51) that recorded the "72/72" state.
So this string was changed post-hoc, in the same session-11 housekeeping pass, without a
re-run of `npm run validate` afterward and without a decision entry — a direct violation of
this project's own "never let a validator failure through" / "an unrecorded finding is a
finding the next session pays for again" rules. It sat broken for roughly 4 weeks
(2026-08-14 → 2026-09-10, when a routine directory audit caught it — see `AUDIT-2026-09-10.md`
§2 for the full writeup and the exact commands run to verify).

**Fix.** Reverted both files' target string back to `<!-- TINS Specification v1.0 -->`,
matching `SPEC.md`'s actual (unchanged) content and `tins-kit/scripts/validate.mjs` /
`tins-kit/templates/SPEC.md`'s canonical convention. Added an inline comment at the check
site in `validate.mjs` pointing future readers at this decision and the audit doc. Confirmed
green: `npm run validate` → 72 pass, 0 warn, 0 fail. `npm run selftest` → 9/9 pass.

**Why this is the right fix, not the other direction.** The alternative fix — adding
`<!-- Jayshankar Specification v1.0 -->` to `SPEC.md` to satisfy the tightened check — was
considered and rejected. Nothing in this project ever decided a per-project marker was wanted
(no decision entry, no matching template change in `tins-kit/`), and the check's own comment
says it's a re-implementation of the kit's *generic* check, which uses the generic marker.
Treating the validator as the thing that drifted (not the spec) is also consistent with the
mtime evidence: `SPEC.md` never changed; `validate.mjs` did, after the fact, unlogged.

**When this changes.** If a future session genuinely wants a project-specific marker in
addition to the generic TINS one (e.g. to help distinguish Jayshankar's `SPEC.md` from
`tins-kit`'s own when both are open at once), that's a legitimate small spec amendment — but
it should touch `SPEC.md`'s header directly, update `tins-kit`'s own convention docs if it's
meant to become a kit-wide pattern, and get its own decision entry, not land as a silent
validator edit.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 30 — Fixed a silent validator regression (§8.1a spec-marker check drifted from the kit)
