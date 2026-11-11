---
id: decision-drop-the-fk-on-public-users-id-auth-users-id-integrity-v
solves: Drop the FK on `public.users.id → auth.users(id)`; integrity via triggers
triggers: Drop the FK on `public.users.id → auth.users(id)`; integrity via triggers
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Drop the FK on `public.users.id → auth.users(id)`; integrity via triggers

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 8 — Drop the FK on `public.users.id → auth.users(id)`; integrity via triggers

**What changed.** The original `0001_init.sql` had `id uuid primary key references auth.users(id)
on delete cascade` on `public.users`. The seed inserts `public.users` rows with fixed UUIDs
(`a0000000-0000-0000-0000-000000000001` for admin, etc.) but the matching `auth.users` rows
do not exist yet (the user creates them later via Supabase Auth UI). The FK violation
(`23503: insert or update on table "users" violates foreign key constraint "users_id_fkey"`)
blocked the seed.

**Why drop the FK.** The `handle_new_user()` AFTER INSERT trigger on `auth.users` is the
actual source of truth for the auth→public mapping. It inserts a matching `public.users`
row when a new `auth.users` row is created via signup. The FK is redundant — and worse, it
creates a chicken-and-egg: to insert `public.users(id=X)` you need `auth.users(id=X)`, but to
create `auth.users(id=X)` you need to go through the trigger (which would create the public
row, but only for the `id` Supabase Auth generates, not for a UUID you choose).

**The fix.**
1. `public.users.id` is now `uuid primary key` (no FK).
2. `handle_new_user()` (existing) creates `public.users` rows on `auth.users` INSERT.
3. New `handle_user_delete()` AFTER DELETE trigger on `auth.users` removes the matching
   `public.users` row (so deleting an auth user no longer leaves an orphan).
4. The validator adds two new checks: `js-handle-del-trg` (trigger exists) and `js-noauthfk`
   (the FK is intentionally absent). This pins the design — a future contributor who
   re-adds the FK will fail the gate.

**Impact on downstream.** The seed now runs cleanly. The 3 fixed UUIDs in the seed are
"best-effort" placeholders; in production, the `handle_new_user` trigger creates the
public rows with the auth user's actual UUID. The seed can be used for demo / testing
without involving Supabase Auth.

**This is also a kit-level lesson.** The pattern "drop the FK, use triggers for auth→public
mapping" is non-obvious and any Supabase consumer with a seed would hit the same bug. The
next kit iteration (W2) should ship this as `tins-kit/lib/patterns/supabase-auth-trigger.md`.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 8 — Drop the FK on `public.users.id → auth.users(id)`; integrity via triggers
