---
id: decision-the-complaints-frontend
solves: the complaints frontend
triggers: the complaints frontend
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# the complaints frontend

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 76 — the complaints frontend

**What was built** on top of migration 0027's backend, mirroring `ReversalRequests.tsx`'s own
proven structure (the shape of the problem is the same — pick a recent sale, act on it, review
what's pending): `src/pages/Complaints.tsx` (`/complaints`, scoped to the same 4 roles as the
rest of this sprint's CRM screens for filing; resolving gated to admin/co-admin inside the
component, matching `resolve_customer_complaint`'s own role check since it touches both stock
and money). The resolve form live-validates that the three kg buckets sum to exactly
`kg_returned` before allowing submit, only asks for a rejected-disposition choice when any kg is
actually rejected, and shows an estimated refund computed client-side from the same formula the
RPC uses server-side (a preview, not the source of truth — the RPC's own return value is what
actually gets shown as the final result). Nav links added to `AdminDashboard.tsx` and
`RepDashboard.tsx` (the latter's grid grew `sm:grid-cols-9` → `sm:grid-cols-10`).

**Verified:** `npx tsc --noEmit` clean, `npm run validate` (73/73), `npm run build` clean,
`npm run selftest` (9/9). The multi-level embed this page depends on (`customer_complaints →
sales → skus`, `customer_complaints → users!reported_by`) could not be checked live before
writing it — migration 0027 isn't applied yet — but uses the exact same embed shapes already
confirmed live elsewhere this sprint (`ReversalRequests.tsx`'s own `sales(...skus(...))` and
`users!requested_by(...)` patterns), not a novel guess.

**Also found, unrelated, while committing this: another concurrent session of this same
conversation moved `supabase/functions/invite-user/` to `supabase/edge-functions/invite-user/`
on disk** — not this session's own change, left untouched, flagged to the user rather than
silently merged into or reverted by this commit.

**Cross-reference:** decision #75 (the backend this is built on); `ReversalRequests.tsx` (the
structural template); decision #63/#68 (the "verify embeds live before trusting them" discipline
this follows even when a direct check isn't possible yet).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 76 — the complaints frontend
