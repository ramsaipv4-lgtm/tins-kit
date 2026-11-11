---
id: decision-migrate-supabase-api-key-naming-anon-service-role-publis
solves: Migrate Supabase API key naming: `anon` / `service_role` → `publishable` / `secret`
triggers: Migrate Supabase API key naming: `anon` / `service_role` → `publishable` / `secret`
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Migrate Supabase API key naming: `anon` / `service_role` → `publishable` / `secret`

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 9 — Migrate Supabase API key naming: `anon` / `service_role` → `publishable` / `secret`

**What changed.** All four Surfaces now use Supabase's new key-naming convention (the one
shipped with `@supabase/server`):
- `.env.example` documents `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
  `SUPABASE_JWKS_URL` (the JWKS URL is new — used by `@supabase/server` for JWT verification).
- `scripts/seed-auth-users.mjs` reads `SUPABASE_SECRET_KEY` (it does **not** fall back to
  the old `SUPABASE_SERVICE_ROLE_KEY` name — silently accepting both would mask config drift).
- `scripts/validate.mjs` `js-env-example` check now greps for `SUPABASE_SECRET_KEY`.
- `SPEC.md` §3.2 (Secrets table row) reflects the new names.
- `docs/SUPABASE-SETUP.md` rewritten to point at the new **API Keys** panel.
- `AGENTS.md` standing rule #4 updated (paraphrased the old name for grep continuity).

**Why.** `service_role` and `anon` are still accepted at the API level, but Supabase's current
docs and the `@supabase/server` package use the new names. "Secret" is a clearer name than
"service_role" for a key that bypasses RLS. Going forward in W3+ (the app build) we want
the docs and the runtime env to match — the next person to read `@supabase/server`'s
README shouldn't have to mentally translate `service_role` to `secret`.

**Trade-off accepted.** The old `service_role` name was already embedded in operator
muscle memory. We're choosing the forward-looking surface and committing to it. If a
contributor pastes the old name into `.env` they get a clean error from `seed-auth-users.mjs`
("SUPABASE_SECRET_KEY must be set") — no silent fallback.

**Validator stays green.** 66/66 checks pass. Selftest 9/9. The change is content-only,
not structural.

**Kit-level implication.** `tins-kit/lib/patterns/supabase-auth-trigger.md` (planned W2)
should also recommend the new naming, and `scripts/seed-auth-users.mjs.template` (planned
W2) should ship already on the new names — no one will hit the legacy naming through the
kit's quickstart.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 9 — Migrate Supabase API key naming: `anon` / `service_role` → `publishable` / `secret`
