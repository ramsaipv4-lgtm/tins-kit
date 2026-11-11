---
id: decision-fix-3-verified-bugs-in-the-bidirectional-loop-found-whil
solves: Fix 3 verified bugs in the bidirectional loop, found while running it for real against a genuine remote consumer (`text-extractor-from-html`)
triggers: Fix 3 verified bugs in the bidirectional loop, found while running it for real against a genuine remote consumer (`text-extractor-from-html`)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Fix 3 verified bugs in the bidirectional loop, found while running it for real against a genuine remote consumer (`text-extractor-from-html`)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D21 — Fix 3 verified bugs in the bidirectional loop, found while running it for real against a genuine remote consumer (`text-extractor-from-html`)

**What changed.** A remote consumer project (`text-extractor-from-html`, on a different
machine — a cloud sandbox, not a sibling of this workspace) ran the full staging-area flow
for real for the first time: hand-assembled a `.kit-shell/`, ran `kit-staging-export.mjs`,
dropped the bundle in `kit-staging/inbox/text-extractor-from-html/`, and ran `kit-ingest.mjs`.
This surfaced 3 real, reproducible bugs, each verified by running the actual script (not by
reading the source and guessing):

1. **`scripts/kit-extract.mjs`'s `parseDecisions()` didn't match
   `templates/BUILDER-DECISIONS-REVIEW.md`'s own documented format.** The template's "Format"
   section and worked example (D8 in that file) specify `### Decision N — Title` (level-3
   heading, "Decision N" prefix) with `**What changed.**`/`**Why.**` (or any free-form label)/
   `**Impact on downstream.**`/optional `**Kit-level implication**` fields. But the parser only
   split on `\n##\s+` (level-2) and matched `/^(D?\d+)\s*[—\-:]\s*(.+)$/`, then looked for
   `**Context.**`/`**Decision.**`/`**Alternatives.**`/`**Consequences.**` — none of which the
   template ships. This directly violated **§8.21d** (locked): "Running `kit-extract.mjs`
   against a consumer with a BUILDER-DECISIONS-REVIEW.md produces ≥1 candidate per decision
   scoring ≥3." Verified before the fix: running the real script against
   `text-extractor-from-html`'s real (template-compliant, 12-entry) decision log produced
   **0 candidates**. Fixed `parseDecisions()` to accept both heading conventions (the kit's own
   `## D<N>` and the template's `### Decision N`), and added a positional field-extraction
   fallback (`extractPositionalFields()`) that reads bold-labelled paragraphs by *position*
   (first = "what changed," last-before-"impact on downstream" = the rationale, everything
   after "impact on downstream" = kit-level implication) rather than requiring exact field
   names — because the template's own worked example (D8) itself uses varying labels between
   "What changed." and "Impact on downstream." (e.g. "Why drop the FK.", "The fix."), not a
   single fixed "Why." label. Also added a `kitLevelImplication` field and a **+2** scoring
   bonus for its presence — the field exists precisely so the author can flag "this should be a
   kit pattern," and the scorer was ignoring that direct signal entirely.
2. **`scripts/kit-new-project-shell.mjs`'s `shellFiles` copy list omits `kit-staging-export.mjs`.**
   The script's own header comment *and* its generated `README.md` both instruct the user to
   run `node .kit-shell/scripts/kit-staging-export.mjs` as the final step, but the actual
   `shellFiles` array only copies `decision-log.mjs` and `kit-extract.mjs`. Directly violates
   **§8.23e** (locked): "scaffolds a portable `.kit-shell/` directory (~10 files, ~50 KB) that
   ships with the project" — a shell missing the one script its own instructions require isn't
   complete. Verified before the fix: scaffolded a fresh shell at `/tmp/shell-test`; its
   `.kit-shell/scripts/` had exactly 2 files. Fixed by adding the missing entry.
3. **`scripts/kit-staging-export.mjs`'s default output name is always `.zip`, even on POSIX,
   where the code always shells out to system `tar czf`.** Directly violates **§8.23f**
   (locked): "produces a tarball (zip on Windows, tar.gz on POSIX)" — the spec already says the
   correct behaviour; the code just didn't do it. Verified before the fix: ran the real script
   on this (Linux) sandbox, then ran `file`/`unzip -l` on the result — confirmed "gzip
   compressed data" content inside a file literally named `....zip`, which neither Windows
   Explorer nor `unzip` can open. Fixed the default extension to depend on `isWindows`, matching
   what the branch below it actually produces.

**Why.** All 3 bugs share a shape: each is a place where the code's actual behaviour diverged
from what this SPEC already locked down (§8.21d, §8.23e, §8.23f) and from what the kit's own
generated artefacts (the shipped template, the generated README.md) tell a consumer to expect —
and none of them were caught by `validate.mjs`/`selftest.mjs`, because those check `SPEC.md`
structure only, not the runtime behaviour of `kit-extract.mjs` / `kit-new-project-shell.mjs` /
`kit-staging-export.mjs`. The kit had never been run end-to-end, for real, from a genuine
different-machine consumer before this — every prior verification of the staging-area flow
(D19/D26) was structural (files exist, scripts accept the right flags), not behavioural (running
them against real consumer content and checking the output is actually right).

**Impact on downstream.** All 5 vendored copies (Jayshankar, incubos, Data-cleaning-script,
package5, exam-forge) should be re-synced (`kit-sync.mjs --to=<project>`) to pick up the fixed
scripts. Re-ran `kit-extract.mjs` against this kit's own `BUILDER-DECISIONS-REVIEW.md` after the
fix as a regression check: all 17 previously-found candidates still found (same set), plus 2 more
that now cross the ≥3 threshold thanks to the new kit-level-implication scoring bonus — no
candidates lost. `text-extractor-from-html`'s inbox entry now has a real, non-zero triage path;
its `kit-growth-candidates.md` (3 hand-authored candidates, all correctly marked `defer` per the
2-consumer rule) is still the primary artefact for that project until a fixed `kit-extract.mjs`
is re-run against it directly.

**Cross-references:** SPEC.md §8.21d/§8.23e/§8.23f (the acceptance criteria these fixes bring
the code into compliance with — no SPEC amendment needed, the SPEC was already correct),
`kit-staging/inbox/text-extractor-from-html/` (the real-world trigger for this decision),
`kit-staging/README.md` (the staging-area flow this exercised end-to-end for the first time).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D21 — Fix 3 verified bugs in the bidirectional loop, found while running it for real against a genuine remote consumer (`text-extractor-from-html`)
