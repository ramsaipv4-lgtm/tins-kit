---
id: decision-second-delegated-task-t2-admindashboard-tsx-location-dis
solves: Second delegated task (T2): `AdminDashboard.tsx` location display name, via MiniMax M3
triggers: Second delegated task (T2): `AdminDashboard.tsx` location display name, via MiniMax M3
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Second delegated task (T2): `AdminDashboard.tsx` location display name, via MiniMax M3

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 33 — Second delegated task (T2): `AdminDashboard.tsx` location display name, via MiniMax M3

**What changed.** Same fix as decision #31 (T1), applied to the one remaining file with the old
`locations` query pattern: `src/pages/AdminDashboard.tsx`'s `Location` interface and query now
select `display_name`, matching `RecentActivity.tsx`/`FloorDashboard.tsx`/`StockBySku.tsx`/
`FormFields.tsx`. Two lines, one file. Unlike T1, this has **no visible effect today** —
`AdminDashboard.tsx` never renders a location's name, only a count — it's preventative: the next
feature that does render one here won't silently inherit the bug T1 fixed elsewhere. The brief
said this plainly up front so it wasn't mistaken for a missed visual check.

**Who built it.** MiniMax M3 again (`delegation/tasks/T2-admin-location-display-name/`), audited
and integrated by Claude the same way as T1 — independent `npm install` + re-run of
validate/build/typecheck rather than trusting the self-report. Everything matched; no
discrepancies found this round.

**Status of the `display_name` rollout.** Complete — `grep` confirms all 5 files in `src/` that
query the `locations` table now select `display_name`. This specific bug shape (a query missing a
column the UI needs) is fully closed out across the codebase.

**When this changes.** N/A — this one's done. See decision #31 for the related, separately-tracked
`FloorDashboard.tsx` Expires-column bug (T3, queued, different root cause) and the deferred
contrast-checker task (T4, queued).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 33 — Second delegated task (T2): `AdminDashboard.tsx` location display name, via MiniMax M3
