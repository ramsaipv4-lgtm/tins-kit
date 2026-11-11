---
id: decision-transfer-moved-to-a-security-definer-postgres-function
solves: Transfer moved to a SECURITY DEFINER Postgres function
triggers: Transfer moved to a SECURITY DEFINER Postgres function
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Transfer moved to a SECURITY DEFINER Postgres function

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 23 — Transfer moved to a SECURITY DEFINER Postgres function

**What changed.** W3 first try surfaced a RLS bug: a worker trying to record
a transfer hits `new row violates row-level security policy for table "batches"`
because the destination batch insert is denied (the `batches_insert_rep` policy
only allows admin/vendor-rep/super-worker). The fix is a SECURITY DEFINER
function `record_transfer_cascade(sku, from_loc, to_loc, kg, notes)` in
migration `0005_record_transfer_cascade.sql`. The function bypasses RLS
(runs as the function owner, `postgres`), so any authenticated caller can
record a transfer. The function is also the right place for the FIFO +
2-insert atomicity, so it uses `SELECT ... FOR UPDATE` to serialise
concurrent transfers of the same source batch (decision 19's planned fix,
pulled forward).

**The fix in src.**
- `src/lib/mutations.ts` — `recordTransfer` now calls
  `supabase.rpc('record_transfer_cascade', { p_sku_id, p_from_location_id, p_to_location_id, p_kg, p_notes })`.
  The function returns `{ destination_batch_id, movement_group_id, shortfall, error? }`.
- `src/components/RecentActivity.tsx` — `locName` now uses `display_name ?? name`
  so the activity table shows the same label the LocationSelect dropdown shows
  (consistency fix — the user noted that the dropdown said "Storage (main cold
  room)" but the activity table said "Storage").

**The migration.** `0005_record_transfer_cascade.sql` is additive (no reset).
The function body:
1. `SELECT ... FOR UPDATE` on the oldest source batch — serialises with any
   other transfer/sale/spoilage that might pick the same source.
2. Inserts a new destination batch carrying over `vendor_id` and `price_per_kg_paid`
   from the source (so the cost lineage is preserved).
3. Inserts a `transfer` movement (the existing `apply_movement_to_batches` trigger
   decrements source.kg_remaining atomically).
4. Returns the new batch id, movement group id, and any shortfall.

GRANT EXECUTE on the function to `authenticated` so workers and vendor-reps
can call it. RLS on the underlying tables is unchanged (still applies to
direct queries).

**Why this is the right home, not the validator.** The validator got a new
check `js-record-transfer-cascade` that greps for the function definition
(so a future contributor can't remove it without failing the gate). The actual
work — RLS bypass + atomic FIFO — happens in Postgres, not the React code.
This is the difference between "the validator checks we have the right
primitives" and "the validator does the work."

**Impact on downstream.** W3 transfer now works for all roles. The Pilot
checklist (decision 19) moves closer to zero: the FIFO read with FOR UPDATE
that the function does is the Pilot-grade race-condition protection. The
multi-batch cascade (a sale of 200 kg that spans 4 batches) is still the
next W item — that one needs a `record_sale_cascade` sibling function.

**Kit-level implication.** The pattern "RLS denies an insert the app needs to
make, so wrap it in a SECURITY DEFINER function" is now the kit's recommended
move. The supabase-auth-trigger pattern should grow a sibling
`lib/patterns/postgres-mutations.md` that documents this for future
consumers.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 23 — Transfer moved to a SECURITY DEFINER Postgres function
