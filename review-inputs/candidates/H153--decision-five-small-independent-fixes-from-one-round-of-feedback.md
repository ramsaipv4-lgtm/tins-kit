---
id: decision-five-small-independent-fixes-from-one-round-of-feedback
solves: five small, independent fixes from one round of feedback
triggers: five small, independent fixes from one round of feedback
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# five small, independent fixes from one round of feedback

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 82 — five small, independent fixes from one round of feedback

**can_self_reverse restricted to admin/co-admin, for real.** The user's own words: "needs to be
with co-admin, admin only not with any other role." Checked live data before writing the
constraint, not assumed clean — found one real violation (Anitha, vendor-rep, `true` from
earlier demo seeding), reset it, then added a BEFORE trigger (`clamp_can_self_reverse`) that
auto-clears the flag the instant a role change would leave it true on a non-admin/co-admin row,
plus a CHECK constraint as a hard backstop behind the trigger (same defense-in-depth shape as
this project's RLS+RPC dual role checks elsewhere). Exposed as a checkbox in
`TeamManagement.tsx` for the first time — closes the gap flagged two rounds ago when the user
asked what this flag even was — visible only when editing an admin/co-admin (the trigger would
silently no-op it for anyone else, so showing it there would just be confusing).

**Task completion now notifies the assignee.** A new `notify_user()` — the single-recipient
sibling `notify_admins()` (migration 0018) never had — fires from a new trigger on `tasks`
(`AFTER UPDATE OF status ... WHEN status = 'completed'`), catching both completion paths at once
(`auto_complete_task`'s RPC-driven update, and `MyTasks.tsx`'s own plain update for `custom`
tasks) without duplicating a notify call in two places that could drift apart later.

**containers.ownership**, per the user's own preference over their floated QR-sticker rethink
("i like your ownership tag idea better") — `owned`/`vendor_provided`/`given_to_buyer`, wired
into `record_container_fill`'s existing inline container-creation path (still the only place a
container is ever created) and exposed in `PackContainerForm.tsx`. **Caught before shipping**:
`record_container_fill` has been live at its 5-parameter signature since migration 0024 — adding
`p_ownership` via a plain `CREATE OR REPLACE` would have created a second overload, the exact
bug class this sprint already hit twice (decisions #73/#77). Explicit `DROP FUNCTION IF EXISTS`
added before the re-creation, this time before it ever shipped rather than after.

**Role display labels rename** — `RoleBadge.tsx`'s label map is now exported as `ROLE_LABELS`
and `TeamManagement.tsx` imports it instead of keeping its own separate array (the exact
duplication flagged as a risk when this was first raised, fixed the moment it mattered rather
than left to drift). `vendor-rep` → "Receiving & sales", `worker` → "Floor staff",
`super-worker` → "Senior floor staff" — describing what each role actually does, not its
database name; the backend strings themselves are completely untouched everywhere else (RPC role
checks, RLS policies, `eligible_roles_for_task_type()`).

**Delivery-time spoilage split out from ordinary spoilage — the data half of a bigger, still-
open question.** The user asked directly whether `confirm_delivery_arrival` should check for
spoilage at all: yes. Split `p_confirmed_kg` into `p_confirmed_good_kg` and
`p_confirmed_spoiled_kg` (superseding migration 0032's single-kg version — `DROP FUNCTION IF
EXISTS` on the exact old 6-param signature first, since this is the same overload-bug class
again, now guarded against on the *first* pass rather than found after). Physical stock lands at
exactly the good share: the batch is updated to the full measured total first (good+spoiled
really arrived), then a genuine `spoilage` movement for the bad share draws it back out through
`apply_movement_to_batches` (migration 0001) — the same trigger every other spoilage event
already uses, so `kg_remaining` never needs computing twice. No new tag column was needed to
keep this distinct from later in-warehouse spoilage: `receiving_confirmations.spoiled_kg` (added
here) *is* "found at receiving" by definition — any other `spoilage` movement with no
`receiving_confirmations` row behind it is unambiguously "found in the warehouse" instead. The
user's own reasoning for wanting this split — delivery-time spoilage is far more likely the
vendor's fault, warehouse-time spoilage the wholesaler's own handling — is exactly right and
matches this design, but the actual *weighting* of the two into a vendor quality score is
deliberately **not** decided here: that rating system doesn't exist yet (same deferred list as
employee performance rating — needs real data and the wholesaler's own numbers first). This
migration only makes sure the data has the right shape to support it later.

**Verified:** `npx tsc --noEmit` clean, `npm run validate` (73/73), `npm run build` clean,
`npm run selftest` (9/9). Migrations 0030-0033 all written and committed, none yet applied.

**Explicitly held for a follow-up, not guessed at:** the WhatsApp-bill-as-image/editable-content
idea and its credit-purchase-deferred-reminder tail, and the "worker's next task is selectable"
mechanic (including what happens if they pick more than one) — both underspecified enough, and
big enough a workflow change, to ask the user directly rather than build blind. See the direct
questions put to the user rather than a locked decision here.

**Cross-reference:** decision #73/#77/#80 (the overload-bug class, caught pre-emptively this
time instead of after); decision #79/D52 (the trigger-for-structural-invariant pattern, now
applied a third time); D47 (why the vendor-quality weighting stays deferred); decision #81/D54
(the receiving-confirmation flow this spoilage split extends).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 82 — five small, independent fixes from one round of feedback
