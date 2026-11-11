---
id: decision-v1-sprint-the-crm-frontend-gap-customers-payments-revers
solves: V1 sprint: the CRM frontend gap (customers, payments, reversals)
triggers: V1 sprint: the CRM frontend gap (customers, payments, reversals)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# V1 sprint: the CRM frontend gap (customers, payments, reversals)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 61 — V1 sprint: the CRM frontend gap (customers, payments, reversals)

**What was found.** Following the user's "lets sprint to v1" directive, an audit of the app
(not just the schema) found that the entire CRM layer built in Mode B — `customers`, `payments`,
`reversal_requests`, `bills`, `notifications` tables, their RLS, and the `customer_credit_status`
view (migrations 0012–0013, D22/D24/D27/D33) — had **zero frontend usage anywhere**. Confirmed
mechanically, not assumed: `grep -rln "from('customers')" src/` and the equivalents for the other
4 tables all returned nothing; `ls src/pages/` had no corresponding page. A sale could be recorded
with a free-text buyer name, but nothing could ever link it to a real customer, show a running
balance, record a payment against it, or request/execute a reversal through the UI — despite all
of that being fully spec'd and schema-complete since Mode B.

**What was built this sprint, in priority order (customers → payments → reversals; notifications
and bills deferred — see below):**
- **`supabase/migrations/0015_sale_customer_link.sql`** — `record_container_sale` gains an
  optional `p_customer_id` (appended, defaulted — backward-compatible signature change). When
  set, the customer's name is derived from their row (authoritative once linked, not re-typed);
  `sales.customer_id` gets populated for the first time ever, which is what
  `customer_credit_status` needs to have anything to key off. A one-off buyer with no formal
  record still works exactly as before (D25's "incomplete data warns, never blocks," extended).
  Return shape kept byte-for-byte identical to the pre-existing function — caught a mismatch
  (wrong field names, a dropped field) before finalizing by re-reading exactly what
  `src/lib/mutations.ts`'s `recordSale()` actually reads.
- **`supabase/migrations/0016_execute_sale_reversal.sql`** — the reversal *execution* algorithm
  (migration 0012 deliberately built only the request/approval schema, its own comment says so).
  Real, checked-not-assumed finding this depends on: `apply_movement_to_batches` (0001) only
  fires on `kind IN ('transfer','sale','spoilage')` — `'reversal'` isn't in that list (even
  though it *is* a valid `kind` value, added to the CHECK constraint by migration 0006), so a
  `kind='reversal'` movement does NOT auto-restore `batches.kg_remaining`. This function restores
  it explicitly, the same way `container_fills.kg_remaining` is already handled explicitly
  elsewhere (migration 0009's cascades). Handles both admin/co-admin execution (any
  `requested`/`approved` request) and the D22 self-execute exemption (`users.can_self_reverse`,
  own `requested` request only) — the self-execute path needs SECURITY DEFINER specifically
  because `reversal_requests`' own UPDATE RLS policy is admin/co-admin-only; a self-reversing rep
  has no other path to transition their own request's status. Notifications deliberately NOT
  written here — scoped to stock correctness, the highest-risk part, not the full D27 taxonomy.
- **`src/pages/CustomerManagement.tsx`** — list/add/edit, matching `SkuManagement.tsx`'s "even a
  5th grader could use it" pattern: name + phone up front, business details/address/follow-up
  status/fish preference/credit terms behind "More settings." GST fields stay dormant (D24).
  `warehouse_id` resolved silently (D29 — one warehouse in practice), never shown to the user.
- **`src/pages/PaymentManagement.tsx`** — pick a customer, see `customer_credit_status`
  (outstanding balance, over-limit flag, days overdue), see that customer's sales with a
  client-computed per-sale balance (the view only aggregates per customer by design — its own
  CTE — so per-sale balance is a read-time join of `sales` + `payments` in JS, not a new source
  of truth), record a payment against any sale with balance > 0. Plain RLS-gated `payments`
  insert — no RPC needed, unlike sales/movements, because there's no cascade or algorithm here.
- **`src/pages/ReversalRequests.tsx`** — request a reversal (see decision #62 — this ended up
  needing its own RPC, not a plain insert), and — for admin/co-admin, or the original requester
  under the self-execute exemption — approve/deny (plain update) or execute (calls the new RPC).
  Verified live against the real Supabase project
  before committing to it: the PostgREST FK-disambiguation hint `users!requested_by(display_name)`
  works for the double-embed of `users` this page needs (`requested_by` and implicitly
  `decided_by`), confirmed via a scratch script hitting the real REST endpoint with the exact
  multi-level select string the component uses (200 OK) — chosen over the constraint-name-based
  hint as more robust against Postgres's auto-naming.
- **`src/components/FormFields.tsx`**: new `CustomerSelect` — optional, not required (same D25
  philosophy as above). **`src/lib/mutations.ts`**: `SaleInput.customerId?`, threaded to the RPC.
  **`src/pages/SaleForm.tsx`**: customer picker shown first; the free-text buyer-name field only
  appears (and is only required) when no customer is selected. **`src/App.tsx`**: 3 new routes
  (`/customers`, `/payments`, `/reversals`), scoped to `admin, co-admin, vendor-rep, super-worker`
  — deliberately broader than the admin-only pattern SKU/Warehouse/Team use, since reps are the
  ones actually meeting buyers day to day. Nav links added to `AdminDashboard.tsx` and
  `RepDashboard.tsx` (the latter's action grid grew `sm:grid-cols-6` → `sm:grid-cols-7`).

**Deliberately deferred, not part of this batch:** a **Notifications** UI — nothing anywhere
writes to `public.notifications` yet, needs both a writer and a bell-icon/list UI respecting
D27's role-at-creation scoping — and a **Bills** UI. Both come after this batch, per the sprint's
own stated order.

**Verified before committing:** `npx tsc --noEmit` (clean, whole repo), `npm run validate`
(73/73 — unchanged; the new migrations aren't yet part of that gate's schema-presence checks),
`npm run build` (clean), `npm run selftest` (9/9). The two new migrations have been read back
line-by-line for correctness (kind='reversal' CHECK-constraint history, batch_id NOT NULL
guarantee, RPC named-parameter call compatibility with the appended default parameter) but are
**not yet applied to the live database** — pending the user running them via the Supabase
Dashboard SQL Editor, after which both new RPCs still need a real, live test the same way every
other RPC in this project has been (never trusted from a clean `validate` run alone).

**Cross-reference:** SPEC.md §4.3.8, §4.3.11, D22, D24, D25, D27, D29, D33; migrations 0012, 0013
(the un-exercised schema this closes the gap on); migrations 0009, 0006 (the cascade + CHECK-
constraint history 0016 depends on); decision #34 (the `queryKey` collision class, avoided here
by scoping `['customers', 'select']`).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 61 — V1 sprint: the CRM frontend gap (customers, payments, reversals)
