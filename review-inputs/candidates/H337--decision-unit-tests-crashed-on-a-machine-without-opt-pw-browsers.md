---
id: decision-unit-tests-crashed-on-a-machine-without-opt-pw-browsers
solves: unit tests crashed on a machine without /opt/pw-browsers; .lms-data/ was not ignored
triggers: unit tests crashed on a machine without /opt/pw-browsers; .lms-data/ was not ignored
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# unit tests crashed on a machine without /opt/pw-browsers; .lms-data/ was not ignored

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-13: unit tests crashed on a machine without /opt/pw-browsers; .lms-data/ was not ignored

**Problem:** on a fresh machine seven unit tests failed at once (tele, board and foundation test files):
`ENOENT: no such file or directory, scandir '/nonexistent/path'` (the same message names `/opt/pw-browsers`
when that folder is absent). Separately, running the server from the repo left an untracked `.lms-data/`
(the default data folder, README section 2) in `git status`.
**Cause:** the three test files looked for Chromium with
`readdirSync(process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers')`, a cloud-container path, and
`readdirSync` throws on a missing folder. A second trap: Playwright reads `PLAYWRIGHT_BROWSERS_PATH`
once, when it is imported, so merely skipping `readdirSync` still made a bare `chromium.launch()` look in
the missing folder (`Executable doesn't exist at /nonexistent/path/chromium_headless_shell-1243/...`).
**Options considered:** a shared helper (no file for it inside this task's scope); three small identical
blocks; wrap `readdirSync` in try/catch only (does not fix the cached variable).
**Choice:** in each file's `browser()`, if the folder does not exist, delete the variable before importing
Playwright and call plain `chromium.launch()`; keep the `executablePath` branch when the folder exists.
foundation.test.mjs gets a test for it. `.gitignore` gains `.lms-data/`.
**Proof:** before: with `PLAYWRIGHT_BROWSERS_PATH=/nonexistent/path` the three files gave 7 failed of 16.
After: 17/17 with the variable unset and 17/17 pointing at the missing folder; all unit tests 334/334.
**Lesson for the rebuild course:** a test must not depend on a path that exists only in the author's
environment, and a library that reads an environment variable at import time needs the variable fixed
before the import, not after.

## Evidence

- docs/build-journal/integration.md#I-13: unit tests crashed on a machine without /opt/pw-browsers; .lms-data/ was not ignored
