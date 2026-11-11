---
id: decision-migration-0008-record-repack-rpc-plus-two-real-bugs-foun
solves: Migration 0008: `record_repack` RPC, plus two real bugs found in already-shipped 0007 before either was called done
triggers: Migration 0008: `record_repack` RPC, plus two real bugs found in already-shipped 0007 before either was called done
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Migration 0008: `record_repack` RPC, plus two real bugs found in already-shipped 0007 before either was called done

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 39 — Migration 0008: `record_repack` RPC, plus two real bugs found in already-shipped 0007 before either was called done

**What changed.** `supabase/migrations/0008_record_repack.sql` adds `record_repack(source_fill_id,
destination_container_id)` (§4.3.9, D21, D-amendment §C.3) and `movements.
destination_container_fill_id`. Closes the schema gap flagged in decision #38: §4.3.9 step 5
wants one `movements` row referencing *both* a source and destination `container_fill_id`, but
0006 only added one column. `movements.container_fill_id` keeps its existing "drawn from"
meaning (documented as a §4.2.21 addendum in `SPEC.md`, not silently reinterpreted); the new
column is populated only for `kind='repack'`. Inserts one `movements` row per source
`container_fill_item` (`sku_id`/`batch_id` are `NOT NULL`, same reason sale/spoilage cascades
already work this way), all sharing one `movement_group_id`. Confirmed against the live
`apply_movement_to_batches()` trigger before writing this (not assumed) that `'repack'` is
correctly absent from its decrement list — repack relocates already-packed fish between
containers, it isn't consumption, so `batches.kg_remaining` must stay untouched. `SECURITY
DEFINER` with its own role check, open to every real role (admin/co-admin/vendor-rep/worker/
super-worker) — repack, unlike receiving, is explicitly a worker task per `rls-policies.sql`.
Verified live via `scripts/test-container-repack.mjs` (28 assertions: happy path as the worker
role specifically, empty-source rejection, same-container rejection, destination-capacity
rejection, destination-not-available rejection, anon rejection) — all read back via the secret
key against what's actually persisted (`filled_at`/`expires_at` copied byte-for-byte from the
source, `container_fill_items` copied, `batches.kg_remaining` provably untouched), not the RPC's
own report.

**A second double-allocation bug, found by the repack test's own setup, not invented.**
`record_container_fill` (0007) validates a new pack request against `batches.kg_remaining` alone
— but packing doesn't decrement that column (packing isn't consumption; §4.3.8 decrements it
later, at container-sourced sale/spoilage time). That means the same physical fish could be
packed into two separate containers across two separate calls, each validating independently
against the same static, never-decremented number. Fixed by summing `container_fill_items.kg`
per batch (immutable and additive, so the sum is exactly "how much of this batch has already
been committed to a container") and using `LEAST(kg_remaining, kg − already_packed)` as the real
ceiling. Covered by 2 new assertions in `test-container-fill.mjs` (reject 5kg when only 4kg is
truly unpacked; accept exactly 4kg).

**A third bug, layered on the second, found only once the repack test actually ran against real
repacked data.** `record_repack` correctly *copies* `container_fill_items` onto its destination
fill (§4.3.9 step 3) — but the guard above, summing across *all* fills for a batch
unconditionally, then counts that same kg twice: once on the source fill (now empty, but its
`container_fill_items` row is never deleted — immutable, per RLS design) and once on the copy.
`container_fills.is_repack_copy` (boolean, default `false`) marks which fills are relocations
rather than fresh draws from a batch; the guard now excludes them. This is the kind of bug that
`AGENT-BRIEF.md` warned about generically ("easiest thing to get subtly wrong") turning out to be
concretely true across two *different* interacting functions, not just the one it was written
about — worth remembering as a general lesson: a guard clause tested in isolation can still be
wrong once a second feature (repack) creates data the guard wasn't written with in mind. Caught
before any real usage, by the test's own setup needing a second fill to exist.

**A file-ordering bug, caught by the user asking a plain process question, not by a test.** The
fix above was first written with `is_repack_copy` declared in 0008 (where it's *set*) rather than
0007 (where it's *read*). Migrations run in filename order on a fresh database — 0007 executes
before 0008 — so a from-scratch install would have broken at migration 7 of 8 with "column
`is_repack_copy` does not exist" the first time anyone packed a container. The user's question —
"when setting up a new database I just run these in sequence, right, not like now out of order" —
is what surfaced it; re-read both files against that exact scenario and moved the column
declaration into 0007, leaving 0008 to only set its value. No live re-run was needed for the
already-applied database (the column exists either way; `IF NOT EXISTS` doesn't care which file
declared it) — this was a source-file-only fix, verified by re-running both test scripts
afterward (16/16 and 28/28) to confirm the reshuffle didn't change live behavior.

**Re-run history for 0007, for the record, since it was live-patched three times in one day:**
(1) original version, capacity-check `format()` used printf-style `%.3f`/`%.2f` — Postgres
`format()` doesn't support that, fixed via `round()` + `%s`; (2) added the double-allocation
guard described above; (3) moved `is_repack_copy`'s declaration into this file for correct
fresh-install ordering. Each re-run was `CREATE OR REPLACE FUNCTION` / `ADD COLUMN IF NOT
EXISTS` — safe, idempotent, no data at stake yet (pre-launch, no real fills exist). Worth this
much narration specifically because "how many times did this change and why" is exactly what a
future session — or a fresh-install debugging session — needs to reconstruct without re-deriving
it from git history.

**When this changes.** The worker gets real delegated work again now: wiring `SaleForm.tsx`/
`SpoilageForm.tsx` to the container-aware RPCs, and a new repack UI screen, is genuine
frontend/application code with no schema risk — the next MiniMax-appropriate task. The C.4
transfer-timestamp fix (§4.3.10) is still queued behind that, for the same reason as decision
#38: no live 2-warehouse scenario exists to test it against yet.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 39 — Migration 0008: `record_repack` RPC, plus two real bugs found in already-shipped 0007 before either was called done
