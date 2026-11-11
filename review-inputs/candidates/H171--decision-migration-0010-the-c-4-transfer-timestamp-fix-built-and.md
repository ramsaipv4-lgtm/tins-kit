---
id: decision-migration-0010-the-c-4-transfer-timestamp-fix-built-and
solves: Migration 0010: the C.4 transfer-timestamp fix — built and tested against a temporary second warehouse
triggers: Migration 0010: the C.4 transfer-timestamp fix — built and tested against a temporary second warehouse
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Migration 0010: the C.4 transfer-timestamp fix — built and tested against a temporary second warehouse

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 43 — Migration 0010: the C.4 transfer-timestamp fix — built and tested against a temporary second warehouse

**What changed.** `record_transfer_cascade` (migration 0005) fixed at last: the destination
batch's freshness timestamp now carries through from the source instead of resetting to `now()`
— `container_fills.filled_at` when the source was container-tracked, or the source batch's own
`delivered_at` otherwise. `SPEC.md`'s prose scopes its example to the container case only; the
same "never reset apparent freshness" principle applies identically to un-contained stock, and
both cases are handled by the same function, so fixing one half and leaving the other broken
would have been an arbitrary, undocumented half-fix of the exact bug class this migration exists
to close — both are fixed. Source selection now *prefers* container-tracked stock, soonest-to-
expire, over an arbitrary older un-contained batch (D21/§2.5a) — without that preference, the
fix would have nothing real to correct, since the old `delivered_at ASC` selection could pick
un-contained stock over expiring container stock even when both exist.

**Two things found while building this, fixed as part of it, not bolted on separately.**
(1) `record_transfer_cascade` has never had an internal role check — harmless under Mode A
(transfer was open to every role), a real gap since D29 restricted transfer to admin/co-admin,
flagged explicitly as a known follow-up back in decision #38. Closed here. (2) Letting transfer
draw from `container_fill_items` at all — the only way to have a `filled_at` to carry through —
makes it a third consumer of container-tracked stock alongside `record_container_sale`/
`record_container_spoilage`. Their "already drawn" / "currently packed" computations (migration
0009) only checked `kind IN ('sale','spoilage')`; without adding `'transfer'` to both filters,
a transfer could silently make container stock double-available to a later sale — a fresh
double-allocation gap this migration would have introduced if shipped without the cross-cutting
fix. Closed via `CREATE OR REPLACE` on both 0009 helpers, in the same migration.

**A deliberate scope decision, documented so it isn't mistaken for an oversight later.** Transfer
stays single-source-draw — one container fill OR one un-contained batch per call — unlike
sale/spoilage's decision #41 upgrade to a full multi-batch cascade. `SPEC.md` §4.3.3's original
text does describe a fuller cascade with weighted-average pricing across multiple sources, which
would be a real, larger scope. Not taken on now because transfer is still dormant (D29 — only
one real warehouse exists) and `HANDOVER.md` already flags the vendor-attribution rule as "one of
three plausible choices... easy to amend," i.e. provisional — building heavier machinery around
an unsettled, unused design wasn't the right trade. The container-aware *source selection* is
what actually matters for the fix to have effect; the multi-batch cascade is a separate, later
decision if transfer ever sees real use.

**Verified live, 26 assertions, against a temporary second warehouse — created and fully deleted
within the test run, not left behind.** The user explicitly asked to build and test this now
rather than wait for a real second warehouse to exist; a *permanent* second warehouse would have
misrepresented the business's real state (D14's real-schema-fake-content discipline, D29's
single-warehouse lock), so the test creates one, exercises the fix, and tears it down in cleanup
regardless of pass/fail — confirmed independently afterward that `warehouses` shows exactly one
row (`main`) post-run. Covered: the timestamp fix on both paths (container-sourced and direct-
fallback, each verified against whichever batch FIFO *actually* selected, not assumed — one
assertion was initially wrong for exactly the reason decision #41's Test 7 was: a real pre-
existing demo-seed batch outranked the test's own fixture in FIFO order, fixed by looking up the
real source via the movement row rather than assuming); container-tracked stock correctly
preferred over older un-contained stock; shortfall reporting; zero-stock and same-location
rejection; the admin/co-admin-only role check; and, most importantly, the cross-cutting fix —
after a transfer draws 6kg of a 10kg container-tracked batch, a subsequent sale of the same SKU
correctly finds only the remaining 4kg, not 10, proving the `'transfer'` addition to 0009's
filters actually closes the gap it was meant to close.

**When this changes.** The container model's core algorithm suite (SPEC-AMENDMENT-v2's §C) is
now fully built, live, and tested end to end: receiving, repack, sale/spoilage, transfer. What
remains is genuinely open, not deferred out of caution: whether to build the multi-batch
transfer cascade (only worth it once transfer sees real use), and the still-unresolved items in
`SPEC.md`'s closing §D (box quantities, GST status, credit terms, second-warehouse timing,
Tanglish UI).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 43 — Migration 0010: the C.4 transfer-timestamp fix — built and tested against a temporary second warehouse
