---
id: decision-migration-0013-credit-terms-d33-verified-live
solves: Migration 0013: credit terms (D33), verified live
triggers: Migration 0013: credit terms (D33), verified live
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Migration 0013: credit terms (D33), verified live

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 48 — Migration 0013: credit terms (D33), verified live

**What changed.** `customers.credit_limit`/`credit_period_days` (both nullable — no value means
no formal cap/due-date tracking, not zero) plus a derived `customer_credit_status` view
(`security_invoker = true`, same discipline as `container_availability`) computing real-time
outstanding balance, an over-limit flag, and days-overdue on the oldest unpaid sale. The
payment-tracking mechanics this builds on already existed (migration 0012's `payments` table);
what was missing was any limit/period concept or visibility into it at all. `record_container_sale`
is deliberately untouched — enforcement is soft (D33, extending D25's existing "incomplete data
warns, never blocks a core mutation" principle), a flag for the rep/admin to see, not a refusal.

**Verified live, 15 assertions**, exercising the actual math, not just that the view returns
rows: no-sales baseline (0 balance, not over limit); an unpaid sale correctly shown as
outstanding; a *partial* payment reducing the balance by exactly that amount, not zeroing it;
full payment returning the balance to 0 and clearing `oldest_unpaid_sale_at`; a customer over
their limit correctly flagged; a customer with `credit_limit = NULL` never flagged regardless of
how large their balance is (a real distinction the view has to get right — `NULL` isn't "limit
zero"); and `days_overdue` computed correctly against a real backdated sale (a sale 20 days old
against a 15-day credit period reads exactly ~5 days overdue). Read back under real `vendor-rep`
RLS, not the secret key, since `security_invoker = true`'s whole point is that the view must
respect the querying user's own permissions on the underlying tables — worth actually proving,
not assuming.

**Cross-reference:** `supabase/migrations/0013_credit_terms.sql`, SPEC.md D33.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 48 — Migration 0013: credit terms (D33), verified live
