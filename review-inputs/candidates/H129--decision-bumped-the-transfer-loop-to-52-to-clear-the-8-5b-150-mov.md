---
id: decision-bumped-the-transfer-loop-to-52-to-clear-the-8-5b-150-mov
solves: Bumped the transfer loop to 52 to clear the §8.5b "150+ movements" bar
triggers: Bumped the transfer loop to 52 to clear the §8.5b "150+ movements" bar
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Bumped the transfer loop to 52 to clear the §8.5b "150+ movements" bar

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 4 — Bumped the transfer loop to 52 to clear the §8.5b "150+ movements" bar

**What changed.** The spec's App A.4 says "~150 movements", broken down as 28 + 50 + 50 + 20 = 148.
The acceptance criterion §8.5b says "150+ movements". I bumped the transfer loop to 52 (was 50)
so the total is 150 exactly. The transfer count is in the spec's range ("2-4 transfers per day,
totalling ~50") and the 28 deliveries + 52 transfers + 50 sales + 20 spoilage = 150 is a cleaner
round number for the demo.

**Why.** The validator checks `>= 150`. The original 148 would fail. Bumping transfers by 2 is the
least-disruptive fix; the alternative (bumping sales to 52) would change the customer mix. Logged
in the seed's comment so a future session knows the deviation.

**Impact on downstream.** None. The transfer count in the dashboard widget shows "52 transfers
over 14 days" instead of "~50". Aesthetically identical.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 4 — Bumped the transfer loop to 52 to clear the §8.5b "150+ movements" bar
