---
id: decision-migration-0011-custom-container-sizes-a-real-delete-poli
solves: Migration 0011: custom container sizes + a real DELETE policy (D32)
triggers: Migration 0011: custom container sizes + a real DELETE policy (D32)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Migration 0011: custom container sizes + a real DELETE policy (D32)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 44 — Migration 0011: custom container sizes + a real DELETE policy (D32)

**What changed.** `containers.capacity_kg`'s CHECK constraint relaxed from the fixed 5 presets
to `> 0` (custom sizes), and a DELETE RLS policy (admin/co-admin) added — previously none
existed at all, so deletion was impossible for every container, including ones that were never
filled. The actual delete-*prevention* rule the user asked for ("since we put fish in it, we
shouldn't be able to delete it") needed **no schema change** — `container_fills.container_id`
has been `ON DELETE RESTRICT` since migration 0006, it just had nothing to protect against since
DELETE was already blocked entirely. Resolves D32 (SPEC.md, logged alongside this) and the
"box/container quantities" item `SPEC.md`'s closing §D flagged as open: quantities turn out to
be wholesaler-entered data (a bulk-register convenience over individually-numbered containers),
not a fixed spec fact.

**Verified live, not just applied.** User reported Supabase's SQL Editor flagged the migration's
`DROP CONSTRAINT` as a "destructive operation" — correctly identified as Supabase's standard
confirmation dialog for any constraint drop (same class of caution the editor shows for
migration 0006's `movements_kind_check` swap, which ran fine), not a real block. Confirmed
applied via direct probe (inserting `capacity_kg=12`, a non-preset value, succeeded) and the
actual point of the migration confirmed live under real RLS, not just the secret key: a
never-filled container deletes cleanly for admin; a container with any fill history is rejected
with a real `23503` FK violation (`"Key is still referenced from table container_fills"`), not a
silent no-op or an app-level check that could drift from the database's actual guarantee.

**Cross-reference:** SPEC.md D32, `supabase/migrations/0011_container_custom_sizes.sql`.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 44 — Migration 0011: custom container sizes + a real DELETE policy (D32)
