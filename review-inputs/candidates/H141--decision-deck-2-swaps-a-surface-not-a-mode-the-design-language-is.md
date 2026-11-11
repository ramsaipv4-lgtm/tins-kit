---
id: decision-deck-2-swaps-a-surface-not-a-mode-the-design-language-is
solves: Deck 2 swaps a *surface*, not a mode: the design language is injected into the player
triggers: Deck 2 swaps a *surface*, not a mode: the design language is injected into the player
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Deck 2 swaps a *surface*, not a mode: the design language is injected into the player

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 91 — Deck 2 swaps a *surface*, not a mode: the design language is injected into the player

**What changed.** `ChapterPlayer` gained an optional `surface?: StorybookSurface` prop, defaulting to
the app's own Tailwind renderer. The contract lives in `src/lib/storybook/surface.ts` (types only —
`label` + `Blocks` + `PhoneFrame` + `DesktopFrame`); the Tailwind implementation is
`src/components/storybook/app-surface.ts`; the Ant implementation is
`src/components/storybook-ant/AntSurface.tsx`. Both `FrameSurface` call sites (the stage and the
filmstrip thumbnails) and `Filmstrip` itself now take the surface, so a deck cannot end up with an
Ant frame around Tailwind blocks.

**Why.** The obvious alternative — a `variant="ant"` flag read inside the player — would have made
`components/storybook-ant/` reachable from the app's own import graph the moment anyone wrote the
obvious `import`. The whole point of deck 2 is that it exists to *answer* D67, and D67 may well be
answered "Tailwind". Injection means `antd` is imported only by the Ant deck's page and entry point,
so the app bundle is byte-identical whichever way the client answers, and there is no flag to
accidentally ship. It also keeps the comparison honest: one player, one set of chapter data, one
`FrameSurface`, two renderers — so a difference the client sees is a design difference, not a layout
difference. The QR generator is copied verbatim from `blocks.tsx` for the same reason: a container
code must draw the same pattern in both decks or the screenshots stop being comparable.

**Cost, stated plainly.** The Ant deck is 1.27 MB of JS (392 KB gzipped) against deck 1's 408 KB,
because antd ships a full design system — tokens, resets and a CSS-in-JS runtime. That is the price
of the comparison, and it is visible in the artifact, not hidden.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 91 — Deck 2 swaps a *surface*, not a mode: the design language is injected into the player
