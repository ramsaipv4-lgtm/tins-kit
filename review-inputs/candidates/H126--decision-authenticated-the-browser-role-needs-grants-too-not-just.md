---
id: decision-authenticated-the-browser-role-needs-grants-too-not-just
solves: `authenticated` (the browser role) needs GRANTs too, not just `service_role`
triggers: `authenticated` (the browser role) needs GRANTs too, not just `service_role`
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# `authenticated` (the browser role) needs GRANTs too, not just `service_role`

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 16 — `authenticated` (the browser role) needs GRANTs too, not just `service_role`

**What changed.** New migration `0004_grant_authenticated.sql` (and the parallel
`0003_grant_authenticated.sql` in the kit pattern) that GRANTs `authenticated`
the same privileges as `service_role` got in decision 11. Added the
`js-grant-authenticated` validator check. Updated `docs/SUPABASE-SETUP.md`
with the 6-file run order and the new error row. Updated the kit pattern
(`tins-kit/lib/patterns/supabase-auth-trigger.md`) to include this as
Lesson 4 and to renumber its file sequence (File 3 = GRANT_authenticated,
shift the others down by 1).

**Why.** W2 first try: the user could sign in (the publishable key + auth.uid()
worked), but the very next call — `useSession`'s `from('users').select(...)`
in `src/lib/auth.ts` — failed with `SQLSTATE 42501: permission denied for table users`.
Same error as decision 11, different role. The browser code (with a signed-in
user) runs as `authenticated`, not `service_role`. The W1.5 0003 only GRANTed
to `service_role`; the publishable key didn't get any GRANTs.

**Why default Supabase GRANTs aren't enough.** A fresh Supabase project has
`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,
authenticated, service_role` set up by the project init. So in a fresh
project, `authenticated` gets GRANTs automatically. But:
- If the project was created with a custom schema setup, the defaults may
  not be there.
- If the `public` schema was dropped and recreated (the W1.5 reset recipe),
  the defaults may have been lost.
- If the project was upgraded from a pre-2024 Supabase version, the defaults
  may not include `authenticated`.

So we can't rely on the defaults. The pattern is: explicitly GRANT to both
`service_role` AND `authenticated` in your migration.

**The validator pins the design.** New check `js-grant-authenticated` greps for
any GRANT to `authenticated` in the migration text. A future contributor who
adds a new table but forgets the GRANT will fail the gate. The check
co-exists with `js-grant-service-role` from decision 11.

**Impact on downstream.** The user does NOT need a full reset for this one.
0004 is additive (just GRANTs). After applying it, refresh the browser tab
and Check 1 should pass.

**What the user has to do.** Just run `0004_grant_authenticated.sql` in the
SQL Editor (no reset needed), then refresh the browser. The useSession
`from('users').select(...)` will now succeed.

**Kit-level implication.** This is the **fourth** hard Supabase lesson from
W1.5+W2:
1. Decision 8: drop the FK, use triggers
2. Decision 10: trigger must read every NOT NULL field
3. Decision 11: service_role needs GRANTs (BYPASSRLS ≠ GRANTs)
4. Decision 16: authenticated needs GRANTs too — and the default
   `ALTER DEFAULT PRIVILEGES` on the `public` schema isn't reliable enough
   to omit the explicit GRANT.

The kit pattern now has all 4 bundled. The recommended migration sequence
is 4 files (0001 + 0002 GRANTs_service + 0003 GRANTs_authenticated +
your-migration), and the run order in `docs/SUPABASE-SETUP.md` reflects this.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 16 — `authenticated` (the browser role) needs GRANTs too, not just `service_role`
