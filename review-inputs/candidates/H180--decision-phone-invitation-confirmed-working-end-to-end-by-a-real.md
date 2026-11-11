---
id: decision-phone-invitation-confirmed-working-end-to-end-by-a-real
solves: Phone invitation confirmed working end to end by a real human, real device (closes D34–D40)
triggers: Phone invitation confirmed working end to end by a real human, real device (closes D34–D40)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Phone invitation confirmed working end to end by a real human, real device (closes D34–D40)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 59 — Phone invitation confirmed working end to end by a real human, real device (closes D34–D40)

**What changed.** The actual deployed function had stale code from an earlier redeploy attempt
(the Dashboard editor still had pre-D40 content; clicking "redeploy" redeployed what was already
there, not the current repo file) — diagnosed by testing the user's real generated link directly
against the live API rather than guessing, which showed both the wrong link format (Supabase's
own `/auth/v1/verify` URL, not `ownInviteLink()`'s `#/accept-invite` route) and a still-`otp_expired`
token, together pointing at "old code still live." User pasted the full current
`supabase/functions/invite-user/index.ts` over the stale editor content and redeployed for real.

**One more real thing found and cleared before the successful run:** the first retry failed with
"A user with this email address has already been registered" — a leftover orphaned account from
the earlier broken attempts (account creation had actually succeeded under the old code; only
link verification was broken), blocking a clean re-invite to the same phone number. Not a new
bug — cleared directly (found via `public.users.phone`, deleted the matching `auth.users` row).

**Verified three independent ways before telling the user to test themselves, not asserted:**
1. Direct call to the deployed function: 200, correct `#/accept-invite?token_hash=...` link format
   (confirms `SITE_URL` is read correctly this time).
2. That exact token verified via `/auth/v1/verify`: 200, real `access_token` returned.
3. The live Netlify bundle itself (`curl` the deployed JS) contains `"accept-invite"` — confirms
   the frontend `AcceptInvite.tsx` route is actually live, not just the backend half.

**Then confirmed by the user directly, on a real device, with video** — the actual invite flow
(create account by phone → get link → open it → set password → sign in) genuinely works end to
end. This closes out D34 through D40 as verified, not just code-complete: the entire
email/phone invitation mechanism this session built, documented, broke twice, and fixed twice, is
now confirmed working in production by an independent, real, non-scripted test.

**Cross-reference:** D34–D40 (SPEC.md), decisions #51–#58 above (the full build/break/fix
history); `supabase/functions/invite-user/index.ts`; `src/pages/AcceptInvite.tsx`.

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 59 — Phone invitation confirmed working end to end by a real human, real device (closes D34–D40)
