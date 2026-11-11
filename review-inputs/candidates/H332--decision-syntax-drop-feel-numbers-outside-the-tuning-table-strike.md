---
id: decision-syntax-drop-feel-numbers-outside-the-tuning-table-strike
solves: Syntax Drop feel numbers outside the Tuning table; strike misses; two SPEC gaps (from g-3)
triggers: Syntax Drop feel numbers outside the Tuning table; strike misses; two SPEC gaps (from g-3)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# Syntax Drop feel numbers outside the Tuning table; strike misses; two SPEC gaps (from g-3)

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-15: Syntax Drop feel numbers outside the Tuning table; strike misses; two SPEC gaps (from g-3)

**Problem:** g-3 kept five numbers that set Syntax Drop's feel (base beat 1.5 × `minBeatMs`, fall 3 beats,
fill gap 2 beats, bonus share 0.5, decoy share 0.25) in a `FEEL` constant in the game's model, outside the
§13.9 Tuning table that D-64 says holds every such number. Its journal also asked what
`extra.slots[].filled` holds and whether "Story so far" stays on the page during a replay, and pointed out
that a missed strike piece never returned, so one miss capped Knowledge at 1 star.
**Choice (owner):** the five values become `syntaxDrop.*` Tuning rows, values unchanged, and `tuning.ts`
gains them in the same session (its D-64 unit test compares the two); g-3 then reads them from `TUNING`.
§13.7.1: `filled` is the placed pieceId or null; a non-decoy piece that reaches the line unpressed is a Skill
miss (shield chip) and comes back later in the round in both modes, so its concept is still asked; wrong
keys and struck decoys stay Knowledge mistakes. §13.3: a scene replayed from "Story so far" plays above the
arcade, which stays on the page. The owner confirms or changes the strike rule after the playtest.
**Proof:** the gate on close passes (tuning unit test 2/2 before close).
**Lesson for the rebuild course:** a game's feel lives in numbers; if one number escapes the single tuning
table, retuning silently stops covering it.

## Evidence

- docs/build-journal/integration.md#I-15: Syntax Drop feel numbers outside the Tuning table; strike misses; two SPEC gaps (from g-3)
