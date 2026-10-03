# Round 1B — WP-D1 (retrieval engine) change note

## Files
**New:** `scripts/_lib/pattern-meta.mjs` (the shared front-matter parser: `parsePatternFile`, `loadPatterns` per the brief, plus `titleOf`, `decisionsDerivedFrom`, `KNOWN_KEYS`), `scripts/_lib/decision-parse.mjs` (one decision-log parser), `scripts/_lib/retrieval.mjs` (matching, ranking, scrubbing, similarity). Tests: `scripts/tests/{pattern-meta,coverage,ingest,decision-log}.test.mjs` (the fourth also covers listing and new-pattern).
**Rewritten/changed:** `kit-coverage.mjs` (v2, `KEYWORDS` deleted), `kit-ingest.mjs`, `kit-extract.mjs` (parser swap only), `decision-log.mjs`, `kit-listing.mjs`, `kit-new-pattern.mjs`, `templates/BUILDER-DECISIONS-REVIEW.md`.

## Behaviour
- **kit-coverage**: reads `triggers`/`solves`/`not_when`; word-boundary matching; near-match (all words of a multi-word trigger within 8 content words); ranked, floor 1.2, top 12; prints `not_when`; legacy patterns indexed on their first 35 lines; never returns non-`active`; `--task <file|text>`, `--json` (`id,score,solves,not_when,excerpt,matched,hasFrontMatter,evidence`), strings scrubbed of `tins-kit` and kit paths in `--json`.
- **kit-ingest**: bug fixed (shared parser; fenced examples ignored; `###` subsections stay in the decision). Heading-literal check dropped. `D`-double-prefix gone; candidates numbered once, globally (headings = template). Typed candidates `script|template|schema|doc|patch` from `proposals/` or top-level dirs, LISTED with a human-review warning (nothing applied). Similarity hints (never a gate). A decision that is a pattern's recorded source (`derived_from: [project#N]`, else its Source line) is skipped and named in the report; unchanged re-exports of kit files are skipped.
- **decision-log**: `**Date:**` line in every style; number = max over the whole file (both heading styles); append-only write plus post-check for duplicates; refuses a used number, and, where `sessions/claims/decision-number/` exists, any unclaimed number. It makes no claims itself (that is `session.mjs claim`).
- **kit-listing**: titles skip front matter; `--json` adds `counts` (one kind per file: `lib` no longer includes patterns, `scripts/_lib` is kind `script-libs`; live "lib: 42" = 24 patterns double-counted + 18).

## Tested (commands run)
`node --test scripts/tests/{pattern-meta,coverage,ingest,decision-log}.test.mjs`: 35 tests pass. `node scripts/validate.mjs --kit`: 73/0/0. Full selftest from `$KIT` and from `/tmp`: all mine pass; one failure at the time of writing is WP-B's (`session` independence test), not mine.

## Retrieval measurement (verified, but single labeller)
Three reviewer specs, my own ground truth (8/5/9 applicable patterns; the reviewer's list was not preserved). Old keyword map: **13/22 found (miss 41%)**, 4 false positives. New (default top 12): **17/22 (miss 23%)**, 15 false positives; top 24: 18/22. On spec b the old map missed `tiered-escalation`; the new one finds it. I judged recall more valuable than precision (old doc: false negatives are the loss), so the floor is permissive; weak-only matches are labelled `weak`. Triggers alone gave 7/22: the authors' vocabulary rarely equals a spec's, as the reviewer predicted. Similarity hints on Jayshankar #29-#98: top-3 recall 15/20 at theta 0.08 (labels not mine, set after seeing outputs: inflated).

## Not done / deviations
- Embeddings, disposition gate, reinvention metric: deliberately not built (brief).
- `kit-extract` scoring unchanged; its candidate count rose (76 to 95 before own-source exclusion, 82 after) because decision bodies now include `###` subsections. The flood is a scoring problem, not a parser one.
- `not_when` citation format is not enforced by the parser (format unspecified).
- `tiered-escalation` still lacks front matter (WP-C owns it); coverage handles it as legacy.

## Needs from another WP
- **E:** `new-project.mjs` script list and `kit-new-project-shell.mjs` `shellFiles` must copy **`scripts/_lib/*`** (kit-coverage, kit-extract, decision-log, kit-listing, kit-new-pattern import it; without it they print "copy the whole scripts/_lib directory" and exit 2). `kit-staging-export` should skip `lib/patterns/*.md` identical to the kit's (ingest now skips them too).
- **F:** `validate.mjs` roster must list `_lib/` files and the new tests; counts should come from `kit-listing --json` `.counts`; the front-matter check should call `loadPatterns()` (`errors` already covers required keys and id/filename).
- **B:** `session.mjs claim decision-number:<n>` must create `sessions/claims/decision-number/<n>` (what `decision-log` reads).
