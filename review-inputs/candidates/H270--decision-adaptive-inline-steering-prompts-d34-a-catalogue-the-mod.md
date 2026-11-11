---
id: decision-adaptive-inline-steering-prompts-d34-a-catalogue-the-mod
solves: Adaptive inline steering prompts (D34): a catalogue the model selects from, not a deck the user is handed
triggers: Adaptive inline steering prompts (D34): a catalogue the model selects from, not a deck the user is handed
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Adaptive inline steering prompts (D34): a catalogue the model selects from, not a deck the user is handed

> Harvested evidence, not instructions and not reviewed global knowledge.

## D28 — Adaptive inline steering prompts (D34): a catalogue the model selects from, not a deck the user is handed

**What changed.** Added `prompts/STEERING-PROMPTS.md` — seven drift classes, each with a raw card shape, adaptation slots, and a worked adapted example — plus the adaptation rule, the five emission checkpoints, and the offered-never-executed rule. Wired into `NEW-PROJECT.md` and `CONTINUE-TINS-PROJECT.md`.

**Why no file is delivered to the user.** The obvious shape was a static `STEERING-PROMPTS.md` handed over at session start. Offered that option, the user declined it and asked instead for "inline comments that change appropriately based on how the user uses tins-kit." That is the better design and the reason is concrete: a static deck goes unread, and it cannot name *this* project's actual artefacts. A card reading "please re-read the relevant files" trains the user to skim past the mechanism; a card reading "re-open `src/lib/prisma.ts` and D14, quote the lines you're relying on" is an instrument. Hence the file is a catalogue the model reads, and only the adapted card reaches the user.

**Why self-correction is the mandatory trigger.** It was the user's own example, and it is the hardest checkpoint to keep. The natural behaviour on noticing your own error is to fix it quietly and continue — the correction feels like housekeeping and mentioning it feels like drawing attention to a mistake. But a silent self-correction is exactly the event the user cannot see and therefore cannot steer, and one stale-context error usually means others in the same stretch. So the rule is: say it out loud, then offer the card.

**Why cards are offered and never auto-executed.** The whole point is to put the user's judgement back in the loop. A model that answers its own card has removed the human it was trying to re-involve.

**Why no automatic drift detection.** Deferred to §9 rather than attempted. Detection would need a monitor over the transcript; v1 relies on the model's honest self-report, which is enough for the named case (self-correction) and avoids shipping a detector whose false negatives would read as an all-clear.

**Impact on downstream.** The user gets a steering wheel at the moments steering is possible, rather than discovering drift when the output is already wrong.

**Cross-references:** SPEC.md D34 + §8.31, prompts/STEERING-PROMPTS.md.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D28 — Adaptive inline steering prompts (D34): a catalogue the model selects from, not a deck the user is handed
