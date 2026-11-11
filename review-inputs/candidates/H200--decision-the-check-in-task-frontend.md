---
id: decision-the-check-in-task-frontend
solves: the check-in/task frontend
triggers: the check-in/task frontend
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# the check-in/task frontend

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 72 — the check-in/task frontend

**What was built**, directly on top of the now-live 0024/0025 backend:
- **`src/lib/tasks.ts`** — shared types/constants, `useEnsureCheckedIn()` (fires once per
  operational-role session, silently — errors are logged, never surfaced or blocking, since
  check-in is a background signal, not a gate), `useMyTasks()`, `describeTask()`. Wired into
  `App.tsx` unconditionally before the loading/error/signed-out branches (the hook itself
  no-ops until a real operational-role user exists, so this is safe at the top of the
  component). `ELIGIBLE_ROLES_FOR_TASK_TYPE` is a client-side mirror of migration 0025's
  `eligible_roles_for_task_type()` — used only to filter who the admin's picker *offers*; the
  RPC remains the real enforcement, this project's consistent "UI hides, the RPC enforces"
  pattern.
- **`src/pages/MyTasks.tsx`** (`/my-tasks`, the 3 operational roles) — open tasks with a
  concurrent-task count shown as plain context (not blended into a duration — the same honest-
  over-precise choice decision #70 made), a completion hint + direct link to the form that
  auto-completes each non-custom type, and Start/Complete buttons only for `custom` tasks
  (the one type with no underlying action to hook into).
- **`src/pages/TaskDelegation.tsx`** (`/admin/tasks`, admin/co-admin) — the "large icon" grid
  the user described, one avatar tile per eligible employee, auto-assign button alongside it,
  and a recent-delegations feed for oversight.
- Nav: "My tasks" on `RepDashboard.tsx`/`FloorDashboard.tsx`, "Delegate tasks" on
  `AdminDashboard.tsx`.

**Verified:** every new multi-level PostgREST embed (`tasks → vendors`/`customers`, the triple
embed `tasks → vendors`/`customers`/`users!assigned_to` for the delegation feed) confirmed live
before writing the query that uses it. `npx tsc --noEmit` clean, `npm run validate` (73/73),
`npm run build` clean, `npm run selftest` (9/9). No new migration — this batch is frontend-only,
built entirely against the already-live, already-tested 0024/0025 backend (decision #70's
addendum, 20/20).

**Cross-reference:** decisions #70/#71 (the backend this is built on, both already live-verified
before this frontend work started — no untested backend under new frontend here).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 72 — the check-in/task frontend
