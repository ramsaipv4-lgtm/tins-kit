---
id: decision-invite-link-led-back-to-login-d38-india-only-phone-ux-d3
solves: Invite link led back to login (D38); India-only phone UX (D39)
triggers: Invite link led back to login (D38); India-only phone UX (D39)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Invite link led back to login (D38); India-only phone UX (D39)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 57 — Invite link led back to login (D38); India-only phone UX (D39)

**What changed.** User clicked a real generated invite link for the first time and reported it
led back to the login screen instead of a set-password step. Investigated by actually testing
the link two independent ways (a plain GET with redirects disabled, and a direct API-level
`verifyOtp`-equivalent call) rather than guessing at the cause, and found two real, separate
problems:

1. **No frontend code anywhere ever handled an invite link.** `App.tsx` had one unconditional
   `if (!session || !user) return <SignInForm />` — a genuine gap in what D36/D37 built (the
   backend half was correct; the frontend half was never actually written), not a regression.
2. **A structural collision between this app's hash-based routing and Supabase's own redirect
   mechanism** — both want the URL fragment (`#...`) for different things. Fixed by never
   sending anyone to Supabase's own `/auth/v1/verify` redirect endpoint at all: the Edge
   Function now builds its own link into a new in-app route (`#/accept-invite?token_hash=...`),
   and the new `AcceptInvite.tsx` page calls `verifyOtp({ token_hash, type })` itself,
   client-side — sidesteps the collision entirely and works the same regardless of which OAuth
   flow (implicit/PKCE) the project is configured for, rather than depending on it.

**A third, separate thing found live and reported as exactly that — not fixed, because it isn't
a code problem:** the invite token itself came back `otp_expired` immediately after generation,
confirmed via two independent verification paths. Most likely a Supabase project-level OTP/link
expiry setting. Flagged to the user as their own Dashboard to check, not silently worked around.

**Same message, three more real asks, all reasonable given the actual deployment shape (one
client, always Tamil Nadu, always +91):** `normalizeIndianPhone()` added so a bare 10-digit
number is valid input everywhere phone-facing (the invite form and sign-in) — country code
handling moves entirely into the UI layer; the Edge Function's own validation stays strict,
standard E.164. `SignInForm.tsx` collapsed from a 2-tab method picker to one identifier field
that auto-detects email vs. phone from what was typed — the invite form's explicit two-method
choice stays separate, since that one is a real admin decision, not something to auto-detect.
"Remember me" was already correctly handled by the existing `persistSession`/`autoRefreshToken`
Supabase client config — confirmed, not rebuilt.

**Verified before handing back:** `npm run typecheck`/`validate` (72/72)/`build` all clean. The
`otp_expired` root cause is explicitly NOT yet verified fixed — that's the one piece requiring
the user's own Dashboard check, same as D36's `SITE_URL`/redirect-URL rounds.

**Cross-reference:** SPEC.md D38, D39; `supabase/functions/invite-user/index.ts`;
`src/pages/AcceptInvite.tsx` (new); `src/App.tsx`, `src/lib/auth.ts`, `src/lib/supabase.ts`,
`src/components/SignInForm.tsx`, `src/pages/TeamManagement.tsx`; decision #56.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 57 — Invite link led back to login (D38); India-only phone UX (D39)
