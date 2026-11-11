---
id: decision-two-reacts-in-the-main-checkout-nothing-compressed
solves: two Reacts in the main checkout; nothing compressed
triggers: two Reacts in the main checkout; nothing compressed
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# two Reacts in the main checkout; nothing compressed

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-8: two Reacts in the main checkout; nothing compressed

**Problem 1:** `kit merge b8-1` failed AC-97 twice in main's checkout ("expected board to be visible"
right after sign-in), while the same merged tree passed every time in a separate worktree.
**Cause 1:** the Playwright trace showed `TypeError: Cannot read properties of null (reading 'useRef')`
from the board chunk: two Reacts. npm workspaces hoisted React 18.3.1 to the root node_modules (pulled
in for Excalidraw) and kept packages/web's pinned React 19.3.0 in packages/web/node_modules. Task
worktrees link only the root node_modules, so every worktree build since the start used React 18 for
everything; main's checkout used React 19 for the app and React 18 inside Excalidraw.
**Problem 2:** AC-164's phone test failed in four full-suite merge gates and never alone; AC-102 (shell
< 300 KB on the wire) failed at 377 KB after b7-9 merged. The static server sent nothing compressed.
**Options considered:** pin React 18 everywhere (against SPEC D-pins); install per worktree (slow,
16 GB machine); make both environments the same and the bundle use one React.
**Choice:** (a) vite `resolve.dedupe` for react, react-dom and scheduler, so the build uses
packages/web's React 19 for every importer; (b) scripts/setup.mjs also links each package's own
node_modules into worktrees, so worktrees build exactly what main builds; (c) packages/server static
handler sends text files with brotli or gzip (Accept-Encoding, cached by mtime, Vary header).
**Why:** one environment, one React, and the phone profile no longer pays for uncompressed bytes.
**Proof:** in i-8 (now React 19): all unit tests 289/289; on main + I-8 + b8-1: board journey
(AC-97) desktop and phone pass, unit tests 297/297; static.test.mjs covers br/gzip/none/small/images.
**Lesson for the rebuild course:** a shared dependency folder must include nested workspace folders,
or "it passes on my branch" means a different React. And compress static files from day one.

## Evidence

- docs/build-journal/integration.md#I-8: two Reacts in the main checkout; nothing compressed
