---
id: decision-d34-4-3-12-the-user-invitation-edge-function-specified-b
solves: D34 + §4.3.12: the user-invitation Edge Function, specified before any code
triggers: D34 + §4.3.12: the user-invitation Edge Function, specified before any code
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# D34 + §4.3.12: the user-invitation Edge Function, specified before any code

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 51 — D34 + §4.3.12: the user-invitation Edge Function, specified before any code

**What changed.** SPEC.md gets a new locked decision (D34) and a new algorithm section
(§4.3.12) for the user-invitation workflow proposed in decision #50 — written and committed
*before* writing a single line of the actual Edge Function, at the user's explicit instruction.
Matches this project's own first principle more literally than usual: TINS means the spec is the
source, not a courtesy written up after the fact.

D34 states the real constraint driving the design: creating a brand-new login needs the
service-role/secret key, which must never reach the client (§4.1) — the first time this project
has needed logic that can't live inside a Postgres `SECURITY DEFINER` function, since creating
an `auth.users` row isn't something RLS or `SECURITY DEFINER` has any authority over at all;
it's a separate Auth Admin API surface. §4.3.12 specifies the exact workflow: verify the caller
using their *own* JWT (reusing the existing RLS boundary rather than hand-rolling a second
authorization check), only then construct a service-role-scoped client — inside the function,
never returned to the caller, never logged — call `inviteUserByEmail`, and let the *already-
existing* `handle_new_user()` trigger (fixed for `co-admin` in decision #46) do the rest with no
changes needed.

**One correctness catch, in the writing itself, worth recording.** The first draft of D34 quoted
§4.1 as saying something it doesn't actually say — misremembered from `HANDOVER.md`'s gotchas
section instead of read fresh from §4.1 itself. Checked before finalizing, not after: the real
§4.1 text is "the publishable key is the only thing shipped in the JS bundle. The secret key
never leaves the server," which is what D34 now actually quotes, with the audit-log-bypass
consequence correctly attributed to `HANDOVER.md`, not presented as if it were `SPEC.md`'s own
words. A small thing, but the exact kind of small thing spec-first discipline exists to catch —
a wrong quote in the source document is worse than an imprecise one in a chat reply, since the
spec is what everything downstream gets built against.

**Also closed while in the area, not a new problem:** `@capacitor/app` (decision #47) was
never logged in §4.4's dependency table, despite AGENTS.md's own rule that every new dependency
gets logged there. Added retroactively, noted as should-have-been-logged-at-the-time rather than
silently backfilled without saying so. §4.4 also now explains that Edge Functions are a
distinct artifact type from that table entirely (Deno runtime, not an npm dependency,
`supabase/functions/<name>/`) — worth stating explicitly since `invite-user` is the first one.

**When this changes.** The actual Edge Function code is next, built directly against this spec
rather than the other way around.

**Cross-reference:** SPEC.md D34, §4.3.12, §4.4; decision #50.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 51 — D34 + §4.3.12: the user-invitation Edge Function, specified before any code
