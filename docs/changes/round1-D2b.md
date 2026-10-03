# Round 1B - WP-D2b: front-matter backfill (second half)

## Files changed
Front matter prepended to the top of 11 files in `lib/patterns/`: outbox-job-queue, pinned-deps, postgres-mutations, prisma-extensions-rls, private-to-public, pwa-offline-graceful, shortfall-pattern, supabase-auth-trigger, third-party-tool-audit, two-prisma-clients, versioned-spec-amendment. No other kit file touched. `tiered-escalation.md` untouched (WP-C).

## Verified (commands actually run)
- Body byte-identical: for each file, everything after the closing `---` compared with `cmp` against `/mnt/c/Users/user/Desktop/Jayshankar/tins-kit/lib/patterns/<id>.md` - all 11 identical (originals were also identical to the live kit before I started; no CRLF in any).
- WP-D1's `scripts/_lib/pattern-meta.mjs` (`parsePatternFile`) run over all 11: zero errors, and its returned `body` equals the original file byte-for-byte for every file. Trigger counts 10-12 each.
- `node scripts/validate.mjs --kit` in `$KIT`: 73 pass, 0 warn, 0 fail.

## Format choices
No blank line between the closing `---` and the original `# heading`, so the body is exactly the original. Every string in a list is double-quoted with no commas, quotes or backslashes inside, so even a naive inline-list splitter parses them; `#` in `derived_from` entries (`jayshankar#23`) is always quoted. `not_when` uses block lists (`- "..."`) because entries carry `(cite: ...)`.

## Inferred (not verified)
`solves`, `triggers`, `assumes` are my reading of each pattern, not executed. `artefact: module` for `pwa-offline-graceful` (-> `lib/pwa-config/`, README names the pattern as its architect's view), `two-prisma-clients` and `prisma-extensions-rls` (-> `lib/tenant-rls/`, README names both and the latter's recipe); each dir has `tests/*.test.ts`. I did not run those module tests. `derived_from` entries without a number (`atal-incubation`, `jayshankar`) mean the Source line cites the project, not a numbered decision; `third-party-tool-audit` uses `tins-kit#D33` (kit decision D33).

## Fields I could not fill honestly
| Field | Files | Why |
|---|---|---|
| `verified` = null | all 11 | No command was run that checks a pattern claim. `pwa-offline-graceful` names `vite-plugin-pwa` and its config is unverified against any installed version; I put no version anywhere. |
| `not_when: []` | outbox-job-queue, pinned-deps, prisma-extensions-rls, supabase-auth-trigger, third-party-tool-audit, two-prisma-clients | Text states no exclusion and no consumer observation supports one. Their "When this changes" sections are upgrade paths, not exclusions. |
| `derived_from: []` | private-to-public | No `> **Source:**` line (it mentions Jayshankar only as a worked example in section 7). |
| `not_when` is thin | postgres-mutations (3), private-to-public (2), pwa-offline-graceful (2), shortfall-pattern (1), versioned-spec-amendment (1) | Only entries traceable to a named section; each cites it. |

## Body defects noticed, NOT fixed (prepend-only rule) - for the pattern owner
- `pwa-offline-graceful` section 1 Lesson 2 snippet: `const onOffline = () => setOffline(false);` should be `setOnline(false)` (the Step 2 version is correct).
- `outbox-job-queue`: refers to the kit's `lib/retry.ts` (`outboxNextRetryDelayMs`); no such file exists in `lib/`. It also says rows go to `DEAD` (JobQueue) and `FAILED` (Lesson 3) after 5 attempts for the same flow - inconsistent.
- `prisma-extensions-rls` footer calls `lib/tenant-rls/` "upcoming"; it exists with tests.
- `pinned-deps` code block labelled `// .package.json`.
- `private-to-public` section 2 Step 10 is referred to as "section 10" in its closing list.

## Deviations / deferred
None from the brief. Not done: no `verified` stamps (honest null).

## Needs from another WP
- WP-D1/F: `kit-listing`'s title extraction should be re-tested on these files now that a front-matter block precedes the `# heading` (the parser's `titleOf` exists; I did not test `kit-listing.mjs`).
- WP-F: counts line in `AGENTS.md` says 20 patterns; the directory holds 24 (not mine).
