---
id: decision-idempotency-on-movements-is-enforced-by-an-idempotency-g
solves: Idempotency on `movements` is enforced by an idempotency guard, not by a unique constraint
triggers: Idempotency on `movements` is enforced by an idempotency guard, not by a unique constraint
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Idempotency on `movements` is enforced by an idempotency guard, not by a unique constraint

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 3 — Idempotency on `movements` is enforced by an idempotency guard, not by a unique constraint

**What changed.** `movements` has no natural unique key (a `movement_group_id` groups cascaded
movements, but two spoilage events at the same time on the same SKU are valid). Adding a unique
constraint would over-constrain. Instead, the seed uses a top-level `do $$ … if (select count…)
>= 25 then return; end $$;` guard, and the 5+ static `INSERT … ON CONFLICT (col) DO NOTHING`
clauses cover the `users`, `vendors`, `skus`, `locations`, and `price_history` tables.

**Why.** The cleanest way to make `movements` and `batches` idempotent is the guard, not the
constraint. A second seed run finds the SKUs already populated and exits. This matches the
exam-forge pattern (an idempotency `INSERT` with `WHERE NOT EXISTS`).

**Impact on downstream.** Re-running the seed on a partially-seeded DB (e.g. vendors in but no
movements) will re-execute the movement loops and try to insert duplicate batches. The `batches`
table has no unique constraint on the (sku, location, delivered_at) tuple — per SPEC §4.2.5 — so
duplicates would be created. Mitigation: the guard checks `skus` count; if the user has run the
movement loops at all, the SKU count is 25 and the guard fires. The "partial seed" case is not
expected in the W1 demo flow.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 3 — Idempotency on `movements` is enforced by an idempotency guard, not by a unique constraint
