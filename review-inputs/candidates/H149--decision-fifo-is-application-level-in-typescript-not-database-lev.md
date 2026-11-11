---
id: decision-fifo-is-application-level-in-typescript-not-database-lev
solves: FIFO is application-level (in TypeScript), not database-level
triggers: FIFO is application-level (in TypeScript), not database-level
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# FIFO is application-level (in TypeScript), not database-level

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 18 — FIFO is application-level (in TypeScript), not database-level

**What changed.** W3 ships the 4 mutation functions in `src/lib/mutations.ts`.
Each does the FIFO read at the application level:

1. Query `batches` for the oldest available (`order by delivered_at asc, id asc`)
   with `kg_remaining > 0` for the requested (sku, location).
2. Insert the right rows: a new batch for delivery/transfer, a sale row for sale,
   just a movement for spoilage.
3. The `apply_movement_to_batches` trigger (decision from 0001_init.sql) updates
   `kg_remaining` for the source batch.

**Why application-level.** The migration's `apply_movement_to_batches` trigger
only handles the single-batch case (one movement, one source batch). Multi-batch
FIFO cascade (a 200 kg sale that needs to draw from 4 batches) was always
specified as application-level (the comment in the migration says: "The cascade
(multi-batch) is application-level"). W3 implements the single-batch fill, which
is what the demo needs.

**The cascade in W3:** `recordSale(input)` finds the oldest batch, deducts up
to its `kg_remaining`, inserts a sale row + 1 movement. If the sale is larger
than the oldest batch's stock, the sale is recorded for the oldest's full
amount and the user is told about the shortfall. They can submit again to draw
from the next-oldest batch.

**Why not a Postgres function.** A `record_sale_cascade(sku, location, kg)` PL/pgSQL
function with `SELECT ... FOR UPDATE` and a loop would be the "right" way — it
would be atomic, race-condition-proof, and handle the multi-batch cascade. But
for the W3 demo (single user on a dev machine, demo data), the application-level
read works fine. Moving to a Postgres function is a Pilot-mode work item.

**Impact on downstream.** W3 has working FIFO for the single-batch case. The
multi-batch cascade is a known limitation documented in `docs/W3-MANUAL-VERIFICATION.md`
under "Known W3 limitations".

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 18 — FIFO is application-level (in TypeScript), not database-level
