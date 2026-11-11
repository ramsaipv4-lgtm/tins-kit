---
id: decision-the-rls-file-has-a-separate-rls-policies-sql-not-bundled
solves: The RLS file has a separate `rls-policies.sql`, not bundled in `0001_init.sql`
triggers: The RLS file has a separate `rls-policies.sql`, not bundled in `0001_init.sql`
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The RLS file has a separate `rls-policies.sql`, not bundled in `0001_init.sql`

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 7 — The RLS file has a separate `rls-policies.sql`, not bundled in `0001_init.sql`

**What changed.** The RLS policies are in a separate file, applied after the migration. The
migration creates the tables and functions; the RLS file enables RLS and creates the policies.

**Why.** RLS policies reference `public.current_user_role()`, a function that's not strictly
required by the migration. Splitting the file lets a future migration add a new table without
having to also re-issue the RLS policies. It also makes the RLS rules easier to audit (a
reviewer reads `rls-policies.sql` and sees every policy in one place).

**Impact on downstream.** The user must apply both files (`0001_init.sql` then `rls-policies.sql`)
when setting up a new Supabase project. The W1.5 task list will document this; for now the
`validate.mjs` runs both files independently.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 7 — The RLS file has a separate `rls-policies.sql`, not bundled in `0001_init.sql`
