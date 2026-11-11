---
id: decision-two-warehouses-and-a-real-presentable-demo-dataset-touch
solves: two warehouses, and a real, presentable demo dataset touching every feature
triggers: two warehouses, and a real, presentable demo dataset touching every feature
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# two warehouses, and a real, presentable demo dataset touching every feature

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 74 — two warehouses, and a real, presentable demo dataset touching every feature

**What was built, per the user's explicit request.** Two warehouses now exist: the original
`main` warehouse, renamed `Demo Warehouse (feature showcase)` (its display name only — nothing
about its id/data changed), and a new `real-operations` warehouse (`Real Operations (rename me)`
— a clear placeholder, one `kind='warehouse'` location, per §8.15a's own rule for a real
deployment) reserved for the client's actual imported data, not yet populated. This is also the
first time this project has ever had a genuine second warehouse — the cross-warehouse transfer
path (D23, dormant since nothing existed to transfer between) is now real, not just schema.

**`scripts/seed-demo-showcase.mjs`** populates the Demo Warehouse with real data through every
real RPC (not hand-crafted SQL — the same discipline this whole sprint's live-testing has used),
signed in as the actual demo accounts, touching essentially everything built this sprint: 2
customers (one healthy, one that goes over its credit limit and triggers a real notification), 4
tasks across all types (created *before* the actions that fulfill them, so auto-completion has
something real to demonstrate — including a round-robin assignment, resolved dynamically rather
than assumed, since round-robin could hand `pack_repack` to either the rep or the worker
depending on their current load at creation time), a multi-line bill, a container pack, a
container-sourced sale, a repack, a direct-batch sale with a clean self-approved-and-executed
reversal, a free-text no-customer sale with a reversal left pending for admin review, a partial
customer payment, and a partial vendor payment.

**Two real design decisions made while building this, not incidental:**
- **Which sale to reverse mattered.** The first sale drawn from the packed container was
  deliberately left *unreversed* — `execute_sale_reversal` restores kg to the *original*
  `container_fill_id` a movement references, with no awareness that a later repack moved that
  physical stock elsewhere. Reversing a container-sourced sale after its source fill has been
  repacked away would "resurrect" stock in a container no longer physically holding anything — a
  real latent edge case, deliberately not baked silently into presentable demo data. A separate,
  direct-batch-sourced sale (never touched by any container) was used for the clean reversal
  demo instead.
- **Which sale gets the partial payment mattered too.** Reversing a sale does not currently
  reduce what `customer_credit_status` computes as owed — the view sums `sales.total_amount`
  regardless of `reversal_requests.status`, and a reversal doesn't touch the `sales` row (by
  design, D5's append-only spirit) or insert any offsetting credit. A genuinely real gap once
  reversals see production use, flagged here rather than fixed — fixing it means deciding how a
  reversed sale's financial record *should* be represented, a real design question, not a bug to
  patch blind. The demo's own reversed sale was kept payment-free specifically so this gap
  doesn't show up as a confusing, unexplained balance in the showcase data itself.

**Also found live, mid-seed, and fixed the same session:** decision #73's `record_container_sale`
overload bug.

**Cross-reference:** decision #73 (the overload bug this seeding work found); D23 (multi-
warehouse schema, now genuinely exercised); §8.15a (the real-warehouse location shape); D22/
§4.3.11 (the reversal mechanics the edge case above depends on); `customer_credit_status`
(migration 0013 — the view with the now-flagged reversal gap).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 74 — two warehouses, and a real, presentable demo dataset touching every feature
