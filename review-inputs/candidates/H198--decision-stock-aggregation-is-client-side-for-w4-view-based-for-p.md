---
id: decision-stock-aggregation-is-client-side-for-w4-view-based-for-p
solves: Stock aggregation is client-side for W4, view-based for Pilot
triggers: Stock aggregation is client-side for W4, view-based for Pilot
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Stock aggregation is client-side for W4, view-based for Pilot

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 24 — Stock aggregation is client-side for W4, view-based for Pilot

**What changed.** W4 ships `src/components/StockBySku.tsx` which fetches all
`batches` with `kg_remaining > 0` plus all `skus` and `locations`, then
aggregates in JavaScript: groups by `sku_id`, sums `kg_remaining`, breaks
down by `location_id`. The result is sorted low-stock-first (SKUs where
total < `low_stock_threshold_kg` come first), then by total kg ascending.
Rows below threshold get an amber background highlight; an amber banner
at the top counts how many are below threshold.

**Why client-side for W4.** The demo has ~130 batches across 25 SKUs.
JS-side aggregation of 130 rows is instantaneous (<10ms on a 2021 Android
target). The decision defers the Postgres view to Pilot because:
- W4 is read-only, single-user, single-store
- Writing the SQL view + adding a SECURITY DEFINER function is 1-2 hours
  of work that doesn't pay off at 130 rows
- The §8.6 performance target only matters when the dataset grows

**When to switch to a Postgres view.** A useful rule of thumb: when the
sum-of-kg_remaining query takes >200ms in DevTools Network, move the
aggregation to a view. For a single store with 130-500 batches, client-side
is fine. For multi-store with 5K+ batches, view-based is required.

**The Pilot view would look like:**
```sql
create view public.stock_by_sku as
select
  s.id as sku_id, s.english_name, s.code, s.low_stock_threshold_kg,
  coalesce(sum(b.kg_remaining), 0) as total_kg,
  count(b.id) as batch_count
from public.skus s
left join public.batches b on b.sku_id = s.id and b.kg_remaining > 0
where s.active
group by s.id;
```
Then `StockBySku` calls `supabase.from('stock_by_sku').select('*')` and
the JS just renders. Decision deferred because W4 ships a working demo.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 24 — Stock aggregation is client-side for W4, view-based for Pilot
