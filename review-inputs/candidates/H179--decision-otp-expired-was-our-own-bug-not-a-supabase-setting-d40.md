---
id: decision-otp-expired-was-our-own-bug-not-a-supabase-setting-d40
solves: otp_expired was our own bug, not a Supabase setting (D40)
triggers: otp_expired was our own bug, not a Supabase setting (D40)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# otp_expired was our own bug, not a Supabase setting (D40)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 58 — otp_expired was our own bug, not a Supabase setting (D40)

**What changed.** Decision #57 flagged `otp_expired` as "most likely a Supabase project-level
setting" and asked the user to check the Dashboard for it. The user sent back their actual Rate
Limits page (saved via a browser extension into `example-video/`, not committed) — which ruled
the theory out directly: token-verification rate limit is 360/hour, nowhere near a value that
would fail instantly. Re-investigated instead of re-asking the user to keep checking dashboard
pages: tested the **email** path (D36) fresh — verified clean, first try, no issue at all. That
isolated it immediately — the bug was phone-specific, meaning it had to be something D37's own
sequence does that D36's doesn't. D37's phone branch calls `generateLink` first, then a second,
separate `updateUserById` to attach the real phone number. Removed that second call in a scratch
test, re-ran the exact same synthetic-email flow: verified clean. Put the second write back:
reproduced the failure on demand. Root cause confirmed precisely, not inferred: a token issued
against a user's old state stops verifying the moment that user record is written to again — a
real, sensible platform behaviour, tripped over by this project's own write ordering.

**Fix:** phone branch now calls `admin.createUser({ email: syntheticEmail, phone,
phone_confirm: true, user_metadata })` — both identifiers set in one call — then `generateLink`
for the already-existing user, with no write to the account afterward, ever.
`scripts/test-phone-password-invite.mjs` rewritten to match, and — the actual gap that let this
ship — now asserts the returned link's token verifies successfully, which the original version
never once checked (it proved the schema/RLS/correction-step side was right and stopped there).

**Verified live, 13/13**, including the exact assertion that was missing before: the invite
link's token verifies and returns a real session `access_token`.

**Cross-reference:** SPEC.md D40 (amends D38's incorrect "probably a Supabase setting" theory);
§4.3.12 phone workflow steps corrected to match;
`supabase/functions/invite-user/index.ts`; `scripts/test-phone-password-invite.mjs`;
decision #57.

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 58 — otp_expired was our own bug, not a Supabase setting (D40)
