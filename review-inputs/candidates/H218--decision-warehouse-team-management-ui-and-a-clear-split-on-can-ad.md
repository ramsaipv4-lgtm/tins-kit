---
id: decision-warehouse-team-management-ui-and-a-clear-split-on-can-ad
solves: Warehouse + team management UI, and a clear split on "can admin create new users"
triggers: Warehouse + team management UI, and a clear split on "can admin create new users"
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Warehouse + team management UI, and a clear split on "can admin create new users"

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 50 — Warehouse + team management UI, and a clear split on "can admin create new users"

**What changed.** Two more screens closing the same class of gap as decision #49's SKU
screen — backend RLS already allowed the action, no frontend ever existed:

- `WarehouseManagement.tsx` — list/add/edit warehouses. Only one warehouse row has ever existed
  (`'main'`, seeded directly by migration 0006); this is what actually makes a real second
  warehouse (D23/D29) possible to set up without a raw SQL insert. Same simplicity discipline as
  SKUs: one visible field (the warehouse's display name), `warehouses.name` (the internal unique
  identifier) auto-derived from it, never typed by hand.
- `TeamManagement.tsx` — list every user, tap one to change their role or turn their access off.
  This is the "promote an existing user" half of the user's question ("can the admin create new
  users and new co-admins") — the backend has fully supported this since decision #46, there was
  just no UI. Includes a self-edit warning (not a hard block — a deliberate, proportionate
  choice, not an oversight: preventing it entirely would need a live "is there at least one
  other active admin" check, more complexity than this first pass warrants; the warning is
  prominent and the action is still reversible by any other admin/co-admin).

**The other half of that question — creating a genuinely brand-new user who has never signed
in before — does NOT work, and isn't just a missing UI.** `public.users_insert_admin` RLS exists,
but inserting a raw `public.users` row without a matching `auth.users` row is useless — there'd
be no password, no way for that person to ever actually sign in. Creating a real, login-capable
account requires the Supabase Admin API, which requires the service-role/secret key — a key
that must never reach the client, by the project's own standing rule (`SPEC.md` §4.1). The only
correct way to let the admin do this from inside the app is a Supabase Edge Function: a small
server-side function that verifies the caller is really an admin/co-admin, then uses the secret
key internally (never exposed) to invite the new user. This project has never had one — no
`supabase/functions/` directory exists. Not built in this pass; explained to the user directly,
including the one real Capacitor-adjacent-in-spirit gotcha worth knowing before building it:
`inviteUserByEmail` sends a real email, which depends on Supabase's own email sending actually
being reliable at this account's current tier (rate limits, deliverability) — not a blocker, but
worth surfacing before someone is confused why an invite email never arrived.

**Verified live, 8 assertions** across both new screens (warehouse insert/update, the
duplicate-name retry path's `23505` assumption, worker correctly rejected) — same discipline as
decision #49, not trusting the RLS/retry-logic combination just because each half was separately
tested before.

**Cross-reference:** `src/pages/WarehouseManagement.tsx`, `src/pages/TeamManagement.tsx`,
`src/pages/AdminDashboard.tsx`, `src/App.tsx`, decisions #46/#49.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 50 — Warehouse + team management UI, and a clear split on "can admin create new users"
