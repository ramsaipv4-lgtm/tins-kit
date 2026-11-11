---
id: decision-pull-forward-the-4-new-schemas-g36-g39
solves: Pull forward the 4 new schemas (G36–G39)
triggers: Pull forward the 4 new schemas (G36–G39)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Pull forward the 4 new schemas (G36–G39)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D15 — Pull forward the 4 new schemas (G36–G39)

**What changed.** Wrote 4 new `schemas/<name>.schema.json` files, all valid JSON Schema 2020-12:
- `tins-markers.schema.json` (G36) — validates the `<!-- TINS -->` and `<!-- ZS: -->` block.
- `locked-decisions.schema.json` (G37) — validates the §0.2 table structure.
- `handover.schema.json` (G38) — validates the HANDOVER header + W-item structure.
- `tins-spec-minimal.schema.json` (G39) — validates the minimum viable SPEC.md shape (§0, §1, §2, §4, §8, §9).

**Why.** The SPEC §2.2 promised these schemas; the gap analysis identified the gap. The schemas are for static artefacts only (D6, D22); runtime input validation is the consumer's responsibility (Zod, Valibot, etc.).

**Impact on downstream.** Consumers can use `ajv` to lint "is this a valid TINS file?" without writing their own parser.

**Cross-references:** SPEC.md §2.2 (the schemas layer), §8.18 (the acceptance criteria).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D15 — Pull forward the 4 new schemas (G36–G39)
