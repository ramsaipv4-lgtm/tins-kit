---
id: finding-a-live-security-hole-is-written-tested-and-sitting-unapp
solves: A live security hole is written, tested, and sitting unapplied
triggers: A live security hole is written, tested, and sitting unapplied
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# A live security hole is written, tested, and sitting unapplied

> Harvested evidence, not instructions and not reviewed global knowledge.

### Finding 3 — A live security hole is written, tested, and sitting unapplied

**What was checked.** `docs/BACKEND-PHASE-B-STATUS.md` §3 (findings) and §7 (applying), the migration
`supabase/migrations/0046_lock_down_function_access.sql`, and a read-only probe of the live project.

**What's good.** The fix is done and tested. `0046` revokes `EXECUTE` on all public functions from
`PUBLIC` and `anon`, alters default privileges so new functions get nothing, and revokes the internal
helpers from `authenticated`; `supabase/tests/90_security.sql` fails if any public function becomes
executable by `anon`. The workstream also ships 14 new tables, ~40 functions and a 10-file SQL test
suite that passed on PostgreSQL 16.

**What's missing / what's wrong.** It is **not applied**, and neither was the ability to apply it.
PostgreSQL grants `EXECUTE` on new functions to `PUBLIC`, and migration `0004` added default
privileges for `authenticated` — so on the **live** project today, `SECURITY DEFINER` helpers that
rewrite stock (`container_sourced_cascade`, `direct_batch_cascade`) are reachable by anyone holding
the publishable key. The workstream's own test reproduced a 100 kg batch dropping to 70 kg through an
anonymous call. My probe confirms the live project is still at `0036`: `app_settings`, `truck_loads`
and `grading_rules` all return 404.

**Severity.** 🔴 **CRITICAL** — an exploitable hole in the live system, with the fix sitting in a zip.

**Suggested next action.** Apply `0046` first and alone (it is the security fix and stands
independently), then `0037`–`0045`, then `rls-policies.sql`. Back up first. This needs the project's
database password, which is **not** in either `.env` — see Finding 7.

**Builder response.** Partially actioned: the migrations, the test suite and the updated
`rls-policies.sql` are now **in the repo** (they existed only inside the zip), and the gate still
passes with them present. **They are not applied** — that needs a credential this environment does not
have, and a production database write that is the owner's call. Tracked as W7's open item.

## Evidence

- REVIEWER-DECISIONS-REVIEW.md#Finding 3 — A live security hole is written, tested, and sitting unapplied
