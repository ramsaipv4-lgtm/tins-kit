---
id: decision-the-validators-9-expected-tables-check-is-hard-coded-not
solves: The validator's "9 expected tables" check is hard-coded, not derived from the spec
triggers: The validator's "9 expected tables" check is hard-coded, not derived from the spec
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The validator's "9 expected tables" check is hard-coded, not derived from the spec

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 5 — The validator's "9 expected tables" check is hard-coded, not derived from the spec

**What changed.** `scripts/validate.mjs` has `const EXPECTED_TABLES = ['users', 'locations',
'vendors', 'skus', 'batches', 'movements', 'sales', 'price_history', 'audit_log'];`. It does not
parse the spec to derive this list.

**Why.** The kit's pattern is "the validator checks the artefact, not the spec." A consumer
validator that parses the spec to derive its own checks is fragile (spec changes, validator
behaves unexpectedly). The 9-table list is the V1 truth; a future migration that adds a table
(SPEC §9 anti-pattern, but Mode C may add one) will require updating the validator's list
explicitly. That is intentional friction.

**Impact on downstream.** Future migrations that add or rename a table must update
`EXPECTED_TABLES` in the validator. The validator's output names the missing table by name, so
the failure is loud.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 5 — The validator's "9 expected tables" check is hard-coded, not derived from the spec
