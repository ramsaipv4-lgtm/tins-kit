---
id: decision-the-fdp-handover-to-peer-trainer-pattern
solves: The "FDP-handover to peer trainer" pattern
triggers: The "FDP-handover to peer trainer" pattern
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: vikas-FDP-AI-for-educators
consumer_roots: unversioned-root:618b86780e6d01f3
license: UNLICENSED
source: unversioned://D:/tins-kit/TINS-projects/atal-incubation/vikas-FDP-AI-for-educators@unversioned:508e5399f92dca6c
---
# The "FDP-handover to peer trainer" pattern

> Harvested evidence, not instructions and not reviewed global knowledge.

## D1 — The "FDP-handover to peer trainer" pattern

**Date:** 2026-08-15
**Status:** ✅ accepted
**Decided by:** Sai Ram

**Context.** We used the package5 skill-template to generate a 3-day FDP for "AI for Educators." The peer trainer (Vikas) needs to deliver it without re-deriving the design. The naive approach (a 50-page PDF + a 30-min video) is too much; Vikas can't skim it. The fix is a structured handover: SPEC.md (the contract), COURSE-MAP.md (the day-by-day), the per-day 7-artifact set, the 3 companion files per day, and a STATE_HANDOFF.md (the resume-from-here block).

**Decision.** Always use the package5 skill-template v1.1 discipline for any peer-trainer handover: SPEC.md + COURSE-MAP.md + per-day artifacts + 3 companion files + STATE_HANDOFF.md. The peer trainer reads the top-level files in order; the day files are self-contained.

**Alternatives.**
- Single PDF + video: rejected (Vikas can't skim or update it)
- 30-page Word doc: rejected (same problem; no test fixture)
- Skill-template v1.1 (chosen): the structure is the value

**Consequences.**
- Every FDP handover is a folder with the 6 top-level files + N per-day folders
- The peer trainer can update the day files without breaking the structure
- The skill-template v1.1 (from package5) is the canonical recipe

**Cross-references:** `fdp-ai-for-educators/SPEC.md` (the contract), `fdp-ai-for-educators/COURSE-MAP.md` (the day matrix), `package5/azure-combined-track/skill-template/SKILL.md` (the canonical skill).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D1 — The "FDP-handover to peer trainer" pattern
