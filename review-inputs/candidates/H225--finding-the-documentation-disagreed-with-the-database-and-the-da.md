---
id: finding-the-documentation-disagreed-with-the-database-and-the-da
solves: The documentation disagreed with the database, and the database was right
triggers: The documentation disagreed with the database, and the database was right
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The documentation disagreed with the database, and the database was right

> Harvested evidence, not instructions and not reviewed global knowledge.

### Finding 1 — The documentation disagreed with the database, and the database was right

**What was checked.** `HANDOVER.md` §1 and §2 against a live read-only probe of the Supabase project
(`scripts/probe-db.mjs`, plus per-table REST probes).

**What's good.** The database is healthy and further along than the docs claimed: 14 core tables,
36 migrations applied, 130 SKUs, 12 vendors, 198 movements, 42 sales, 150 price-history rows. The
schema, RLS and triggers are real and in use.

**What's missing / what's wrong.** `HANDOVER.md` §1 read *"Nothing is built yet. The spec defines
Mode A (Demo) as the first deliverable"* and *"17 locked decisions in SPEC §0.2"*; §2 read
*"Supabase project NOT YET CREATED — W1 task"*. All three were false. A next session reading the
handover file first — exactly as `AGENTS.md` instructs — would have concluded the project was
unstarted and begun re-deriving a system that already runs.

**Severity.** 🔴 **CRITICAL** — the file every session is told to read first was wrong about the most
basic fact in the project.

**Suggested next action.** Correct §1 and §2 in the same commit as the next change; treat
"HANDOVER's state snapshot matches a live probe" as part of the handover protocol, not an optional
nicety.

**Builder response.** Fixed in this session: §1 now says Mode A is built and names what came after
it, §2's four stale rows are corrected against the probe, and the queue gained W7–W9. The verdict on
the underlying cause is in Finding 7 — the corrections were possible only because a *human* asked
the right question, which is not a mechanism.

## Evidence

- REVIEWER-DECISIONS-REVIEW.md#Finding 1 — The documentation disagreed with the database, and the database was right
