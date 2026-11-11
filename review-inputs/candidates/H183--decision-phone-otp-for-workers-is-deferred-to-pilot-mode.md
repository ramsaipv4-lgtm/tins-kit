---
id: decision-phone-otp-for-workers-is-deferred-to-pilot-mode
solves: Phone OTP for workers is deferred to Pilot mode
triggers: Phone OTP for workers is deferred to Pilot mode
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Phone OTP for workers is deferred to Pilot mode

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 13 — Phone OTP for workers is deferred to Pilot mode

**What changed.** SPEC §0.2 says "Auth: Supabase Auth (email/password + phone OTP)."
W2 ships email/password for all 3 roles. The 3 demo users are all on email/password
(matches the W1.5 seed-auth script). Phone OTP is a Pilot/Production concern.

**Why.** The demo runs on the dev machine in a browser. The wholesaler demoing
doesn't have real phones to receive OTPs. The 3 demo users we need are already
created with email/password by `seed-auth-users.mjs`. Phone OTP would:
1. Require a Twilio integration (cost: per-SMS) or Supabase's built-in SMS provider
   (also cost).
2. Add a flow the demo doesn't need.
3. Be redundant with the existing email/password for the gatekeeper demo.

**Impact on downstream.** `supabase.auth.signInWithOtp` is not implemented in W2.
The sign-in form is `signInWithPassword` only. In Pilot/Production, when the
wholesaler onboards real workers with real phones, the sign-in form will get a
"Sign in with phone" tab that uses `signInWithOtp`. SPEC §3.5 mentions phone
OTP, so the validator doesn't need to change — the spec is the source of truth,
and the spec is unchanged.

**Why not just build both.** W2 is 2-3 hours. Building email + phone in that time
means neither is well-tested, and the demo doesn't need phone. The deferral
preserves the SPEC's intent (phone OTP is a real flow when needed) without
over-investing in the demo.

**When this changes.** Pilot mode begins. The wholesaler has real workers with
phones. A new W item in the Pilot-mode work queue adds the phone-OTP flow. The
trigger already accepts phone numbers (the `phone` column on `public.users` is
optional), so the migration is just a sign-in UI change.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 13 — Phone OTP for workers is deferred to Pilot mode
