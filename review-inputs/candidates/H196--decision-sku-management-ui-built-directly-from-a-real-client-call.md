---
id: decision-sku-management-ui-built-directly-from-a-real-client-call
solves: SKU management UI, built directly from a real client call; and a real co-admin routing gap found while building it
triggers: SKU management UI, built directly from a real client call; and a real co-admin routing gap found while building it
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# SKU management UI, built directly from a real client call; and a real co-admin routing gap found while building it

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 49 — SKU management UI, built directly from a real client call; and a real co-admin routing gap found while building it

**What changed.** `src/pages/SkuManagement.tsx` (new) — the first UI this app has ever had for
creating or editing a SKU. The backend was always ready (`skus_insert_admin`/
`skus_update_admin` RLS policies exist and have for a while); the gap was purely frontend, and
it's exactly what the client described on a call relayed by the user: "I'm not able to edit or
modify... if I add a new SKU, how can I add?"

**Deliberately simple, per the same call** ("simple, basic interface... they don't study even
eighth or ninth"): the add/edit form asks for 5 fields up front (name, Tamil name, type, size,
sold-by unit); shelf life, storage, low-stock warning, and notes are defaulted sensibly and
tucked behind a collapsed "More settings," not forced on every user. `code` (the database's
unique identifier) is auto-generated from name + size and never typed by hand, with a
retry-with-suffix on the rare collision — confirmed live that Postgres really does return error
code `23505` for the unique violation this retry logic checks for, not assumed.

**A real, significant gap found while building this, fixed alongside it, not left for someone to
hit blind.** `Role` (the frontend TypeScript type) has never included `'co-admin'` anywhere —
`defaultRouteFor`/`homeFor`'s switch statements, `KNOWN_ROLES`, `RoleBadge`'s style/label maps,
and all three `/admin/*` routes only ever checked for `'admin'`. A real co-admin user — decision
#46 made this role actually settable in the database for the first time this same session — would
have been completely unable to use the app's UI at all: no route to send them to, every admin
screen's `Shell` check rejecting them outright. Found because adding `'co-admin'` to the `Role`
type turns every place that needs updating into a compiler error (a `Record<Role, string>` must
cover every union member) — ran `tsc` immediately after the type change specifically to use the
compiler as the checklist, rather than trust a manual grep alone; a supplementary grep for
`=== 'admin'` (a pattern the compiler can't catch, since TS doesn't flag narrow comparisons
against one member of a union as incomplete) found nothing further. Fixed all 4 compiler-caught
spots plus wired co-admin into every `/admin/*` route (`expected={['admin', 'co-admin']}`,
matching the multi-role pattern already used elsewhere) and gave it its own badge color
(violet — same admin tier as indigo, visually distinct).

**Google OAuth — discussed, not built yet.** User wants Google sign-in for the next version
shared with the client (serves both "real admin login" and "simple enough for a non-technical
user" — no password to manage). Genuinely blocked on the user first creating OAuth credentials
in Google Cloud Console and configuring the provider in Supabase Dashboard — both manual,
external-console steps. Flagged the one real technical gotcha ahead of time rather than after:
a naive in-WebView OAuth redirect would be rejected by Google's policy against embedded
WebViews; the correct approach opens the flow in the system browser (`@capacitor/browser`) and
catches the redirect via a deep link. Not started — waiting on the user's console setup.

**Cross-reference:** `src/pages/SkuManagement.tsx`, `src/lib/auth.ts`, `src/App.tsx`,
`src/components/Layout.tsx`, `src/components/RoleBadge.tsx`, `src/pages/AdminDashboard.tsx`,
decision #46.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 49 — SKU management UI, built directly from a real client call; and a real co-admin routing gap found while building it
