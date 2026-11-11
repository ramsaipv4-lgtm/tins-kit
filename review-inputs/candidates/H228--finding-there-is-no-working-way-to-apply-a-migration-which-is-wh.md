---
id: finding-there-is-no-working-way-to-apply-a-migration-which-is-wh
solves: There is no working way to apply a migration, which is why the Phase B fix has sat unused
triggers: There is no working way to apply a migration, which is why the Phase B fix has sat unused
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# There is no working way to apply a migration, which is why the Phase B fix has sat unused

> Harvested evidence, not instructions and not reviewed global knowledge.

### Finding 7 — There is no working way to apply a migration, which is why the Phase B fix has sat unused

**What was checked.** Every script in `scripts/`, both `.env` files (key names only), the kit's
`tins-kit/scripts/migration-runner.mjs`, `docs/SUPABASE-SETUP.md` §"Applying", and what tooling is
installed.

**What's good.** The workstream produced a genuinely strong apply story in prose:
`docs/BACKEND-PHASE-B-STATUS.md` §7 gives the exact order, the "stop at the first error" rule, the
back-up instruction, and the one migration that touches an existing business function (`0045`).

**What's missing / what's wrong.** Nothing executable backs it. The 20 scripts in `scripts/` reach
Supabase through PostgREST with the service key, which **cannot execute DDL** — there is no apply
script and none is possible with those credentials. The kit *does* ship a runner, but it needs
`DATABASE_URL` (a direct Postgres connection string) and the `pg` package, and neither is present:
`.env` holds only `VITE_SUPABASE_URL` + publishable key, `scripts/.env` holds the URL, publishable
key, secret key and JWKS URL — **no database password, no access token**. `psql`, `pg_dump` and the
Supabase CLI are all absent, and `pg` is not installed. The kit's runner also has a real defect: it
calls `require('node:crypto')` inside an ESM module, which throws immediately (`require is not
defined`) before it can apply anything.

So the honest statement is: Phase B could not have been applied in this environment by any script
that exists, which is why a tested security fix sat unapplied.

**Severity.** 🔴 **CRITICAL** — it is the reason Finding 3 persists, and it will block every future
schema change, not just Phase B.

**Suggested next action.** Two things, neither of them a guess: (1) the project needs a documented
apply path with the one missing value named (`DATABASE_URL`, from Supabase's Database → Connection
string, or a Personal Access Token for the Management API) — the owner supplies the value, the repo
supplies the command; and (2) the kit's runner defect should be reported upstream via
`tins-kit/prompts/KITTING.md`, since the kit is read-only for consumers.

**Builder response.** Partially actioned. The migrations are staged in the repo; the run order and the
missing credential are documented in `docs/BACKEND-PHASE-B-STATUS.md` §7 and
`docs/SUPABASE-SETUP.md`; the runner defect is recorded in `BUILDER-DECISIONS-REVIEW.md` as a
kit-growth candidate. **Applying them is outstanding and blocked on the password** — the owner has
approved the change, so the only missing input is the value.

## Evidence

- REVIEWER-DECISIONS-REVIEW.md#Finding 7 — There is no working way to apply a migration, which is why the Phase B fix has sat unused
