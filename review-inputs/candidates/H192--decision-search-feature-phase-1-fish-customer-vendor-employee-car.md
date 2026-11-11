---
id: decision-search-feature-phase-1-fish-customer-vendor-employee-car
solves: Search feature, phase 1: fish/customer/vendor/employee cards, mostly free
triggers: Search feature, phase 1: fish/customer/vendor/employee cards, mostly free
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Search feature, phase 1: fish/customer/vendor/employee cards, mostly free

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 65 — Search feature, phase 1: fish/customer/vendor/employee cards, mostly free

**Scope, decided with the user before building, not guessed.** The user proposed a large
"Pokemon-card style" search feature — fish/stock cards, employee cards (hours, tasks,
performance ratings, pay due), seller/vendor cards (credit, quality ratings, message templates),
buyer/customer cards (history, complaints, full traceability) — and explicitly invited more
suggestions. Broken down by what's actually derivable from existing schema vs. genuinely new:
most of the fish/buyer/seller asks are free (existing `skus`/`batches`/`bills`/`sales`/
`payments`/`movements`/`vendors` data); employee hours/tasks/ratings, vendor quality ratings,
message templates, and customer complaints all need schema that doesn't exist anywhere in this
project. Asked the user two scoping questions before writing any migration: (1) should the
employee card compute wages (hours × rate) or just track activity with the amount-due entered by
hand — answered **activity tracking only, no wage math**; (2) should the vendor-credit mirror
(what we owe vendors, symmetric to `customer_credit_status`) be built now — answered **yes**.
This decision covers what was actually built this pass: search infrastructure + the fish/
customer/vendor cards (all existing data) + the vendor-credit mirror (approved) + the employee
card's *activity* summary (existing data only — the check-ins/tasks/ratings the user asked for
under "activity tracking" still need new schema not built in this pass, flagged honestly in the
card itself and in the chat response, not silently dropped). Vendor quality-per-fish ratings,
WhatsApp message templates, and customer complaints are explicitly deferred — suggested by this
session, never confirmed as wanted, so not built on spec.

**Search mechanism.** Client-side, not a Postgres extension: every "identity" table here
(`skus`, `customers`, `vendors`, `users`) is small for a single-warehouse wholesaler (dozens to
low hundreds of rows), so `fetchSearchIndex()` (`src/lib/search.ts`) loads all four once and
`Fuse.js` fuzzy-matches names client-side — handles English/Tamil/Tanglish spelling variants for
fish names without any new backend infrastructure. Phone-number queries deliberately bypass
Fuse's edit-distance matching (a query of "98" would loosely match nearly every Indian mobile
number) in favour of a plain digit-substring filter. Revisit if any of these tables ever grows
past client-fetchable size.

**What was built:**
- **`supabase/migrations/0020_vendor_payments.sql`** — `vendor_payments` (mirrors `payments`'
  own shape and RLS policies exactly) + `vendor_credit_status` view (mirrors
  `customer_credit_status`, migration 0013 — deliberately narrower: `vendors` has no
  `credit_limit`/`credit_period_days` columns, checked directly rather than assumed, so there's
  no over-limit/days-overdue signal to compute on the vendor side).
- **`src/lib/search.ts`** + **`src/pages/Search.tsx`** — the search box and fuzzy index.
- **`src/pages/FishCard.tsx`** — current stock oldest-first with per-batch location/vendor/
  expiry, purchase history with a "show more" expansion (all existing data).
- **`src/pages/CustomerCard.tsx`** — contact info, `customer_credit_status`, sale history with
  per-sale balance, and a full trace per sale (which employee sold it, which vendor(s) the fish
  actually came from — walks `sales → movements → batches → vendors`, listing every distinct
  vendor since a container-sourced sale can cascade across several batches/vendors in one call,
  migration 0009).
- **`src/pages/VendorCard.tsx`** — contact info, the existing `vendors.reliability` rating
  (already existed, 1-5, surfaced here for the first time), `vendor_credit_status`, most-
  purchased fish by kg, bill history, and a "record a payment" action mirroring
  `PaymentManagement.tsx`'s own customer-side pattern.
- **`src/pages/EmployeeCard.tsx`** — role, contact, and an activity summary (deliveries/sales/
  transfers/spoilage/repacks recorded via `created_by`/`sold_by`, reversal requests filed) — all
  free from existing data. Carries an explicit, visible note that check-ins/hours/tasks/ratings
  aren't built yet, rather than a card that quietly looks "finished" while missing what the user
  actually asked for under that scope answer.
- Routes `/search` and `/search/{fish,customer,vendor,employee}/:id` added, scoped to the same
  4 roles as Customers/Payments/Reversals (not plain `worker` — `payments`/`vendor_payments`'
  own SELECT policies already exclude that role, so a card built from them would show confusing
  partial-empty sections to a worker viewing one). Nav: a prominent "🔍 Search" button on both
  `AdminDashboard.tsx` and `RepDashboard.tsx`.
- Added the `fuse.js` dependency (zero transitive dependencies of its own — confirmed via `npm
  audit`, which found only pre-existing vulnerabilities in unrelated dev/transitive packages,
  none introduced by this addition).

**Verified before committing:** every new multi-level PostgREST embed this batch depends on
(`batches → skus`/`locations`/`bills → vendors`, `sales → users!sold_by`, `movements → batches
→ vendors`) confirmed live against the real Supabase project before writing the query that uses
it, not assumed from precedent alone. `npx tsc --noEmit` clean, `npm run validate` (73/73),
`npm run build` clean, `npm run selftest` (9/9).

**Cross-reference:** decisions #61, #64 (this sprint's earlier pieces, same priority-ordered,
ask-before-guessing approach); `customer_credit_status` (migration 0013, the template
`vendor_credit_status` mirrors); `PaymentManagement.tsx` (the template `VendorCard.tsx`'s payment
form mirrors).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 65 — Search feature, phase 1: fish/customer/vendor/employee cards, mostly free
