---
id: decision-migration-0012-customers-payments-reversal-requests-noti
solves: Migration 0012: customers/payments/reversal_requests/notifications/user_role_history, and a real co-admin fix
triggers: Migration 0012: customers/payments/reversal_requests/notifications/user_role_history, and a real co-admin fix
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Migration 0012: customers/payments/reversal_requests/notifications/user_role_history, and a real co-admin fix

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 46 — Migration 0012: customers/payments/reversal_requests/notifications/user_role_history, and a real co-admin fix

**What changed.** All five tables SPEC.md §4.2.16–4.2.20 already fully designed, built exactly
to that design — schema only, deliberately: the algorithms on top (recording a payment,
executing an approved reversal per §4.3.11, dispatching a notification) are separate follow-up
RPC work, same split as "migrate the container tables" (0006) vs. "build the container
algorithms" (0007–0010). `user_role_history` maintains itself via a trigger on `users`
insert/update, backfilled once for existing users so nobody shows a gap.

**A real, previously-undiscovered gap, found and fixed, not invented for this migration.**
`users.role`'s CHECK constraint has never included `co-admin` since migration 0001 — D28 locked
it as a real role back in the v2 merge, every RLS policy since decision #37 has assumed it
works, but the constraint itself was never updated. It has been structurally impossible to set
any real user's role to `co-admin` in this database this whole time. Found while adding
`users.can_self_reverse` for this same migration (touching users-adjacent schema surfaced it),
fixed alongside — the constraint, and `handle_new_user()` (migration 0002), which independently
rejected `co-admin` in signup metadata and would have kept the gap open even after the
constraint allowed it directly.

**A second, unrelated finding, surfaced by the test rather than assumed away.** Verifying
notifications' owner-only RLS turned up two rows per demo email in `public.users` — a real
account (matching `auth.users`, what `auth.uid()` resolves to) and a fixed-placeholder-UUID
leftover from the original Mode A raw-SQL seed, with no matching `auth.users` row at all. The
fake rep row is referenced by 50 `sales.sold_by` rows (the original demo dataset's fixtures).
Pre-existing, not introduced by this migration, and harmless to real app behavior — nothing in
the shipped app resolves identity by email lookup, everything correctly uses `auth.uid()`. The
test script itself had done exactly that (an email lookup that silently picked the wrong of two
matching rows) — fixed by decoding the real id straight from the signed-in JWT instead, the same
way the app itself resolves identity. Not cleaned up in the database itself: doing so means
either deleting the fake rows (blocked by `sales.sold_by ON DELETE RESTRICT` while those 50
historical demo sales reference them) or re-pointing 50 fixture rows to the real ids — a real,
separate data-migration task on fake/demo content, not something this migration's scope called
for. Flagged in `HANDOVER.md`'s gotchas so a future session doesn't hit the same trap blind.

**Verified live, 23 assertions**, not just applied: promoted a temporary real auth user to
`co-admin` (impossible before this migration) and confirmed `user_role_history`'s trigger
correctly closed the old role row and opened a new one; signed in *as* that newly-promoted user
and confirmed an admin/co-admin-gated RLS action (a `containers` UPDATE) actually succeeds for
them and correctly still fails for a plain worker — proving `co-admin` is genuinely treated as
admin-equivalent by RLS, not just accepted by the constraint. Also covers: `customers`' broader
insert/update policy (vendor-rep allowed, unlike `vendors`) vs. worker correctly rejected;
`payments` is append-only and its `amount > 0` CHECK holds; `reversal_requests`' request/approve
split (a vendor-rep cannot approve their own request, admin can); `notifications`' owner-only
visibility (confirmed both that the owner sees/can-mark-read their own, and that a different
user cannot see it at all); `user_role_history`'s admin-only read.

**When this changes.** The payment-recording, reversal-execution, and notification-dispatch
RPCs are the natural next algorithms layer, once needed — none built yet, deliberately. GST
field activation (`customers.is_gst_registered`/`gstin` now exist) is the next queued step per
the user's own sequencing. `notifications.type`'s taxonomy (§F) still needs reading in full
before any dispatch logic enforces it.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 46 — Migration 0012: customers/payments/reversal_requests/notifications/user_role_history, and a real co-admin fix
