---
id: decision-phone-invite-becomes-password-link-not-otp-d37-supersedi
solves: Phone invite becomes password + link, not OTP (D37), superseding D35's active mechanism
triggers: Phone invite becomes password + link, not OTP (D37), superseding D35's active mechanism
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Phone invite becomes password + link, not OTP (D37), superseding D35's active mechanism

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 55 — Phone invite becomes password + link, not OTP (D37), superseding D35's active mechanism

**What changed.** User corrected a misreading directly after decision #54: they never meant
"generate a link for phone the same way as email, on top of the OTP design" — they meant the
phone-invite path itself should go through the *same* link-and-password mechanism as email,
explicitly calling D35's OTP design "the full implementation" and this "just a graceful
degradation." Asked the user directly whether to fully replace the active phone mechanism or
keep both as a per-invite choice (real fork, real cost either way — AskUserQuestion, not
assumed); answer: replace, for now. D37 written into SPEC.md before any code, same pattern as
every phone-invite decision this session.

**The real mechanism, verified live against the real Admin API before writing SPEC.md, in this
order — design, then test, then document:** Supabase's `generateLink` only knows how to anchor a
link to an email identity, so a phone invite now (1) generates the link against a synthetic,
never-shown email (`<digits>@phone.invalid` — confirmed live that GoTrue's email validation
accepts the `.invalid` TLD), (2) attaches the real phone number to that same account via
`admin.updateUserById` (confirmed live: one account can hold both an email and a phone identity
at once), (3) **directly corrects `public.users`** (`email = NULL`, `phone = <real digits>`) in
the same call. Step 3 is proven necessary, not assumed: `scripts/test-phone-password-invite.mjs`
deliberately checks `public.users` *before* the correction step and confirms the synthetic email
really does leak straight through — `handle_new_user()` already ran at step 1 against the
synthetic email, and step 2 is an UPDATE that doesn't re-fire that INSERT trigger.

**Nothing from D35's schema work is wasted** — migration 0014 (nullable `email`,
`users_identity_present`, phone-mirroring `handle_new_user()`) is exactly what D37 builds on;
only the Edge Function's phone branch and the sign-in UI changed. **D35's code is kept, not
deleted** — `requestPhoneOtp`/`verifyPhoneOtp` (`src/lib/auth.ts`) stay in place, unused by any
screen, explicitly commented as "the deferred full implementation" so reviving it later isn't a
rewrite. `SignInForm.tsx`'s phone tab became a single-step phone+password form (was a two-step
OTP request/verify flow) using a new `signInPhonePassword` that derives the same synthetic email
client-side, purely — no server round-trip, and not a secret (equivalent to knowing the phone
number; the password is the actual credential). `TeamManagement.tsx`'s `InviteForm` unified: both
methods now return `invite_link` and share the same copy/share panel.

**Not yet verified live end-to-end** (a real admin clicking a real generated link and signing in
with phone+password needs the still-outstanding Netlify deploy, D36's prerequisite) — but the
Admin-API/database sequence itself is proven correct via
`scripts/test-phone-password-invite.mjs`, including the specific leak this design guards
against. Currently fails at the correction step for the expected, already-known reason (migration
0014 not yet applied — `email` is still `NOT NULL` live) — not a new bug. `npm run
typecheck`/`validate`/`build` all confirmed clean.

**Cross-reference:** SPEC.md D37, §2.2.1, §4.3.12; `supabase/functions/invite-user/index.ts`;
`src/lib/auth.ts`, `src/components/SignInForm.tsx`, `src/pages/TeamManagement.tsx`;
`scripts/test-phone-password-invite.mjs`; decision #54.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 55 — Phone invite becomes password + link, not OTP (D37), superseding D35's active mechanism
