---
id: decision-deck-2s-screens-redrawn-as-ant-design-products-the-old-b
solves: Deck 2's screens redrawn as Ant Design products; the old block renderer deleted
triggers: Deck 2's screens redrawn as Ant Design products; the old block renderer deleted
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Deck 2's screens redrawn as Ant Design products; the old block renderer deleted

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 97 — Deck 2's screens redrawn as Ant Design products; the old block renderer deleted

**What changed.** Decision 96 re-did deck 2's *shell* and said plainly that the screens inside the device frames were
only de-deprecated. The owner saw the same gap one level down ("i dont see that u didnt work on the actual app and
desktop mocks"): a phone screen was still deck 1's block list with Ant widgets dropped in. The 24 block kinds are now
drawn by two **composition layers** under `src/components/storybook-ant/mock/`, which read the same flat block data
and decide how an Ant product would lay it out:
- `phone.tsx` — `PhoneScreen`: a 340×600 frame with status bar, `NavBar` (back circle, title, date chip or link),
  scrolling body, **docked action bar** (a trailing `buttons` block is lifted out of the scroll), and a `TabBar` with
  an active indicator. Consecutive `select`/`field` blocks become one grouped `Form` card (two short plain fields
  pair up); `fields` become a cell list; `stats` a card row (2×2 beyond three); `tiles` service cells or an icon
  grid; `alert` a compact tinted status card; `chain` a vertical `Steps`; `table` a compact table.
- `desktop.tsx` — `DesktopScreen`: a 1180×720 Ant Pro frame (`Sider` + dark `Menu` with grouped navigation, header
  with `Breadcrumb`, search, `Badge` bell, `Avatar`, page header with date chip or primary action, page `Tabs`,
  docked footer). `planDesktop()` hoists `statCards` into a KPI row, binds the first `tabs` block to the table (tab
  counts are *derived from the table's Status column*, not invented), turns a select/field cluster into a filter bar
  or form panel, and packs blocks into 24-column rows by a per-kind span preference.
- `charts.tsx` — hand-drawn SVG line, bar and donut charts with axes, gridlines and value labels, measured to their
  container (`useBoxWidth`). **No chart library**: SPEC §4.4 has no row for one, and adding a runtime dependency
  needs an amendment. `QrSvg` is the deck-1 generator, copied unchanged, so a container code still draws the same
  pattern in both decks (D74).
- `ScrollArea.tsx` — where a screen is taller than its frame, a bottom fade and a "More" pill say so. Content is
  never silently clipped.
- `tone.ts` — tone/status → Ant colour and `Tag` preset mapping, en-IN number formatting, nice axis ticks.

**Deleted.** `AntBlocks`, `AntSurface`, `AntPhoneFrame`, `AntDesktopFrame`, `blocks-core`, `blocks-lists`, `blocks-viz`
— an import-graph check showed nothing reached them once `AntScreen` called the new layers. `ant-shared.tsx` keeps
only `antIcon`/`antColor`. The *surface seam* in `src/lib/storybook/surface.ts` is still how **deck 1** is assembled;
deck 2 does not use it. (HANDOVER W8 and `docs/ARCHITECTURE.md` were corrected to say so.)

**Design choices worth knowing.**
- **Composition over a per-block switch.** Ant products are made of grouped forms, docked actions, KPI rows and
  filter-bars-above-tables; none of that exists in flat block data, so the layers *infer* it. The chapter data is
  untouched — deck 1 is unaffected and both decks still show identical content, figures and steps.
- **The frames stay light in dark mode** (own `ConfigProvider`, `inherit:false`), as in decision 96.
- **Tailwind preflight is off for this deck** (`tailwind.storybook-ant.config.ts`), so Tailwind's resets cannot fight
  Ant's own.
- **Animation is restrained** (`.sba-rise/.sba-draw/.sba-grow`), all under `prefers-reduced-motion`.
- **A generated service worker precaches `storybook-ant.html`**, which the entry rename turns into `index.html`;
  `build:storybook-ant` output served from a static host would 404 that precache URL. `scripts/rename-storybook-ant-entry.mjs`
  now repoints it to `index.html` (and fails loudly if the PWA plugin's output ever changes shape). **Deck 1's rename
  script has the same latent defect** (`storybook.html` is precached) and was not touched.

**Verification.** Playwright/Chromium, dev server and a production build served under `/Jayshankar-ui-antd/`: 192
layout checks and 15 interaction checks pass, console is clean across all 32 chapters (no deprecated-API warnings),
and ~100 screens were viewed as contact sheets (phone and desktop) and corrected until nothing was misaligned, repeated
or truncated. A clip measurement shows 16 of 108 screens still taller than their frame (down from 22); each carries the
"More" pill. `tsc --noEmit`, `npm run validate` (73 pass), `npm run selftest` pass; the built app and deck-1 bundles
contain no `antd`. Bundle: 1.34 MB JS, 414 KB gzipped.

**Not done.**
- Deck 1 was not given the same treatment, so the two decks differ in shell, interaction *and* composition. Any gap
  the client sees is a gap between a designed Ant product and a generated Tailwind one — weigh D67 accordingly.
- Phone screens are inferred layouts, not hand-tuned per screen; a few dense ones (e.g. quality-issue step 1) still
  scroll.
- Publishing is the owner's step (no GitHub credentials in this environment).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 97 — Deck 2's screens redrawn as Ant Design products; the old block renderer deleted
