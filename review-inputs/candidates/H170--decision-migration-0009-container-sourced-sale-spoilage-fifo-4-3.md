---
id: decision-migration-0009-container-sourced-sale-spoilage-fifo-4-3
solves: Migration 0009: container-sourced sale/spoilage FIFO (§4.3.8), a real multi-row cascade at last
triggers: Migration 0009: container-sourced sale/spoilage FIFO (§4.3.8), a real multi-row cascade at last
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Migration 0009: container-sourced sale/spoilage FIFO (§4.3.8), a real multi-row cascade at last

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 41 — Migration 0009: container-sourced sale/spoilage FIFO (§4.3.8), a real multi-row cascade at last

**What changed.** `record_container_sale` and `record_container_spoilage` (§4.3.8, D21,
D-amendment §C.2) — the last piece of the container model's core algorithm suite. The most
intricate function this project has, because §4.3.8's prose doesn't fully resolve two real
design questions: a `container_fill` can hold multiple SKUs (§4.2.13), so "how much of SKU S is
left in fill F" isn't `fill.kg_remaining` (the fill's total across everything in it) — it's
derived per (fill, batch) pairing: `container_fill_items.kg` for that pairing minus whatever a
past sale/spoilage already drew from that exact pairing, found via `movements` rows sharing both
`container_fill_id` and `batch_id`. And since real stock right now sits almost entirely in
un-contained `batches` (no delivery flow requires packing yet, no real fill has ever existed
outside test data), a container-only cascade would leave today's actual stock unsellable — so
this is a genuine two-phase cascade: container-tracked stock first (soonest-`expires_at`-first,
the actual point of the feature), falling back to the older direct-batch FIFO
(`delivered_at` ASC) for whatever isn't packed yet, with the fallback excluding whatever portion
of a batch is *currently* sitting inside a container (packed but not yet drawn) — the same
"sum `container_fill_items`, subtract what's already drawn" shape as `record_container_fill`'s
(decision #38) double-allocation guard, applied here in the other direction.

**A deliberate scope upgrade, not a silent behavior change.** Every prior cascade in this
codebase — `record_transfer_cascade` (0005), the client-side `recordSale`/`recordSpoilage` — only
ever draws from ONE batch and reports a shortfall for the rest (decision #18, "W3: single-batch
fill... multi-batch cascade is a Pilot concern"). `SPEC.md` §4.3.2/§4.3.4/§4.3.8 always described
a real multi-row cascade; decision #18 deferred it, it was never rejected. Building the
container-sourced version is the natural point to finally build the real cascade, for both
phases consistently — a container fill split across repacks, or a SKU spread across several
batches, makes single-source shortfalls needlessly common otherwise. This is logged explicitly
so a future session doesn't read the older single-batch functions as the intended long-term
design.

**Verified live, 42 assertions covering the properties that are actually hard to get right, not
just the happy path:** a simple container-sourced sale (with the trigger correctly decrementing
the underlying batch too — §4.3.8's "in parallel... for pricing/lineage" falls out for free from
the existing `apply_movement_to_batches` trigger, no extra code needed since it decrements on
`batch_id` regardless of whether the movement came via the container or direct path); a
multi-fill cascade proven to actually drain the sooner-expiring fill first before touching the
later one; a mixed-SKU fill proven to leave the *other* SKU's portion completely untouched;
a container+direct split within one call proven to draw exactly the packed amount from the
container and exactly the un-packed remainder directly — not the whole batch twice; partial
fulfillment reporting a correct shortfall with the sales row using the fulfilled amount, not the
requested one; zero-stock returning a clean error with no sales row; the sale/spoilage role
split (worker rejected for sale, explicitly allowed for spoilage, matching
`rls-policies.sql` exactly); and a second call after a fill is fully drained correctly finding
nothing left in it rather than re-drawing or going negative. One test assertion was itself wrong
on the first run (checked for zero historical movements on a SKU that turned out to be a real
demo SKU with pre-existing seed-data movements unrelated to the test) — fixed by removing the
overreaching check; the RPC's actual behavior was correct throughout, the test assertion wasn't.

**A known, narrow race condition — flagged, not fixed here.** `record_container_fill` (0007)
reads `batches.kg_remaining` and `container_fill_items` without a `FOR UPDATE` lock; this
migration's direct-fallback phase does lock `batches`. A plain `SELECT` never blocks on another
transaction's lock in Postgres, so two truly concurrent calls — one packing a batch, one selling
from it directly — have a narrow window to race. Not fixed here: closing it means re-editing and
re-testing an already-shipped, already-tested file (0007) for a race that needs two operations on
the exact same batch within milliseconds, on a single-operator, sequential-physical-actions
business. Noted in `HANDOVER.md`'s gotchas rather than silently left undocumented.

**When this changes.** `SaleForm.tsx`/`SpoilageForm.tsx` rewiring to these two RPCs is now a
genuine MiniMax-appropriate task (T7) — pure frontend/application code, no schema risk, same
shape as T6. The C.4 transfer-timestamp fix (§4.3.10) is still queued behind that, unchanged
reasoning from decisions #38–#40.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 41 — Migration 0009: container-sourced sale/spoilage FIFO (§4.3.8), a real multi-row cascade at last
