# Round 1B change note: WP-D2a (front-matter backfill, first 12 patterns)

## Changed
Prepended authored YAML front matter (and nothing else) to 12 files in `lib/patterns/`: FRONTEND-OVERHAUL, append-only-audit-log, client-side-aggregation, cross-tenant-404, empty-states, env-vs-config, fifo-cascade-algorithm, idempotent-migrations, kit-self-application, manual-relay-worker-loop, multi-tenant-rls, observability-first. No other file touched. Every file was read in full before its block was written.

Format: `id, solves, triggers (12 max), assumes, not_when, artefact, derived_from, status: active, superseded_by: null, verified: null`. Strings are double-quoted, lists inline, `not_when` as a block list (or `[]`), each entry ending `(cite: ...)`. FRONTEND-OVERHAUL is CRLF, so its block is CRLF too.

## Verified (commands run)
- Body byte-identity: for each file, `tail -n +<closing-line+1> file | cmp - <live tins-kit original>`: all 12 identical (the live kit was only read).
- `node scripts/validate.mjs --kit`: 73 pass, 0 warn, 0 fail.
- Contract check: `scripts/_lib/pattern-meta.mjs` did NOT exist when I finished, so I ran a stand-in checker (scratch, `r1b-D2a/check.mjs`: delimiters, all keys present, id = filename, 6-12 triggers, inline-list shape, every not_when cited): 12/12 ok. **Must be re-run with the real parser once WP-D1 lands.**

## Inferred / judgement
- `artefact: module` for multi-tenant-rls only, because `lib/tenant-rls/` has tests and the pattern says "the code is in lib/tenant-rls/". The pattern text itself is rationale, so `prose` is defensible; flag for the owner. append-only-audit-log is `prose` (lib/audit-viewer is a viewer, not the trigger recipe).
- `verified: null` everywhere: no pattern claim was checked by running a command.
- `triggers` and `solves` are my wording. They are the retrieval-relevant, LLM-authored part; `not_when` is the part constrained to sourced text.

## Fields not filled honestly
| Pattern | Field | Result | Why |
|---|---|---|---|
| env-vs-config, idempotent-migrations, kit-self-application, observability-first | not_when | `[]` | Text states no exclusion; its "When this changes" sections describe evolution, not inapplicability. |
| empty-states | not_when | 1 entry | Only the sign-in row of the §4 table ("N/A"); thin. |
| FRONTEND-OVERHAUL | derived_from | `[]` | No `> **Source:**` line (a v0.dev reference export is mentioned in prose). |
| FRONTEND-OVERHAUL | all fields | filled, but doubtful | Not a reusable pattern: a project-specific plan document (Jayshankar file paths, 25-hour estimate, deferred status). Frontmatter describes it faithfully, but retrieval value is low; candidate to move out of lib/patterns/ or to mark `artefact: template` / a new kind. |
| kit-self-application | derived_from | `tins-kit-sessions-1-7` | Source is the kit's own history, not a numbered consumer decision; invented slug. |
| append-only-audit-log, fifo-cascade-algorithm, idempotent-migrations, env-vs-config, observability-first, cross-tenant-404, multi-tenant-rls | derived_from | project name only | Source lines give projects and file paths, no decision numbers. |
| manual-relay-worker-loop | derived_from | `eduplay-v2` has no number | Second consumer reported by direct message, not a numbered decision. `jayshankar#31/33/34/35` are BUILDER decision numbers (per its Source line). |
| all | assumes | partly inferred | Stack assumptions come from code samples and examples (Prisma, TanStack Query), not from explicit "assumes" statements; most patterns state none. |
| multi-tenant-rls, cross-tenant-404 | stack scope | ambiguous | Both mix Prisma and Supabase examples; `assumes` records both rather than choosing. |

## Deviations
None from the brief. No blank line follows the closing `---`, so the body is byte-identical to the original.

## Deferred
Re-running the real parser; verifying any `verified` value.

## Needs from another WP
- **WP-D1:** `node scripts/kit-listing.mjs` now prints no title for front-mattered patterns (it takes line 1, `---`). This was the expected H2 hazard; the shared parser must feed listing and `kit-new-pattern`. validate §8.13 still passes.
- **WP-D1/F:** decide whether non-pattern plan documents (FRONTEND-OVERHAUL) belong in `lib/patterns/`.
