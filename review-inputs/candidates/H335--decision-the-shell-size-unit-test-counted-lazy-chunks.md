---
id: decision-the-shell-size-unit-test-counted-lazy-chunks
solves: the shell-size unit test counted lazy chunks
triggers: the shell-size unit test counted lazy chunks
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# the shell-size unit test counted lazy chunks

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-4: the shell-size unit test counted lazy chunks

**Problem:** b8-1 (board) reported `packages/web/test/foundation.test.mjs` failing in its tree:
"shell JS 2616573 bytes gzip" against the 300 KB budget (SPEC AC-102). The board is lazy-loaded.
**Cause:** the test (b7-1) summed the gzip size of every `.js` file in `dist/assets`, including chunks
that are only reached through `import()`: the board's Excalidraw (~1 MB compressed) and every
feature screen. It measured the whole app, not the shell.
**Options considered:** raise the budget (hides real growth); exclude files by name (breaks when a
chunk is renamed); measure what the browser loads first.
**Choice:** the shell is the scripts and modulepreloads that `index.html` references, plus every chunk
they import statically (followed transitively); `import()` targets are not followed.
**Why:** that is what AC-102 means by "app shell", and it does not depend on chunk names.
**Proof:** on b8-1's build: shell = 2 chunks (runtime + index), 58,615 bytes gzip; all 209 chunks =
2,609,607 bytes. On main the test passes (1/1).
**Lesson for the rebuild course:** a budget test must measure the thing the budget is about; "all
files in the output folder" silently changes meaning as soon as code splitting starts.

## Evidence

- docs/build-journal/integration.md#I-4: the shell-size unit test counted lazy chunks
