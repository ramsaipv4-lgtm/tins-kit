---
id: decision-phase-a-acceptance-rows-land-ac-247-to-ac-253
solves: phase A acceptance rows land (AC-247 to AC-253)
triggers: phase A acceptance rows land (AC-247 to AC-253)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# phase A acceptance rows land (AC-247 to AC-253)

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-18: phase A acceptance rows land (AC-247 to AC-253)

**Problem:** I-17 wrote the phase A rows as pending text, because the gate needs every row's check file to
exist and the test writer's checks were still on a branch.
**Choice:** the test writer's branch `games-phase-a` (tests 9ff8a84: one journey per row, the `games-hub`
seed and package, and one change to `results.journey.mjs` so it opens `/` before using the LMS navigation)
is merged to tests main right before this session closes, and the rows become table rows naming those
files. The test writer proved v1 unharmed (AC-49 core/switches 3/3, attendance 2/2), every §13 id named,
and each new check failing on main for the missing hub or game.
**Proof:** the gate on close passes (the new rows are not yet claimed, so the gate checks their files exist).
**Lesson for the rebuild course:** write the behaviour first and the row when its check exists; the order
lets the builder start while the checks are still being written.

## Evidence

- docs/build-journal/integration.md#I-18: phase A acceptance rows land (AC-247 to AC-253)
