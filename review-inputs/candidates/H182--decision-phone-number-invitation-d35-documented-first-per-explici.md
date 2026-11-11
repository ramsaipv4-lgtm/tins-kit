---
id: decision-phone-number-invitation-d35-documented-first-per-explici
solves: Phone-number invitation (D35), documented first per explicit instruction, then built
triggers: Phone-number invitation (D35), documented first per explicit instruction, then built
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Phone-number invitation (D35), documented first per explicit instruction, then built

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 53 — Phone-number invitation (D35), documented first per explicit instruction, then built

**What changed.** User asked "can we invite using phone number too?" directly after decision
#52 shipped. Per the user's own explicit instruction on #51 ("properly write the necessary
documentation first before starting the build"), SPEC.md D35 was written and locked before any
code: `invite-user` now accepts `email` XOR `phone`, never both. Email is unchanged
(`inviteUserByEmail`). Phone is a genuinely different Admin API call —
`admin.createUser({ phone, phone_confirm: true, user_metadata })` — because there's no phone
equivalent of an emailed set-password link: the account is created already confirmed (the admin
is vouching for the number by typing it in while handing over the phone), and from then on the
person signs in with `signInWithOtp`/`verifyOtp` — a fresh SMS code every time, no password ever.

**Two facts verified live before finalizing the design, not assumed from memory** (this
session's established discipline, applied again here): (1) GoTrue represents "no email" (and
"no phone") as `''`, not a true `NULL`, even via the raw Admin API — confirmed by actually
calling `POST /auth/v1/admin/users` with a phone-only payload and inspecting the real response
before writing migration 0014's `CREATE OR REPLACE handle_new_user()`. This mattered: a naive
`coalesce(new.email, new.phone, ...)` would never have fallen through to phone at all, since
`''` is non-NULL. Fixed with `nullif(new.email, '')` throughout, and the new
`users_identity_present` CHECK is written the same defensive way rather than a bare
`IS NOT NULL`. (2) GoTrue stores/returns phone numbers without the leading `+` — cosmetic, but
would have shown up as a confusing raw digit string in the Team list and header; added
`formatPhone()` (`src/lib/auth.ts`) as a display-only re-prepend, never used for comparisons.

**Schema fix this required, found by reading the actual constraint, not guessed:**
`users.email` has been `NOT NULL` since `0001_init.sql` — a phone-only account would have
silently broken `handle_new_user()`'s INSERT (rolling back the whole `auth.users` INSERT
transaction) had this shipped without migration 0014 making `email` nullable first.

**Built alongside the migration and Edge Function:** `SignInForm.tsx` gained a real phone+OTP
sign-in path (two-step: request code, verify code) — needed for the phone-invited account to be
usable at all, not just invitable; `TeamManagement.tsx`'s `InviteForm` gained an email/phone
method toggle; `auth.ts`'s `AppUser.email`/`.phone` widened to nullable (the two remaining `!`
non-null assertions on `s.user.email` were real latent bugs for a phone-only session, now fixed).
`scripts/test-phone-identity.mjs` written to verify the schema/trigger side live (account
creation, `public.users` population, the identity-presence CHECK actually rejecting an all-null
row) — real SMS delivery and `signInWithOtp`/`verifyOtp` end-to-end cannot be tested from this
environment (no SMS provider connected yet, no way to receive a text here) and is the one part
of this the user will verify directly, using their own phone number for the dev/test account
before switching it to the real owner's number at go-live (an operational Dashboard step, not a
feature — D35 says so explicitly).

**Not yet verified live — migration 0014 not yet applied.** `npm run typecheck`/`validate`/
`build` all confirmed clean. Once the user applies 0014 via the Dashboard SQL Editor,
`test-phone-identity.mjs` needs to actually be run (already written, already run once
pre-migration to confirm it fails for the *expected* reason — the old NOT NULL constraint — not
some other bug), and the Edge Function's phone branch needs redeploying since the function file
changed again.

**Cross-reference:** SPEC.md D35, §2.2.1, §4.2.1, §4.3.12; `supabase/migrations/
0014_phone_or_email_identity.sql`; `supabase/functions/invite-user/index.ts`;
`src/lib/auth.ts`, `src/components/SignInForm.tsx`, `src/pages/TeamManagement.tsx`; decision #52.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 53 — Phone-number invitation (D35), documented first per explicit instruction, then built
