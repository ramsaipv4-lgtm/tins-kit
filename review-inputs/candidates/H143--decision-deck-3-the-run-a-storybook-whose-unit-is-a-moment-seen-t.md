---
id: decision-deck-3-the-run-a-storybook-whose-unit-is-a-moment-seen-t
solves: Deck 3, "The Run": a storybook whose unit is a moment seen through several roles
triggers: Deck 3, "The Run": a storybook whose unit is a moment seen through several roles
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Deck 3, "The Run": a storybook whose unit is a moment seen through several roles

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 99 — Deck 3, "The Run": a storybook whose unit is a moment seen through several roles

**What was asked.** A third frontend mock-up, "using your creativity… not restricted to the project or tins methodology",
as a new storybook that includes the new functionality from `SPEC-AMENDMENT-v3-truckload.md` and
`SPEC-AMENDMENT-v4-plan-md.md`, and to see *how* those would be created in the storybook format.

**The design decision that matters.** Decks 1 and 2 already vary the *paint*; a third re-skin would add nothing. What v3/v4
add is mostly about **who sees what** (blind receiving, a refused rep, a reviewer who cannot approve their own bill, an
offline queue, closed-by-default functions) — which a one-phone-per-step format cannot express. So deck 3 changes the
*format*: act → moment on a day's clock → lens (role, online/offline, switch on/off) → several devices drawn at once, with
a panel showing what the database function returned (absent keys struck through) and a spec margin giving each moment's
decision, acceptance criteria and honest build status. One truck load (invented vendors, one fixture) runs from planning to
payment; all 14 decisions D63–D76 are pinned to moments or, for D76, explicitly marked "not a screen".

**Choices worth knowing.**
- **Its own data and code, no dependency.** `src/lib/storybook-run/` has its own types; the deck imports nothing from decks
  1–2, uses no Tailwind and no Ant Design, and adds no package (so no SPEC §4.4 row is needed — checked). Plain CSS with a
  dawn/night shell and device interiors that always draw the light "paper" palette (the lesson of deck 2: the screen is the
  product being judged). Hand-drawn SVG icons.
- **Where v3 and Phase B disagree, it draws both** (Act 4: "Receiving seat — v3 role" vs "Flagged buyer — Phase B"; Act 7:
  five roles plus the exception vs five roles and a flag) instead of picking one. That is the owner's call (HANDOVER W12).
- **Status is taken from the amendments, not from the author's optimism**: each decision carries Not built / Built
  differently in Phase B / Matches Phase B / Open, copied from v3's 2026-10-02 status check and v4 §5–§6.
- **No service worker** (deck 2's generated worker precached a file the rename step removed). Built with a relative base
  (`VITE_BASE=./`) and verified from a deeply nested path.
- **"Blind" is made true in the data, not only on the screen.** A first draft drew black bars over vendor names that were
  still in the screen's data — a drawing of a guarantee, which is exactly what D65/D68 say is not enough. The blind views now
  contain no vendor or price (and the hidden landed-cost figure is masked), and `deck.test.ts` fails if that regresses; the
  test was confirmed to fail when the leak was put back.

**Defects found by testing, not by looking** (all fixed): the "Start at dawn" button's text was invisible (a reset rule
beating the button's colour on specificity); a lock icon rendered enormous because a rule sized *every* svg inside the
landed-cost block; on a phone a multi-device moment showed only the first device with no way to reach the others (the
device tabs were rendered but their CSS selector required a parent they were not inside); duplicate React keys once the
blind data was emptied; Vite on `/mnt/c` served stale files after edits (restart the dev server — already a recorded gotcha).

**Verification.** `tsc`, `npm run validate` (73), `npm run selftest`, 15 vitest invariants, a 138-combination layout sweep and
20 interaction checks on both the dev server and the production build. Bundle 243 KB / 77 KB gzipped.

**Not done.** Not published (no credentials here). Not shown to the client. Deck 1 and 2 were not changed. The deck draws
unbuilt behaviour (D63, D66, D69, D70) on purpose and labels it; the conflict-resolution screen is a proposal, not spec.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 99 — Deck 3, "The Run": a storybook whose unit is a moment seen through several roles
