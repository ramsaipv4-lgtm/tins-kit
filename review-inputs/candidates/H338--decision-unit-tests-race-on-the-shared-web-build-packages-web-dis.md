---
id: decision-unit-tests-race-on-the-shared-web-build-packages-web-dis
solves: unit tests race on the shared web build (packages/web/dist)
triggers: unit tests race on the shared web build (packages/web/dist)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# unit tests race on the shared web build (packages/web/dist)

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-3: unit tests race on the shared web build (packages/web/dist)

**Problem:** on a tree with b7-2, b7-6 and b7-7 merged, the gate failed at "builder unit tests":
`AC-150 / AC-151 substitute handover … locator.waitFor: Timeout 30000ms exceeded … waiting for
getByRole('cell', { name: 'AI-delivered' })` (packages/web/test/tele.test.mjs). The same file passed
4/4 alone on the same tree, and on b7-2 alone.
**Cause:** `packages/web/test/foundation.test.mjs` (b7-1) rebuilt `packages/web/dist` three times
(plain, pseudo-locale, then plain again), and vite empties the folder first. Node runs test files in
parallel, so every other web test that serves `dist` could load an empty or pseudo-locale build.
b7-4 had already worked around it inside its own test (retry, rebuild only when stale); builders
b7-5 and b7-6 saw the same intermittent failures in other groups' rows (AC-89, AC-122).
**Options considered:** run unit tests with `--test-concurrency=1` (hides the bug and makes the gate
slower); add retries in every test (more workarounds); stop sharing the folder.
**Choice:** the foundation tests build into their own folders (`packages/web/.test-dist/<name>`,
via `LMS_WEB_OUT`, which vite.config.ts now reads) and start their server with `LMS_WEB_DIST`
pointing there (server config reads it; default unchanged). The gate (`scripts/gate.mjs`, step 3)
now builds the shared `dist` once before the unit tests; only that build and tele's stale check
write it.
**Why:** removes the cause; one env var each side; no behaviour change for users.
**Proof:** on the b7-2 + b7-6 + b7-7 tree, `node --test packages/*/test/*.test.mjs`: 276 pass,
0 fail (before: 275 pass, 1 fail).
**Orchestrator mistake:** the first close failed with 4 tele unit tests red: in a fresh worktree
nothing built `dist` any more, because the foundation test had been the one building it for every
other test and journey. A hidden dependency on the racing test itself. Fixed by the gate build above.
**Lesson for the rebuild course:** tests that write a shared build output are a hidden coupling.
Give each test its own output folder, and make the server's static folder configurable from day one.

## Evidence

- docs/build-journal/integration.md#I-3: unit tests race on the shared web build (packages/web/dist)
