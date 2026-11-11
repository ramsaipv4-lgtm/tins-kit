---
id: decision-no-race-condition-protection-in-w3-pilot-fix-postgres-fu
solves: No race-condition protection in W3 (Pilot fix: Postgres function with FOR UPDATE)
triggers: No race-condition protection in W3 (Pilot fix: Postgres function with FOR UPDATE)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# No race-condition protection in W3 (Pilot fix: Postgres function with FOR UPDATE)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 19 — No race-condition protection in W3 (Pilot fix: Postgres function with FOR UPDATE)

**What changed.** The mutations in `src/lib/mutations.ts` do a `select` then an
`insert` without any locking. Two concurrent operations on the same (sku, location)
might both read the same oldest batch and both try to deduct from it. The trigger's
`kg_remaining = kg_remaining - new.kg` then races; one operation could end up
"selling" more kg than existed in the source batch.

**Why no fix in W3.** The demo runs on a dev machine with a single user. Race
conditions can't happen with one user clicking forms one at a time. The Pilot
mode has multiple users on the floor simultaneously (workers recording spoilage
while a rep records a sale) — that's when race conditions become real.

**The fix (Pilot work item).** Move the FIFO + insert into a Postgres function
that does:
```sql
select * from batches where ... for update;  -- lock
insert into sales ...;
insert into movements ...;
```
The `FOR UPDATE` lock is released at end of transaction. Two concurrent calls
serialise. Multi-batch cascade falls out of this naturally (loop until sale is
filled, insert N movements).

**Impact on downstream.** The W3 demo works. Pilot/Production needs the
Postgres function — the RLS works (decision 16) but the FIFO algorithm is
not concurrency-safe at the application level. Documented in the W3 manual
verification doc.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 19 — No race-condition protection in W3 (Pilot fix: Postgres function with FOR UPDATE)
