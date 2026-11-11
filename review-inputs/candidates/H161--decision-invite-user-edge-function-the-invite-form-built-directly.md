---
id: decision-invite-user-edge-function-the-invite-form-built-directly
solves: `invite-user` Edge Function + the invite form, built directly against §4.3.12
triggers: `invite-user` Edge Function + the invite form, built directly against §4.3.12
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# `invite-user` Edge Function + the invite form, built directly against §4.3.12

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 52 — `invite-user` Edge Function + the invite form, built directly against §4.3.12

**What changed.** `supabase/functions/invite-user/index.ts` — this project's first Edge
Function, implementing §4.3.12 exactly as specified rather than improvised against it: two
Supabase clients (one scoped to the caller's own JWT for verification, one built from the
service-role key only after that verification passes, never returned to the caller or logged),
role validation against the same 5-value list the database's own `users_role_check` enforces,
`inviteUserByEmail` with `role`/`display_name` in the invite's metadata so the existing
`handle_new_user()` trigger (already fixed for `co-admin`, decision #46) picks it up with zero
changes. `TeamManagement.tsx`'s placeholder "not available" box is replaced with a real form —
email, name, role — calling `supabase.functions.invoke('invite-user', ...)`, which attaches the
signed-in caller's own JWT automatically, matching exactly what the function verifies against.

**Not yet verified live — cannot be, from this environment.** No Supabase CLI exists in WSL2
(same gap that's applied to every migration this session), and unlike a SQL migration, an Edge
Function can't be "run" via PostgREST either — it has to actually be deployed (Supabase
Dashboard's Edge Functions UI, or the CLI) before it exists to call at all. `npm run
typecheck`/`validate`/`cap:sync` all confirmed clean; the actual invite flow — including whether
the invite email actually arrives, the one known limitation already flagged in §4.3.12 — is the
next thing to confirm once deployed, same handoff shape as every other live-database or
live-device step this session.

**Cross-reference:** `supabase/functions/invite-user/index.ts`, `src/pages/TeamManagement.tsx`,
SPEC.md §4.3.12/D34, decision #51.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 52 — `invite-user` Edge Function + the invite form, built directly against §4.3.12
