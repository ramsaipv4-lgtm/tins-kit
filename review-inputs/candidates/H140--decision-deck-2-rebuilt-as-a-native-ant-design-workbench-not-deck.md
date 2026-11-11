---
id: decision-deck-2-rebuilt-as-a-native-ant-design-workbench-not-deck
solves: Deck 2 rebuilt as a native Ant Design workbench, not deck 1's player with Ant widgets inside
triggers: Deck 2 rebuilt as a native Ant Design workbench, not deck 1's player with Ant widgets inside
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Deck 2 rebuilt as a native Ant Design workbench, not deck 1's player with Ant widgets inside

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 96 — Deck 2 rebuilt as a native Ant Design workbench, not deck 1's player with Ant widgets inside

**What changed.** The owner looked at the repaired deck 2 and said it "doesn't seem much different". They were right.
Deck 2 reused deck 1's Tailwind `ChapterPlayer` — header, one stage, caption, button row, filmstrip — and only swapped
the block drawings and the device-frame chrome. That answers "what do Ant widgets look like in a phone mock-up", not
D67's question, "what would the app *feel* like in Ant Design". New files under
`src/components/storybook-ant/deck/`: `AntDeck` (header, `Layout`/`Sider`, `Drawer`, dark algorithm), `AntHome`
(`Statistic`, `Tabs`, `Segmented`, `Input.Search`, `Badge.Ribbon` cards with live scaled thumbnails, `Collapse`,
`Tour`), `AntChapterView` (`Breadcrumb`, clickable `Steps` walk-through, `Space.Compact` transport with a `Progress`
autoplay clock, a sticky control bar on phones), `Lightbox` (tap the screen to enlarge: `Modal`, Fit / Actual size,
swipe, arrows), `AntNav`, `ScaledFrame`, `AntScreen`, `hooks`. `pages/StorybookAnt.tsx` and `StorybookAntReview.tsx`
are now thin wrappers. `ChapterPlayer` is untouched and still drives deck 1.

**Design choices worth knowing.**
- **Measured scaling, not a breakpoint table.** `ScaledFrame` fits a frame to its container (and an optional height
  cap) with a `ResizeObserver`; the shared player used hand-picked `scale-[0.82]` classes and matching box sizes that
  had to be edited together.
- **The screen is the control.** Tapping or clicking the device opens the lightbox (`E` toggles it); the old
  "Magnify to read" button existed only for desktop panels on a phone.
- **Dark mode darkens the workbench, never the product.** The device frame sits in its own `ConfigProvider`
  (`inherit: false`, the original light tokens): a dark-mode "app" would be a different design, not a viewing mode.
- **Explicit `hasSider` on every `Layout`** (see decision 95) — the desktop frame draws its own `Sider`.
- **`useIsNarrow` reads `matchMedia` synchronously**; antd's `Grid.useBreakpoint` reports nothing until after mount,
  which flashed the desktop layout on a phone.
- **Deep links unchanged** (`#/review?c=…&s=…`), so every link already sent still works.
- **Deprecated Ant APIs removed** from the old block renderers (`Alert message`→`title`, `Statistic valueStyle`→
  `styles.content`, `Descriptions labelStyle/contentStyle`→`styles`, redundant `Select showArrow`, and the deprecated
  `List` replaced by a plain bordered list with the same row markup). Console is clean across all 32 chapters.

**Verification.** Playwright/Chromium against the dev server and a production build served under
`/Jayshankar-ui-antd/`: 192 layout checks (32 chapters × first and last step × phone/tablet/desktop — stage inside the
viewport, no horizontal overflow, title readable, steps present) and 15 interaction checks (tap-to-enlarge, Actual-size
panning with a real `scrollLeft`, swipe/Next in the lightbox, Esc, drawer navigation, search, no-match `Empty`, the
phone/desktop filter, the tour, dark mode, keyboard). The app and deck-1 bundles contain no `antd` (grep of the built
assets). `npm run validate` and `selftest` pass. Bundle: 397 KB gzipped JS (was 392 KB).

**What this costs the comparison — said plainly.** The two decks now differ in **navigation and interaction**, not
only in styling. That is deliberate (it is what "feel" means), but a reviewer must not read every difference as being
about Ant versus Tailwind: a sidebar and a lightbox could be built in Tailwind too. If the client wants a like-for-like
look, deck 1 would need the same treatment — that is a separate decision and is not done.

**Not done.** Deck 1 was not touched or re-tested beyond a successful build. The screens' own content (blocks) was
re-drawn only to remove deprecated APIs, not redesigned: the "rethink" is the shell. Publishing is the owner's step.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 96 — Deck 2 rebuilt as a native Ant Design workbench, not deck 1's player with Ant widgets inside
