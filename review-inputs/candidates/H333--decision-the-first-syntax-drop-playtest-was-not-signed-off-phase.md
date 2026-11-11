---
id: decision-the-first-syntax-drop-playtest-was-not-signed-off-phase
solves: the first Syntax Drop playtest was not signed off; phase A of g-3 (screens, wording, hub)
triggers: the first Syntax Drop playtest was not signed off; phase A of g-3 (screens, wording, hub)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# the first Syntax Drop playtest was not signed off; phase A of g-3 (screens, wording, hub)

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-17: the first Syntax Drop playtest was not signed off; phase A of g-3 (screens, wording, hub)

**Problem:** the owner's first 10-minute playtest of Syntax Drop (AC-243) ended without a sign-off. Notes:
the wording was not familiar to young Indian learners; only one level seemed to exist (levels 2 and 3 were
locked and shown as plain "(locked)" text); no way out after losing, no menu or Back; dialogue controls
were keys only; the level picker after the prologue looked like a plain web page; the instructions used game
words a non-player does not know and did not show the keys; no full screen; simple graphics; no voice.
**Choice (owner):** g-3 grows into three phases (D-71). Phase A (this session) adds: a hub in the layout
patterns of the big kids' game platforms (D-70: rail or tab bar, top bar, Home rows "Continue playing",
"Recommended for you" from the weakest mastery concepts, "New this week", "All games", a reserved "Live"
row; a game page with one Play button and the full level path with unlock hints); a way out in every
status (`retry`, `back`, `quit`); a dialogue bar (`previous`, `next`, `pause`, `autoplay`, `skip`, tap to
advance); `fullscreen`; how to play with key caps and a self-running demo per action; the wording rule
(D-69). D-68: no copyleft code or assets ship in the app, so voice (phase B) is offline recordings plus the
device voice. The phase A acceptance rows (AC-247 to AC-253) are written as pending text until the test
writer's checks land, because the gate needs each row's check file to exist.
**Proof:** the gate on close passes.
**Lesson for the rebuild course:** a playtest by someone outside the build finds what no acceptance row asked
for: the way out, the words, and whether the player can even see that more levels exist.

## Evidence

- docs/build-journal/integration.md#I-17: the first Syntax Drop playtest was not signed off; phase A of g-3 (screens, wording, hub)
