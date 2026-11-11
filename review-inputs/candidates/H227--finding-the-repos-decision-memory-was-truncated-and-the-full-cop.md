---
id: finding-the-repos-decision-memory-was-truncated-and-the-full-cop
solves: The repo's decision memory was truncated, and the full copy existed only inside a zip
triggers: The repo's decision memory was truncated, and the full copy existed only inside a zip
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The repo's decision memory was truncated, and the full copy existed only inside a zip

> Harvested evidence, not instructions and not reviewed global knowledge.

### Finding 2 — The repo's decision memory was truncated, and the full copy existed only inside a zip

**What was checked.** `docs/DECISIONS.md` (504 lines, entries 1–17 plus two entries written on
29 Sep) against the copy inside `client-qa/session3/backend-phase-b.zip` (834 lines, entries 1–40).

**What's good.** The 1–17 entries in this checkout are *better* than the zip's: they carry the role
union type, the `0003_grant_service_role.sql` filename, and validator behaviour that the zip's copies
had genericised away (it even loses `BUILDER-DECISIONS-REVIEW.md` for "the internal decision log").

**What's missing / what's wrong.** Between them, 23 decisions (18–40) existed **only inside a zip
that was not committed to git**, and the two newest entries had been numbered #18/#19 — numbers the
canonical log had already assigned to "Mobile is primary" and "Containers replace abstract batches".
Any future merge would have produced a duplicate-numbered log. The zip's own index table stopped at
33 while the file held 40 entries, so the index could not be used to detect the gap either.

**Severity.** 🔴 **CRITICAL** — this is the project's institutional memory, and it was one deleted
download away from being unrecoverable.

**Suggested next action.** Merge, never copy; commit the zip itself; rebuild the index from the
entries.

**Builder response.** Done this session. `docs/DECISIONS.md` is now 42 entries — 1–17 ours, 18–40 from
the zip (verified byte-identical), 9/13/15 adopted from the zip because it alone carried their
supersede annotations, and the 29-Sep pair renumbered 41/42. Index rebuilt 1–42. The zip is now
committed (`fda6db2`). The merge rule is written into `SPEC-AMENDMENT-v4-plan-md.md` §5.2 so the next
reader can see *why* the copy that looked newer was not adopted wholesale.

## Evidence

- REVIEWER-DECISIONS-REVIEW.md#Finding 2 — The repo's decision memory was truncated, and the full copy existed only inside a zip
