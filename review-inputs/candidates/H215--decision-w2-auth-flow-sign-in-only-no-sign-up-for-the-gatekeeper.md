---
id: decision-w2-auth-flow-sign-in-only-no-sign-up-for-the-gatekeeper
solves: W2 auth flow: sign-in only, no sign-up (for the gatekeeper demo)
triggers: W2 auth flow: sign-in only, no sign-up (for the gatekeeper demo)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# W2 auth flow: sign-in only, no sign-up (for the gatekeeper demo)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 12 — W2 auth flow: sign-in only, no sign-up (for the gatekeeper demo)

**What changed.** W2 ships a sign-in form only. No "create account" flow. The 3 demo
users (`admin@`, `rep@`, `worker@jayshankar.demo`) are pre-created via
`scripts/seed-auth-users.mjs` (W1.5 deliverable). New users can only be added by an
admin via the Supabase Dashboard (or, in Pilot/Production, by an admin user from
within the app).

**Why.** The gatekeeper demo is for the wholesaler to see the app, not to onboard new
users. Sign-up would:
1. Create a 4th auth.users row that we don't have a `public.users.role` for (the
   trigger defaults to `'worker'`, which is wrong for a new admin).
2. Add a "first sign-up becomes admin" branch (SPEC §2.2.2) that the trigger already
   handles, but in W2 we don't yet have an admin UI to promote a worker to admin. The
   first sign-up via the app would be auto-admin, which is fine for the seed
   (Karthik is the first user) but surprising for any demo session.
3. Add a flow we'd have to test, gate, and document. The SPEC's "first sign-up
   becomes admin" pattern is already implemented in the trigger; we don't need to
   build a UI for it on Day 1.

**Impact on downstream.** W2 has fewer components (no sign-up form, no email-confirm
flow, no "forgot password" flow). The user can be added in Pilot/Production mode
when the wholesaler is onboarding real staff. The 3 demo users cover all 3 roles
for the demo.

**Sign-up flow when needed:** add a `<SignUpForm>` component, route it at
`/sign-up`, and gate it with an admin-only middleware (a `useRequireRole('admin')`
hook that redirects to `/admin` if not admin). Out of scope for W2.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 12 — W2 auth flow: sign-in only, no sign-up (for the gatekeeper demo)
