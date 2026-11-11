---
id: decision-migration-0006-rls-the-container-model-schema-written-by
solves: Migration 0006 + RLS: the container model schema, written by the auditor, not delegated
triggers: Migration 0006 + RLS: the container model schema, written by the auditor, not delegated
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Migration 0006 + RLS: the container model schema, written by the auditor, not delegated

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 37 — Migration 0006 + RLS: the container model schema, written by the auditor, not delegated

**What changed.** New migration `supabase/migrations/0006_container_model.sql`: `warehouses`,
`bills`, `containers`, `container_fills`, `container_fill_items` tables; `locations.warehouse_id`
(backfill-safe NOT NULL add), `batches.bill_id` (nullable), `movements.container_fill_id`
(nullable) and `movements.kind` extended to include `repack`/`reversal`; a
`container_availability` view (`security_invoker = true`, so it respects the querying user's own
RLS rather than running as the view owner). `supabase/rls-policies.sql` updated: every existing
`admin`-only policy now also allows `co-admin` (D28's new role — without this, co-admin's whole
point, "full admin capability," would be false the moment RLS is checked); `movements`' INSERT
policy rewritten per-kind (delivery_in/sale unchanged; spoilage unchanged; `repack` added,
worker-includable; `transfer` restricted to admin/co-admin only, D29's cross-warehouse
repurposing; `reversal` deliberately on no direct-INSERT path at all — RPC-only, once built);
new SELECT/INSERT/UPDATE policies for the 5 new tables.

**Why written directly, not delegated to MiniMax — the one deliberate exception to this
session's whole pattern.** Every prior delegated task (T1–T4) was frontend/script code with no
write path to the live database. This changes a live Supabase schema. Given the stakes and that
I already had the exact column-by-column design from authoring `SPEC.md` myself, doing this
directly was the right call, not a process failure — matches this project's own tiered-judgement
spirit (mechanical-but-high-stakes work stays with the party that has the fullest context).

**A real sequencing conflict in the spec itself, resolved, not glossed over.**
`AGENT-BRIEF.md`'s phase order says "container model first, bills second" — but
`container_fills.bill_id` is a NOT NULL FK to `bills.id` (enforces the one-purchase-event-per-fill
rule, `SPEC.md` §4.2.12), so `bills` must exist before `container_fills` at the schema level
regardless of how the build phases were narratively ordered. This migration creates `bills`
first. `receiving_confirmations` (§4.2.15) is deliberately NOT in this migration — nothing else
has a hard FK dependency on it, so it's still deferred to a later task, matching phase 2.

**A correctness bug caught by not trusting my own first draft.** Assumed Postgres's
default-generated name for the original inline `movements.kind` CHECK constraint
(`movements_kind_check`) and wrote a `DROP CONSTRAINT IF EXISTS` against that name — then
reconsidered: if that assumption were wrong, `ADD CONSTRAINT` wouldn't fail, it would just stack
a second, looser constraint alongside the still-active original one, silently leaving `repack`/
`reversal` blocked with no error anywhere in the migration output. Rewrote it as a `DO` block
that finds the real constraint by its actual definition (`pg_constraint` + `pg_get_constraintdef`
matching on `kind` and `delivery_in`) rather than assuming a name. Worth remembering as a general
lesson: an unnamed inline CHECK's auto-generated name is a real thing to verify, not assume, the
same discipline this session already applied to application code (decision #34's `queryKey`
investigation) now applied to schema.

**Not yet done — the actual apply.** This project has no direct Postgres/psql connection from
the WSL2 auditor environment (`scripts/probe-db.mjs` confirmed read-only PostgREST access only)
— matching the established W1.5 pattern, the user applies `0006_container_model.sql` and the
updated `rls-policies.sql` via the Supabase Dashboard SQL Editor themselves, same as 0001–0005.
Static structural checks (`npm run validate`, `npm run selftest`) both confirmed green against
the file content; neither proves the SQL is live-correct until actually applied.

**When this changes.** Once applied, confirm via `scripts/probe-db.mjs` (extend its
`EXPECTED_TABLES` list) or a manual Supabase Dashboard check that all 5 new tables exist and
`locations`/`batches`/`movements` show the new columns. The C.4 timestamp fix and the
container-sourced FIFO algorithm (§4.3.8–§4.3.10) are the next task, sequenced after this schema
lands — see the delegation ledger.

**Applied and independently confirmed, 2026-09-10 (same day).** User ran `0006_container_model.sql`
then the updated `rls-policies.sql` via the Supabase Dashboard SQL Editor — both reported
success. Extended `scripts/probe-db.mjs`'s `EXPECTED_TABLES`/`COUNT_TABLES` lists (9 → 14) and
added a Step 2b checking the 3 new columns directly (a table existing doesn't prove every
`ALTER TABLE ADD COLUMN` in the same migration succeeded) — re-ran it rather than trust the
Dashboard's own success message, same discipline as every other verification this session.
Confirmed independently: all 14 tables present, all 3 new columns present, `warehouses` has
exactly 1 row (the `main` seed), the other 4 new tables correctly show 0 rows, and all
pre-existing Mode A data is untouched (6 vendors, 25 skus, 3 locations, 156 movements, 52 sales,
150 price_history, all 3 demo users). Schema is confirmed live and correct — the C.4/FIFO
algorithm work can now actually be tested against it, not just written blind.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 37 — Migration 0006 + RLS: the container model schema, written by the auditor, not delegated
