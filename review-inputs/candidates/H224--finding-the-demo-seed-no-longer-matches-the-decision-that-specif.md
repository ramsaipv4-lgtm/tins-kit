---
id: finding-the-demo-seed-no-longer-matches-the-decision-that-specif
solves: The Demo seed no longer matches the decision that specifies it
triggers: The Demo seed no longer matches the decision that specifies it
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The Demo seed no longer matches the decision that specifies it

> Harvested evidence, not instructions and not reviewed global knowledge.

### Finding 4 — The Demo seed no longer matches the decision that specifies it

**What was checked.** SPEC §0.2 **D14** ("Demo data is real-schema, fake-content… 6 fishermen
vendors, 25 fish SKUs, 3 locations, 150+ movements over 14 days, 20+ sales, 30 days of price
history") against the live row counts.

**What's good.** The principle D14 asserts — real schema, fake content, seeded idempotently — is
honoured exactly. `supabase/seed.sql` exists and the figures are plausible wholesale data.

**What's missing / what's wrong.** The live database holds **12 vendors, 130 SKUs, 13 locations, 198
movements, 42 sales, 150 price-history rows** — about 5× the SKU count and 4× the locations D14 names.
That is not a bug: the schema grew (containers, D19; multi-warehouse, D20) and the seed grew with it.
The problem is that D14 still states the old figures, so a reader cannot tell "the seed drifted" from
"D14 is stale", and the next session re-derives the answer.

**Severity.** 🟡 **SHOULD-FIX** — costs a session's worth of doubt every time someone reads D14.

**Suggested next action.** Amend D14's figures to the current seed, or delete the counts and point at
the seed script as the authority. Do it in the same pass as the next `SPEC.md` amendment rather than
as a standalone edit.

**Builder response.** Not actioned, deliberately: folding an unrelated D14 correction into
`SPEC-AMENDMENT-v4-plan-md.md` would make that amendment harder to sign off, not easier. Recorded
here so it is not lost.

## Evidence

- REVIEWER-DECISIONS-REVIEW.md#Finding 4 — The Demo seed no longer matches the decision that specifies it
