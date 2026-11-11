---
id: decision-the-gate-printed-only-the-last-30-lines-of-a-failing-uni
solves: the gate printed only the last 30 lines of a failing unit-test run
triggers: the gate printed only the last 30 lines of a failing unit-test run
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# the gate printed only the last 30 lines of a failing unit-test run

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-14: the gate printed only the last 30 lines of a failing unit-test run

**Problem:** g-0's first close failed with one unit-test failure, but the gate printed only the last
30 lines of `node --test` output, which did not name the failing test. Four reruns passed (351/351), so the
flake could not be identified afterwards.
**Cause:** `scripts/gate.mjs` step 3 kept nothing of the unit run except that tail; the acceptance step
already saved its full TAP to `.tins/state-gate-last.tap`, the unit step did not.
**Choice (D-67):** run the unit step with `--test-reporter=tap` and write its full stdout and stderr to
`.tins/state-gate-unit.tap` on every run, pass or fail (ignored by `.tins/state*` in `.gitignore`); on a
failure the terminal still shows the tail and then names the file. Same session: SPEC §13.4's Snek limits
now state the owner's rulings that `ops` on a `TooManySteps` stop is the first value over `maxOps`
(not clamped; measured 1002 for `while True: pass` and 4996 for a `sorted` loop with `maxOps` 1000) and that
`peakCells` counts a string by its length.
**Proof:** the gate on close passes and leaves `.tins/state-gate-unit.tap` holding every unit test's line.
**Lesson for the rebuild course:** keep the full output of every check a gate runs, not only the part
shown on screen; a flaky failure you cannot name is a failure you cannot fix.

## Evidence

- docs/build-journal/integration.md#I-14: the gate printed only the last 30 lines of a failing unit-test run
