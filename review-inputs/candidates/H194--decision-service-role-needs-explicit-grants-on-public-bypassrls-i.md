---
id: decision-service-role-needs-explicit-grants-on-public-bypassrls-i
solves: `service_role` needs explicit GRANTs on `public.*` (BYPASSRLS is not enough)
triggers: `service_role` needs explicit GRANTs on `public.*` (BYPASSRLS is not enough)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# `service_role` needs explicit GRANTs on `public.*` (BYPASSRLS is not enough)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 11 — `service_role` needs explicit GRANTs on `public.*` (BYPASSRLS is not enough)

**What changed.** New migration `0003_grant_service_role.sql` GRANTs `service_role` the
table-level privileges (SELECT, INSERT, UPDATE, DELETE) on all tables, sequences, and
functions in `public`, plus ALTER DEFAULT PRIVILEGES so future tables also inherit them.

**Why.** W1.5 second-apply failed with `SQLSTATE 42501: permission denied for table users`
on the PATCH step. The 3 auth.users inserts had succeeded (the 0002 fix worked), but
`seed-auth-users.mjs` couldn't PATCH `public.users.role` because `service_role` had
BYPASSRLS but no table-level GRANTs. BYPASSRLS bypasses policies; it does not bypass the
table-level privilege check. The seed.sql works because it runs in the SQL Editor as
`postgres` (the schema owner); the script runs as `service_role` (a different Postgres
role).

**Why GRANT all on all tables** (not per-table). The script will need INSERT/UPDATE on
several tables (batches, movements, sales for W3+; users for W1.5). Granting per-table
means remembering to update the migration every time we add a table. The
"grant all on all tables" form + ALTER DEFAULT PRIVILEGES is forward-safe and matches
the Supabase-recommended pattern for service_role privileges.

**The validator pins the design.** New check `js-grant-service-role` greps for any GRANT
to service_role. The check is satisfied by per-table GRANTs, the schema-wide form, OR
ALTER DEFAULT PRIVILEGES — any of them is enough.

**Impact on downstream.** The user does NOT need a full reset for this one. 0003 is
additive (just GRANTs). Re-running `seed-auth-users.mjs` will now PATCH the 3 existing
public.users rows with the correct role/display_name. The script is idempotent — same
result as a fresh apply, no need to delete and recreate.

**What the user has to do.** Just run 0003 in the SQL Editor (no reset), then re-run
`seed-auth-users.mjs`. Expect "0 created, 3 updated, 0 failed."

**Kit-level implication.** This is the **third** hard Supabase lesson from W1.5:
1. Decision 8: drop the FK, use triggers
2. Decision 10: trigger must read every NOT NULL field
3. Decision 11: service_role needs GRANTs (BYPASSRLS ≠ GRANT)

The `tins-kit/lib/patterns/supabase-auth-trigger.md` (planned W2) should ship with all
three bundled, and the kit's `scripts/seed-auth-users.mjs.template` should include the
GRANTs migration inline so kit users can't hit the same wall.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 11 — `service_role` needs explicit GRANTs on `public.*` (BYPASSRLS is not enough)
