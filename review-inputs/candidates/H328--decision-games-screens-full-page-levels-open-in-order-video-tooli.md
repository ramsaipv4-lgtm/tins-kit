---
id: decision-games-screens-full-page-levels-open-in-order-video-tooli
solves: games screens full-page, levels open in order, video tooling (owner decisions after phase A)
triggers: games screens full-page, levels open in order, video tooling (owner decisions after phase A)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# games screens full-page, levels open in order, video tooling (owner decisions after phase A)

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-19: games screens full-page, levels open in order, video tooling (owner decisions after phase A)

**Problem:** the hub screenshots showed the LMS header and its long space nav above the games hub; on a phone
they filled the whole first screen. The SPEC had no level-unlock rule, so no Syntax Drop level was ever locked
and the hub's lock badges and unlock hints never appeared. How to play left out `pause`. The owner also chose
HyperFrames for trailers and title cards, which needed a decision before any video file exists.
**Choice (owner):** D-79: a feature route may set `fullPage: true`; the shell then draws only that screen,
and the hub carries "Back to LMS" (`hub-nav-lms`). D-78: levels open in order (level n+1 when level n is won,
any stars), the class switch `games.unlockAll` (default off) opens all, test mode's playtest switch stays;
AC-201 seeds the wins (AC-203 opens level 1 of the suite's own packs, as its test always did; §13.11 corrected). How to play lists `pause`. D-80: HyperFrames 0.8.77 and GSAP 3.14.2 are
author-machine tools only (telemetry off; no cloud, publish or feedback), with one exception to D-43/D-61:
an optional hub-served cinematic prologue (at most 8 MB, cached, skippable, in-engine fallback), which gets
its own acceptance row before it is built. New rows AC-254 (full page) and AC-255 (levels in order); AC-49
gains `games.unlockAll`. This session changes the shell (`fullPage`), the FEATURE API comment and type, and
core switches; the test writer's checks land on tests main right before it closes.
**Proof:** unit tests 456/456 (core switches 13/13, with a D-78 test), web build OK; the gate on close passes.
**Lesson for the rebuild course:** a screenshot of the real screen at phone size settles layout questions
that no acceptance row had asked.

## Evidence

- docs/build-journal/integration.md#I-19: games screens full-page, levels open in order, video tooling (owner decisions after phase A)
