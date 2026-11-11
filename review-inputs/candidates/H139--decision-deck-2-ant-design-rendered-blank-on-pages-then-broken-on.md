---
id: decision-deck-2-ant-design-rendered-blank-on-pages-then-broken-on
solves: Deck 2 (Ant Design) rendered blank on Pages, then broken on every desktop-layout chapter: four root causes
triggers: Deck 2 (Ant Design) rendered blank on Pages, then broken on every desktop-layout chapter: four root causes
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Deck 2 (Ant Design) rendered blank on Pages, then broken on every desktop-layout chapter: four root causes

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 95 — Deck 2 (Ant Design) rendered blank on Pages, then broken on every desktop-layout chapter: four root causes

**What changed.** `src/storybook-ant.css` now loads `@tailwind base` through a new deck-2-only config,
`tailwind.storybook-ant.config.ts` (preflight off); `src/pages/StorybookAntReview.tsx` sets
`<Layout hasSider={false}>` and a responsive header. Nothing in the app, deck 1 or `tailwind.config.ts` changed.

**Four causes, each found by looking at the running page, not by reading code:**
1. **Blank page on GitHub Pages — wrong base path.** The pushed folder was built with `VITE_BASE` unset, so
   `index.html` asked for `/assets/…`, `/registerSW.js` and `/manifest.webmanifest` from the domain root; a project
   site lives at `/Jayshankar-ui-antd/`. 404 on the JS ⇒ empty `<div id="root">`. `scripts/publish-storybook.sh`
   sets the base; a hand-pushed `dist-storybook-ant/` does not.
2. **Phone frame half a frame off-centre, overflowing on a phone, enlarge ineffective — missing Tailwind variables.**
   Deck 2 omitted `@tailwind base` (to keep antd's reset the only one). In Tailwind 3 that layer also emits the
   `--tw-*` defaults every `translate-*`/`scale-*`/`shadow-*`/`ring-*` utility reads; without them
   `-translate-x-1/2 scale-[0.9]` computed to `transform: none` (confirmed: `--tw-translate-x` empty).
3. **Every desktop-layout chapter (21–32) collapsed — antd Sider auto-detection.** `AntDesktopFrame` draws a
   `Layout.Sider` inside a plain `<div>`, so the Sider registered with the *page's* Layout, which gained
   `ant-layout-has-sider` (`flex-direction: row`) and put header, content and footer side by side: content 0px wide,
   title one letter per line, page 5,372px tall, and the "Magnify to read" button unclickable (an antd layout
   intercepted the pointer). An explicit `hasSider={false}` overrides the detection (antd `useHasSider`).
4. **Header brand wrapped letter by letter below ~480px** — no responsive handling for the subtitle and second tag.

**Verification.** Playwright/Chromium, dev and a production build served under `/Jayshankar-ui-antd/`: all 32
chapters × phone (390), tablet (768) and desktop (1440) checked for a collapsed title, horizontal overflow, a
row-layout page and a wrapped brand — clean — and the magnify toggle opens a 1,180px pannable strip on a phone.

**Lessons worth keeping.** (a) `npm run build:storybook-ant` runs with `emptyOutDir`, so it **deletes a `.git`
inside `dist-storybook-ant/`**; publish through a separate clone (the script does). (b) Vite's file watcher does not
see edits on this Windows-mounted drive (`/mnt/c`): a dev server must be restarted after each change or it serves
stale code — this cost two false "the fix didn't work" readings. (c) A review deck is verified by *loading it in a
browser at phone width*, not by a green `tsc`: every defect above type-checks.

**Not done / open.** The deprecated-API console warnings (antd `Space direction`, `Alert message`, `List`,
`Descriptions labelStyle`, …) and one React "does not recognize the `%s` prop" warning are unfixed — cosmetic, not
rendering. The Tailwind deck 1 was not re-tested (untouched). **Publishing is the owner's step** (no GitHub
credentials here); the corrected build is in `dist-storybook-ant/`, uncommitted.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 95 — Deck 2 (Ant Design) rendered blank on Pages, then broken on every desktop-layout chapter: four root causes
