---
id: decision-the-seed-inserts-users-with-on-conflict-id-do-nothing-no
solves: The seed inserts users with `ON CONFLICT (id) DO NOTHING`, not via the `handle_new_user` trigger
triggers: The seed inserts users with `ON CONFLICT (id) DO NOTHING`, not via the `handle_new_user` trigger
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The seed inserts users with `ON CONFLICT (id) DO NOTHING`, not via the `handle_new_user` trigger

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 2 — The seed inserts users with `ON CONFLICT (id) DO NOTHING`, not via the `handle_new_user` trigger

**What changed.** The seed has fixed UUIDs for the 3 demo users (`a0000000-…-001`, `-002`, `-003`).
The trigger on `auth.users` (`handle_new_user`) would, on the first `auth.users` insert, create a
`public.users` row with `role='admin'` (because the count is 0); on the second and third, it would
default to `'worker'`. The seed instead inserts the 3 `public.users` rows directly with `ON CONFLICT
(id) DO NOTHING`, and the matching `auth.users` rows are created via the Supabase admin API (out of
band, in `helpers/seed-users.mjs` — to be written in W2 when the auth layer is built).

**Why.** Two reasons:
1. The trigger's "first user is admin" rule is for self-signup, not for the seeded demo. The seed
   wants specific roles for specific users.
2. Idempotency: if `auth.users` is created before the seed runs, the trigger fires once for each
   user. The seed then has to UPDATE the resulting `public.users` rows. `ON CONFLICT DO NOTHING` on
   the seed insert is the cleaner pattern: the seed's INSERT is the source of truth for
   `public.users`; the trigger is the safety net for production signups.

**Impact on downstream.** `helpers/seed-users.mjs` is a W2 task. Until that script is written, the
seed leaves 3 `public.users` rows with no matching `auth.users`. RLS still works (the rows exist);
login is blocked until the auth rows are created.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 2 — The seed inserts users with `ON CONFLICT (id) DO NOTHING`, not via the `handle_new_user` trigger
