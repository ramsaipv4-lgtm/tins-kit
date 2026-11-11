---
id: decision-make-the-third-deck-comparable-and-lighter-shared-data-p
solves: Make the third deck comparable and lighter: shared data, persona walks in all three decks, one address format
triggers: Make the third deck comparable and lighter: shared data, persona walks in all three decks, one address format
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Make the third deck comparable and lighter: shared data, persona walks in all three decks, one address format

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 100 — Make the third deck comparable and lighter: shared data, persona walks in all three decks, one address format

**The owner's review of deck 3** (decision 99), in their words: no point of comparison with the other two; too
information-heavy for a client who may not read it ("a good decision" in format, though); the idea should be **present in
the other decks too** — a simulation where you *are* the admin (desktop and phone), the person who went to buy (mobile only),
the one checking the load at the warehouse and recording the discrepancy, the grader, the person told to package an amount
and deliver it to a location, "and so on for all foreseeable features and scenarios and end-to-end workflows", from the client
QA and the existing app; and **all three interlinked**, with a repo name like the others.

**What it meant.** A third look only helps D67 if it draws *the same content* as the first two; deck 3 had its own content, so
there was nothing to compare. And "the Run in the other decks" is not the Run's UI (moments, lenses, database panel) but its
*idea*: walk it as a person. So the fix was a shared data layer, not a port.

**What was built.**
- **Twelve persona walks** (`src/lib/storybook/journeys/`), as ordinary chapters in a new first group `journeys`. Built from the
  existing 104 screens (never contradicting them) plus ~30 new screens for what the deck lacked: the v3/v4 features (trip task,
  load start, manifest, offline queue and its replay, blind receiving at the scale, truck-load board with landed cost,
  approvals on phone and desk, access, mode settings), things the app already does but the deck never drew (repack, search,
  warehouse transfer, floor home, learn), a credit-limit warning and a WhatsApp bill share, and — **marked "Proposed" on the
  screen** — delivery tracking and proof of delivery, which the app does not have. Personas are jobs mapped to the five roles
  (D72: no sixth role); one is on the desktop, eleven phone-only, per the request.
- Because they are chapters, **decks 1 and 2 needed almost no code** to play them (their players, lightboxes and deep links are
  unchanged); `CHAPTERS` became `BASE_CHAPTERS` + journeys (`chapters/base.ts` breaks the import cycle).
- **The Run draws all 44 chapters** via `src/lib/storybook-run/from-chapters.ts`, with seven new block kinds (tiles, result, bars,
  line, donut, QR, photos). It shares *data*, never renderer code — decision 99's "imports nothing from the other decks" is
  corrected to that.
- **One address format** across the decks — `#/review?c=<id>&s=<step>[&embed=1]` — and a shared `decks.ts`. Each deck has a
  "same screen in…" control; each understands `embed=1`; The Run adds `#/compare`, which drives all three decks at one screen
  in frames. No code is shared across the decks to do this, so none can break another.
- **Lighter Run:** it opens on people, then "which look?"; the v3/v4 day, the decisions atlas and all 32 chapters are folded;
  **Simple view is the default** and hides decisions, criteria, build status and the database panel (one tap away); a
  **Reviewer view** toggle restores them.
- Repo name for the new deck: **`Jayshankar-ui-run`**.

**Judgement calls worth knowing.**
- The shared journeys use the **existing 24 block kinds only**, expressing new ideas in them (a queue is a `rows` list with
  statuses; a gate is an `alert`), so all three decks draw structurally identical content. The Run's richer v3/v4 blocks stay
  in its own day acts. The cost is that the shared walks are plainer than the Run's native acts.
- **Blind stays true in the data**: the receiving walk contains no vendor, no rate and no rupee amount (tested), and locked
  fields convert to redaction with no value carried over. An earlier draft of the walk reused a screen listing the vendors for
  the one persona who must never see them; a test now forbids that.
- **Compare uses iframes of the published decks** rather than bundling all three renderers into one page, which would have
  put antd into the Run's bundle. Hence it only works once all three are live; local copies can be passed in the URL.
- Fixed in passing: deck 1's generated service worker precached an entry file its rename step had removed (deck 2's script
  already had the fix); `vitest.config.ts` added so the suite excludes `_external/` experiments.

**Defects found by testing, not looking:** walks labelled "ACT 36"; twelve identical person cards; stacked compare panes too short
to show the Ant frame; the Tailwind pane's leftover progress rule in embed mode; two key presses in one instant skipping a step
(a test artefact); a case-sensitive repo-name match (a test artefact).

**Not done.** Not published (no credentials here), so the live Compare is untested. Not viewed on a real phone or in
Firefox/Safari. The proposed delivery screens are a design suggestion, not spec. No new SPEC row (no dependency was added).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 100 — Make the third deck comparable and lighter: shared data, persona walks in all three decks, one address format
