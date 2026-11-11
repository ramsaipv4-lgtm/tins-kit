---
id: decision-third-delegated-task-t3-expires-column-plus-a-real-pre-e
solves: Third delegated task (T3): Expires column, plus a real pre-existing bug found during audit
triggers: Third delegated task (T3): Expires column, plus a real pre-existing bug found during audit
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Third delegated task (T3): Expires column, plus a real pre-existing bug found during audit

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 34 — Third delegated task (T3): Expires column, plus a real pre-existing bug found during audit

**What T3 was supposed to fix, and did.** `FloorDashboard.tsx`'s `skus` query never selected
`shelf_life_hours`, so `expiresAt()` always computed `null` and the Expires column was blank for
every row. MiniMax M3 fixed the one-line `select` clause exactly as specified
(`delegation/tasks/T3-floor-expires-column/`). Its own diff was correct and the gate was green.

**What the audit's visual check found — the diff being correct wasn't enough.** After MiniMax's
fix, the Expires column was *still* blank. Root cause, found by actually investigating rather than
assuming the fix was wrong: `src/components/RecentActivity.tsx` (rendered inside `FloorDashboard`)
has its own `skus` query using the **identical** TanStack Query key, `['skus']`, with a narrower
`select`. TanStack Query dedupes identical keys and shares one cached result across every
component observing that key — RecentActivity's narrower shape was winning, silently starving
`FloorDashboard`'s own query of `shelf_life_hours` no matter what `FloorDashboard`'s code asked
for. This bug pre-dates T3 entirely; it isn't something T3's diff could have caused or MiniMax
could reasonably have been expected to catch from reading `FloorDashboard.tsx` alone.

**How wide this actually goes.** The same `queryKey: ['skus']` is shared, with **three different
`select` shapes**, across 5 files: `FormFields.tsx`, `RecentActivity.tsx`, `AdminDashboard.tsx`,
`FloorDashboard.tsx`, `RepDashboard.tsx`. Checked whether this was live elsewhere, not just
theorized: `AdminDashboard.tsx` also renders `<RecentActivity />` and also needs
`shelf_life_hours` for its own "Shelf life (hrs)" SKU table column — same collision, confirmed via
screenshot that **all 25 SKUs showed `—` there too**, unrelated to today's session, broken since
whenever `RecentActivity` was added next to that table.

**Fix applied (auditor, not MiniMax — same class of bonus fix as decision #31's typecheck
cleanup).** Gave both `FloorDashboard.tsx`'s and `AdminDashboard.tsx`'s own `skus` queries a
distinct key (`['skus', 'floor-dashboard']` / `['skus', 'admin-dashboard']`) instead of the shared
`['skus']`. Minimal and safe: splitting a wrongly-shared cache into independent ones can only make
behavior more correct, never less — the narrower consumers (`RecentActivity`, `FormFields`,
`RepDashboard`) keep working exactly as before, unchanged. Re-verified end to end: gate green
(`validate` 72/0/0, `typecheck` clean, `build`, `selftest` 9/9), the actual network request now
includes `shelf_life_hours` with real values, and both dashboards' screenshots confirm real
values render (Floor: real dates instead of `—`; Admin: real hour counts 8–720 instead of `—`).

**Not fixed — a real architectural follow-up, not a one-line patch.** The same collision risk
still exists structurally for `FormFields.tsx` and `RepDashboard.tsx` — they currently show no
symptom only because their `select` shape happens to match `RecentActivity.tsx`'s, which is a
coincidence, not a guarantee. The generalizable fix (one shared, canonical `useSkus()` hook with a
superset shape, or a hard convention that any component needing non-default columns must use its
own key) is a real design decision affecting multiple files, deliberately left undone here.

**Why this is worth reading closely if you're picking this project up later.** This is the
clearest example yet of why the delegation loop's audit step does an independent visual check
instead of trusting "diff looks right + gate is green": both were true here, and the feature still
didn't work. The failure mode (a shared cache key silently overriding a correct query) is also a
generally useful thing to watch for anywhere this codebase uses `useQuery` with a key also used
elsewhere — worth keeping in mind before adding new shared components.

**When this changes.** Whenever someone decides to do the generalized fix (canonical `useSkus()`
hook, or an enforced per-consumer-key convention) across `FormFields.tsx`/`RepDashboard.tsx` too —
not currently queued as a task, this paragraph is the record that it was found and consciously
deferred.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 34 — Third delegated task (T3): Expires column, plus a real pre-existing bug found during audit
