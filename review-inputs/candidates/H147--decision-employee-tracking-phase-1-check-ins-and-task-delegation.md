---
id: decision-employee-tracking-phase-1-check-ins-and-task-delegation
solves: employee tracking phase 1: check-ins and task delegation, backend only
triggers: employee tracking phase 1: check-ins and task delegation, backend only
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# employee tracking phase 1: check-ins and task delegation, backend only

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 70 — employee tracking phase 1: check-ins and task delegation, backend only

**A real design conversation, not a guess, before any schema.** The user described a large
system (check-ins, task delegation, automatic performance rating, wage-tier suggestions,
vendor/fish quality tracking, procurement price variability, customer complaints, freshness/
size/age) in one dense pass, with several genuinely open sub-questions flagged by the user's own
words ("not sure...", "propose something"). Organized it back into 8 pieces, stated which were
buildable as-described vs. which needed a real answer, and proposed concrete resolutions for the
open ones (freshness/size/age tracking, cold-chain incident logging, the procurement-price
question probably already being solved by existing data) rather than building any of it on a
guess. Two genuinely blocking unknowns got asked directly: task types (answered: all four —
delivery receiving, customer sales, pack/repack, AND freeform custom — plus a new constraint,
employees can hold several tasks at once) and who sees the wage-tier suggestion (answered:
admin only). This migration covers exactly the two pieces now concrete enough to build:
check-ins and task delegation. Performance rating and wage tiers are a deliberate, named
follow-up — they read from what this migration writes (completion times, kg handled), so
building them before real task data exists would mean tuning against nothing.

**The concurrent-task time problem, resolved by asking what's honest, not what's precise.** The
user surfaced a real gap in their own design: if an employee holds 3 tasks at once, splitting
"actual effort" per task cleanly is impossible without asking them to clock in/out per task —
which breaks the same "no manual action" principle check-ins are built around. Resolved by
choosing honesty over false precision: each task's own wall-clock time (`completed_at -
assigned_at`) is the stored number, and a concurrent-task count is computed at read time as
context alongside it, not blended into a single number. This measures "how promptly did they
clear their queue" — a real, defensible signal on its own — rather than fabricating a
work-attribution split neither this app nor the employee can actually verify.

**What was built, `supabase/migrations/0024_check_ins_and_tasks.sql`:**
- **`check_ins`** — no manual button anywhere, ever. `ensure_checked_in()` (SECURITY DEFINER)
  computes `work_date` in India Standard Time server-side (`now() at time zone 'Asia/Kolkata'`)
  — Postgres defaults to UTC, and a naive UTC day boundary would split a Tamil Nadu workday at
  5:30am IST, not midnight — and writes one row per employee per day, idempotent via `ON
  CONFLICT DO NOTHING`. No client-writable path exists (no INSERT policy at all): a plain client
  insert would let someone backdate their own `work_date` or check in on someone else's behalf.
- **`tasks`** — `type` (`receive_delivery`/`make_sale`/`pack_repack`/`custom`), `assignment_mode`
  (`manual`/`round_robin`), the usual `pending`→`in_progress`/`completed`/`cancelled` lifecycle.
  No uniqueness constraint blocks concurrent open tasks per assignee (confirmed explicitly
  wanted). `create_task()` (admin picks the assignee — the "large icon grid" the user described
  is a frontend concern, not yet built) and `create_task_round_robin()` (picks the
  least-currently-loaded active operational employee — vendor-rep/worker/super-worker, not
  admin/co-admin). **"Round robin" is implemented as least-loaded, not literal cyclic rotation**
  — a deliberate interpretation choice, flagged as such, not hidden: strict rotation would keep
  handing a slow employee the same rate of new work as everyone else, which seems like the wrong
  fairness model here. Easy to swap for literal rotation later if that's actually what's wanted.
- **`auto_complete_task()`** — an internal helper (no direct grant, same pattern as
  `notify_admins`/the cascade helpers — never called except from inside another SECURITY
  DEFINER function), wired into the end of `record_bill_delivery` (`receive_delivery`,
  matched by vendor), `record_container_sale` (`make_sale`, matched by customer),
  `record_container_fill` and `record_repack` (both complete a `pack_repack` task, matched by
  assignee only — packing/repacking isn't tied to one specific vendor or customer). Finds the
  OLDEST matching open task and marks it done — the same FIFO instinct this schema already uses
  everywhere else. `custom` tasks have no underlying action to hook into, so they're completed
  by a plain client `UPDATE` instead (RLS already allows the assignee to update their own task).
  All 4 re-issued functions are fix-forward `CREATE OR REPLACE`s (all 4 were already live), per
  this project's own convention.

**Explicitly NOT in this migration, and not silently forgotten:** the frontend (check-in wiring
into app load, a "my tasks" screen, the admin delegation UI with its large-icon employee picker)
— next concrete step once this migration is verified live. Performance rating (weighted factors
against a peer mean) and wage-tier suggestions (admin-configurable ₹ tiers + a library of
pre-written, if/else-selected reason strings — explicitly NOT an AI-generated summary, per the
user's own instruction) are a separate, later piece.

**Verified:** `npm run validate` (73/73) — this migration can't be syntax-checked against a real
Postgres instance from this environment (no local database), so it was read back function-by-
function for balance (8 functions, 8 matched `$$`/`begin`/`end` pairs, 7 client-facing grants —
`auto_complete_task` correctly has none, matching the internal-helper precedent) — not assumed
correct from a clean `validate` run alone. A full live test (the same discipline every other RPC
in this project has been through) is still pending the user applying it.

**Cross-reference:** the design conversation this session (task types, wage-suggestion audience
both directly asked, not guessed); decision #65/#67's own "ask before inventing schema"
precedent; `notify_admins` (migration 0018, the internal-helper-with-no-grant pattern this
follows); decisions #64/#66 (fix-forward re-issuing of already-live functions).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 70 — employee tracking phase 1: check-ins and task delegation, backend only
