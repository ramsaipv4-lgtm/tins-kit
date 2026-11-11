---
id: decision-bills-built-and-the-container-system-finally-connected-t
solves: Bills built, and the container system finally connected to a frontend
triggers: Bills built, and the container system finally connected to a frontend
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Bills built, and the container system finally connected to a frontend

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 64 — Bills built, and the container system finally connected to a frontend

**What was found, checked directly rather than assumed from §4.3.7's own text.** SPEC.md §4.3.7
step 1 claims the delivery flow "already does" bill creation — checked against
`DeliveryForm.tsx`/the old `recordDelivery` (client-side: 1 batch insert + 1 movement insert, no
locking, one SKU per submission) and confirmed that claim was never true: `batches.bill_id` has
sat NULL on every row since migration 0006 added the column. Separately, `record_container_fill`
(migration 0007) — the RPC that packs received fish into a numbered, shelf-life-tracked
container — has existed since Mode B with zero frontend usage anywhere (`grep -rn
"record_container_fill" src/` returned nothing before this session). The two turned out to be
the same underlying gap, not two separate ones: `container_fills.bill_id` is a NOT NULL FK, so
packing is structurally impossible until a bill (and batches that trace to it) exist — the user
named both together in the same request for exactly this reason.

**What was built, in the order the data actually depends on:**
- **`supabase/migrations/0019_record_bill_delivery.sql`** — new `record_bill_delivery(p_vendor_id,
  p_location_id, p_bill_date, p_vendor_bill_number, p_items)`. One bill, N SKU lines, each line's
  batch + `delivery_in` movement, all atomic and SECURITY DEFINER (matching the
  `record_transfer_cascade`/`record_container_fill` precedent rather than the old plain-insert
  path) — every movement from one bill shares a `movement_group_id`, SPEC's own precedent
  (spoilage's cascade) for "the audit log will show all of them as a group." One location and
  one vendor for the whole bill, deliberately — a vendor's delivery physically arrives at one
  place in one trip; only the old form's "one SKU per submission" restriction is lifted.
- **`src/pages/DeliveryForm.tsx`** — rewritten from a single-line form into a repeatable
  fish-line list ("+ Add another fish"), a running bill total, calling the new RPC via
  `recordBillDelivery` (`mutations.ts`). Same route (`/deliver`), so no nav link needed updating
  for this half.
- **`src/pages/PackContainerForm.tsx`** — the first frontend for `record_container_fill`. Since
  a container_fill is inherently bill-scoped, the UI is: pick a bill (only bills with something
  still unpacked are listed), see its unpacked lines with a per-line "available to pack" amount
  computed client-side the same way the RPC's own double-allocation guard computes it
  (`least(kg_remaining, kg - already_packed_excluding_repack_copies)`, verified by reading
  `record_container_fill`'s actual source, not re-derived from memory), select lines + kg,
  container number (plain text — the RPC itself finds-or-registers by number, so no separate
  "new vs existing container" toggle is needed) + capacity, submit. Client-side total-vs-capacity
  check disables submit before a wasted round trip, but the RPC remains the real validator.
  **One real bug caught before committing:** the line-selection checkbox and its row were
  originally one `<label>` wrapping both the checkbox and a nested `<TextInput>` (which renders
  its own `<label>`) — nested `<label>` elements are invalid HTML and a real interaction bug:
  clicking the kg field's own label text would also toggle the row's checkbox, since a click
  anywhere inside an outer `<label>` forwards to its control. Restructured to a plain `<div>`
  wrapper with the checkbox's `<label>` scoped to just the checkbox + fish name.
- **`src/pages/BillsManagement.tsx`** — list bills, admin/co-admin can mark one shared (method:
  WhatsApp/PDF/email) — §4.2.14's `share_status`/`shared_at`/`share_method`, which tracks that a
  bill was shared **back to the vendor** (a purchase receipt), not anything customer-facing.
  Recording that a bill was shared and how — not actually sending a PDF/WhatsApp message, which
  is D20's separate Edge-Function automation track.
- Routes `/pack` and `/bills` added to `App.tsx`, both scoped to `admin, co-admin, vendor-rep,
  super-worker` — matching `record_container_fill`'s own internal role check exactly (receiving/
  packing isn't a plain-worker task, per that function's own comment), not the broader
  CRM-pattern roles Customers/Payments/Reversals use. Nav links added to `RepDashboard.tsx`
  (grid grew `sm:grid-cols-7` → `sm:grid-cols-9`) and `AdminDashboard.tsx`.
- `mutations.ts` gained `recordBillDelivery` and `recordContainerFill`; the old `recordDelivery`
  is gone (only ever used by the one file rewritten above).

**Verified before committing:** the two new multi-level PostgREST embeds this work depends on
(`batches → skus`/`bills → vendors`, and `container_fill_items → container_fills`) confirmed
live against the real Supabase project (200 OK) before writing the query that uses them, not
assumed from the container-model precedent alone. `npx tsc --noEmit` clean, `npm run validate`
(73/73), `npm run build` clean, `npm run selftest` (9/9). Migration 0019 confirmed NOT yet live
(a direct RPC probe returned PGRST202 — expected, matches every other pending migration this
sprint) — still pending the user applying 0015-0019 in order, then a live test of all 5 new/
changed RPCs from this sprint together.

**Cross-reference:** SPEC.md §4.2.11-§4.2.14, §4.3.7, D21, D23; migrations 0006 (bills/containers/
container_fills schema), 0007 (`record_container_fill`, never exercised from a frontend before
this); decision #61 (this sprint's earlier CRM pieces, same priority-ordered approach).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 64 — Bills built, and the container system finally connected to a frontend
