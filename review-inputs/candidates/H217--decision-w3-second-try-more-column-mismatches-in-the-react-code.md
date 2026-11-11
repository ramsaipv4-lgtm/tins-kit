---
id: decision-w3-second-try-more-column-mismatches-in-the-react-code
solves: W3 second-try: more column mismatches in the React code
triggers: W3 second-try: more column mismatches in the React code
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# W3 second-try: more column mismatches in the React code

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 22 — W3 second-try: more column mismatches in the React code

**What changed.** The Delivery form's insert was sending
`expected_shelf_life_hours` to the `batches` table, which doesn't have that
column — the schema has shelf life on `skus` (`shelf_life_hours`) and the
batch's `expires_at` is implicit. The Floor dashboard's active-batches query
selected `received_at` (column is `delivered_at`) and `expires_at` (column
doesn't exist). The user's delivery submit failed with
`Could not find the 'expected_shelf_life_hours' column of 'batches' in the schema cache`.

**The fix.**
- `recordDelivery` no longer sends `expected_shelf_life_hours`. The shelf
  life input is removed from the DeliveryForm (W3 ships without per-batch
  shelf-life override; the SKU's shelf life is the canonical one).
- FloorDashboard's active-batches query now selects `delivered_at` (not
  `received_at`) and drops `expires_at` from the SELECT. The dashboard
  computes `expires_at` in JavaScript as `delivered_at + skus.shelf_life_hours`
  via a small `expiresAt(batch)` helper.

**Why this is the second W3 column mismatch in a row (decision 21 was the
first).** Both W2 and W3 wrote React code that *guessed* column names rather
than reading the migration. The migration's `0001_init.sql` is the source of
truth, but I wrote the React queries from memory of what the schema "should
look like" instead of grepping the migration first. This is the
"AI-augmented engineer" failure mode: confident, plausible, wrong.

**The deeper cause.** I have no compile-time link between the migration
files and the React code. TypeScript would catch `s.name` vs `s.english_name`
if the `Sku` interface were auto-generated from the Supabase schema
(`supabase gen types typescript` per SPEC §0.2). I haven't run that yet
because the project doesn't have the Supabase CLI configured, and the spec
generator requires a live database. Pilot work item: run `supabase gen types
typescript --linked` once at the start of every W item, commit the
generated `src/types/database.ts`, and have every React file import its
row types from there. That kills this class of bug at compile time.

**Impact on downstream.** W3 is now column-clean. The W2/W3 lesson: "the
migration is the source of truth" is true at the spec level, but the React
code needs an enforced link (typegen) to make it true at the type level.
Pilot-mode work item.

**Kit-level implication.** `tins-kit/SPEC.md` should call out the typegen
step as part of every consumer's W0 (project setup). The `seed-auth-users.mjs.template`
already uses fetch + manual types because it's zero-dep, but the React code
can use typegen without losing the zero-dep discipline on scripts/.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 22 — W3 second-try: more column mismatches in the React code
