---
id: decision-email-invite-becomes-a-shareable-link-not-an-auto-sent-e
solves: Email invite becomes a shareable link, not an auto-sent email (D36)
triggers: Email invite becomes a shareable link, not an auto-sent email (D36)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Email invite becomes a shareable link, not an auto-sent email (D36)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 54 — Email invite becomes a shareable link, not an auto-sent email (D36)

**What changed.** User's own idea, offered as "graceful degradation," confirmed correct for the
email path and built the same session: `invite-user`'s email branch switches from
`inviteUserByEmail` to `auth.admin.generateLink({ type: 'invite', email, options: { data,
redirectTo } })` — creates the account exactly as before but **sends nothing**; the function
returns `invite_link` to the caller instead. `TeamManagement.tsx`'s `InviteForm` no longer shows
"invite sent" and auto-closes for the email path — it shows the link itself with a "Copy link"
button (and a native `navigator.share()` button where the device supports it), and stays open
until the admin explicitly hits Done, since closing early would lose the link with no way to get
it back short of re-inviting. This directly retires D34's original "known, accepted limitation"
(email deliverability depending on Supabase's own sending reputation) rather than living with
it, and matches how this client actually communicates (WhatsApp, confirmed directly from their
own phone-call feedback and this project's existing WhatsApp-automation track, D20) far better
than "check your email."

**Corrected the user's framing before building, not just built what was asked.** The user's idea
described inviting "by phone number or email" and getting a URL either way. Checked against
Supabase's actual API surface: there is no phone equivalent — a phone account (D35) already
sends nothing at invite time (`phone_confirm: true`), and the SMS cost D35 accepts is a
**sign-in-time** cost (a fresh OTP every sign-in), not an invite-delivery cost a link could
remove. This decision is scoped to email only; the phone path is unchanged from D35.

**Real prerequisite, found by checking the repo's own state, not assumed:** this app has no
deployed web URL at all — `netlify.toml`/`docs/DEPLOY-NETLIFY.md` exist from W6 but the Netlify
click-through was never done. `redirectTo` needs somewhere real to land the invited person's
"set your password" step. Turned out simpler than first suspected: no native/Capacitor
deep-linking is needed at all (that complexity was floated and then ruled out) — the person
completes the password step in their phone's ordinary browser against the deployed web/PWA
build, then separately opens the real Android app and signs in fresh. `SITE_URL` added as a
manually-configured Edge Function secret (not auto-injected); its absence degrades gracefully
(falls back to Supabase's own default Site URL) rather than failing the function outright.

**Known rough edge, flagged rather than assumed away:** `generateLink`'s `redirectTo` has open
GitHub issues against Supabase's own auth service (both a "not working" report and a separate
PKCE-flow compatibility issue) — found via WebSearch before finalizing the design, same
discipline as decisions #51/#53's live-verification catches. Needs an actual end-to-end click of
a real generated link once the Netlify deploy exists, not assumed to just work.

**Not yet verified live.** Needs, in order: the Netlify deploy actually done (W6, still
outstanding), `SITE_URL` set on the Edge Function, `invite-user` redeployed (changed again),
then one real invite clicked through end to end. `npm run typecheck`/`validate`/`build` all
confirmed clean.

**Cross-reference:** SPEC.md D36, §4.3.12; `supabase/functions/invite-user/index.ts`;
`src/pages/TeamManagement.tsx`; `netlify.toml`, `docs/DEPLOY-NETLIFY.md` (existing, unexecuted);
decision #53.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 54 — Email invite becomes a shareable link, not an auto-sent email (D36)
