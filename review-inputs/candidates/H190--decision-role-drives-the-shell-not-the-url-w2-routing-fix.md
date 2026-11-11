---
id: decision-role-drives-the-shell-not-the-url-w2-routing-fix
solves: Role drives the shell, not the URL (W2 routing fix)
triggers: Role drives the shell, not the URL (W2 routing fix)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Role drives the shell, not the URL (W2 routing fix)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 17 — Role drives the shell, not the URL (W2 routing fix)

**What changed.** `src/App.tsx` was rewritten so the routing is role-driven
via a `Shell` wrapper component. Each route (`/admin`, `/rep`, `/floor`)
checks the user's role and:
- if it matches → render the dashboard
- if it doesn't match BUT the role is a known role → redirect to the role's
  home shell (e.g. vendor-rep on `/#/admin` → redirect to `/#/rep`)
- if the role is unknown → render "Not allowed" (instead of redirecting,
  to avoid an infinite loop when `defaultRouteFor` falls through to /admin)

**Why.** The user's first W2 test cycle surfaced this: after signing out
from Karthik (admin, on `/#/admin`) and signing in as Anitha (vendor-rep),
the URL stayed at `/#/admin` and Anitha saw the "Not allowed" banner
instead of being routed to `/#/rep`. The role-URL mismatch was treated as
an error to display rather than a navigation problem to solve.

**The deeper cause.** Sign-out clears the session but doesn't navigate —
the URL is preserved. So the next signed-in user inherits the previous
user's URL. If their role doesn't match, they're stuck on a forbidden page
with no clear way back (the original "Not allowed" banner had a "go to
your home page" suggestion, but the link didn't actually navigate).

**The fix in 6 lines.** The `Shell` component wraps each route. It does
the role check; on mismatch with a known role, it returns a `<Navigate>` to
the role's home. The "Not allowed" path is now only reached for genuinely
unknown roles (which don't happen in the W2 3-role world).

**Impact on downstream.** The W2 manual verification Check 2 step 4
("try navigating to /#/admin as rep") now passes by redirecting to /#/rep
instead of showing "Not allowed". The role drives the experience; the URL
is just a bookmark.

**Why "role drives the shell" not "URL drives the shell".** SPEC §0.2
says "first sign-up becomes admin" and D3a says "vendor-rep and worker
share a layout". The app is role-centric, not URL-centric. A user
shouldn't need to know their own URL — they sign in, they get their
shell. Bookmarks and deep links are a Pilot/Production concern (out of
scope for W2 per SPEC §9).

**When this changes.** Pilot/Production: add real deep links for the
admin's audit log view, the rep's delivery form, etc. The `Shell` design
keeps that work additive — add the new routes inside the role-specific
shells, the role check still gates the URL.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 17 — Role drives the shell, not the URL (W2 routing fix)
