---
id: decision-handle-new-user-must-read-role-display-name-from-new-raw
solves: `handle_new_user()` must read role + display_name from `NEW.raw_user_meta_data`
triggers: `handle_new_user()` must read role + display_name from `NEW.raw_user_meta_data`
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# `handle_new_user()` must read role + display_name from `NEW.raw_user_meta_data`

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 10 — `handle_new_user()` must read role + display_name from `NEW.raw_user_meta_data`

**What changed.** New migration `0002_handle_new_user_meta.sql` replaces the
`handle_new_user()` function. The new body:
1. Reads `role` and `display_name` from `NEW.raw_user_meta_data` (jsonb) if present.
2. Falls back to the SPEC §2.2.2 first-user-becomes-admin rule if the meta is missing
   or invalid.
3. Synthesizes a display_name from the email local-part if no meta was supplied
   (guarantees NOT NULL — the original bug).

**Why.** W1.5 first-apply failed with `SQLSTATE 23502: null value in column "display_name"
of relation "users" violates not-null constraint`. The original `handle_new_user()` only
inserted `(id, email, role, created_at)` — it never set `display_name`, which is NOT NULL.
The 3 seed-auth-users.mjs calls all rolled back: 0 created, 3 failed.

**The seed script was also implicated.** `seed-auth-users.mjs` was sending
`user_metadata: { role, display_name }` in the Admin API call, but the trigger never read
`raw_user_meta_data`, so the supplied values were ignored. Now they flow through.

**The validator pins the design.** New check `js-handle-new-user-meta` greps the migration
text for `raw_user_meta_data` inside the `handle_new_user()` function body. A future
contributor who simplifies the trigger back to "insert without meta" fails the gate.
**The validator now reads all migrations in `supabase/migrations/`** (concatenated in
lexical order), not just `0001_init.sql`. This matches the live apply (Supabase CLI
applies them in order) and means future migrations (W3+) get checked too.

**Impact on downstream.** The seed now works against a live Supabase project. The
`handle_new_user()` trigger still does the right thing for UI-driven signups (no meta
supplied → first user becomes admin, subsequent become worker, display_name synthesized
from email). Idempotent: re-running 0002 is a no-op (CREATE OR REPLACE).

**What the user has to do.** Same reset → apply → seed flow, but the apply list is now
**4 files** (0001, 0002, rls, seed), not 3. `docs/SUPABASE-SETUP.md` step 3 is updated.

**Kit-level implication.** `tins-kit/lib/patterns/supabase-auth-trigger.md` (planned W2)
must lead with this: "if your `public.users` table has a NOT NULL field that the trigger
doesn't set, the trigger will fail to insert and roll back the auth.users INSERT. Read all
fields from `raw_user_meta_data` with a fallback." This is the second hard lesson from
W1.5 (after the FK drop in decision 8).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 10 — `handle_new_user()` must read role + display_name from `NEW.raw_user_meta_data`
