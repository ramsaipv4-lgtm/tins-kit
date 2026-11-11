---
id: decision-a-sixth-syntax-drop-feel-number-outside-the-tuning-table
solves: a sixth Syntax Drop feel number outside the Tuning table (from g-3)
triggers: a sixth Syntax Drop feel number outside the Tuning table (from g-3)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# a sixth Syntax Drop feel number outside the Tuning table (from g-3)

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-16: a sixth Syntax Drop feel number outside the Tuning table (from g-3)

**Problem:** after I-15 moved five feel numbers into §13.9, the orchestrator's check of g-3 found two more
uses of one number in the game's model: `r() < 0.25` decides whether an extra rest beat comes before the next
piece (strike and fill). The builder's grep looked for the five named values, so it missed an unnamed one.
**Choice (owner):** a Tuning row `syntaxDrop.restChance` 0.25 (value unchanged; `tuning.ts` gains it in the
same session), and §13.9 now requires a unit test that fails on any bare decimal literal or `r() <`
comparison in a game's `model.ts` that does not come from `TUNING`; g-3 writes that test and reads the row.
**Proof:** the gate on close passes (tuning unit test 2/2 before close).
**Lesson for the rebuild course:** a rule that is checked only by a person reading code ("every feel number
is in the table") will be broken; turn it into a test.

## Evidence

- docs/build-journal/integration.md#I-16: a sixth Syntax Drop feel number outside the Tuning table (from g-3)
