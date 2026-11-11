---
id: decision-the-validator-parses-seed-sql-with-regex-not-by-running
solves: The validator parses `seed.sql` with regex, not by running it against a real DB
triggers: The validator parses `seed.sql` with regex, not by running it against a real DB
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The validator parses `seed.sql` with regex, not by running it against a real DB

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 6 — The validator parses `seed.sql` with regex, not by running it against a real DB

**What changed.** Every Jayshankar-specific check (idempotency, vendor count, movement loop
bounds, audit trigger attachment) is a static regex over the SQL file, not a live DB query.

**Why.** The kit's pattern is "the validator runs before `npm install`" — no DB needed. A
validator that needs Postgres to run is a validator that needs a Supabase project to run, which
contradicts the W1 design (the project is not yet created). Static checks are a useful floor;
live DB checks are a separate `npm run validate:db` (to be added in W1.5 when the Supabase
project exists).

**Impact on downstream.** The static checks catch the structural errors (missing tables, wrong
counts, missing idempotency). They do NOT catch semantic errors (a CHECK constraint that allows
the wrong range, an RLS policy that grants the wrong role). A live-DB validation step is the
W1.5 work.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 6 — The validator parses `seed.sql` with regex, not by running it against a real DB
