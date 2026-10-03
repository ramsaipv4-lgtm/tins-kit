# Round 1B change note - WP-E (intake lane + sync + version)

## Files
Created: `scripts/kit-version.mjs`, `scripts/kit-proposal-check.mjs`, `scripts/_lib/kit-tree.mjs`, `scripts/_lib/unified-diff.mjs`, `KIT-VERSION`, `scripts/tests/{version,sync,staging-export}.test.mjs`.
Rewritten: `scripts/kit-staging-export.mjs`, `scripts/kit-sync.mjs`. Edited: `scripts/new-project.mjs`, `scripts/kit-new-project-shell.mjs`, `kit-staging/README.md`, `prompts/KITTING-REVIEW.md`, `prompts/KIT-GROWTH-SESSION.md`, `docs/KITTING.md`, `VERSIONING.md`.

## What was built
- **Proposals lane (C1).** Export ships new `scripts/ schemas/ templates/ prompts/ lib/` files at kit-relative paths and one `proposals/<id>/` per EDITED kit file (`proposal.json` with `against {label,hash}`, `patch.diff` from a zero-dep diff writer, full file, `RATIONALE.md`; missing rationale = stub + warning). Everything skipped is listed on stderr and in `kit-staging-export.json`; `--strict` fails on skips. Manifest records repo URL (credentials scrubbed) + first-commit sha (M2). Re-export flood fixed via a per-file baseline hash recorded at scaffold time (plus `--kit=` identity check). `kit-proposal-check.mjs` (new) applies a proposal to a scratch kit and runs validate + selftest, separating "breaks the gate" from "gate already red".
- **Version (C2).** `kit-version.mjs` (`--write/--check/--bump/--label`), `KIT-VERSION`; wired into shell marker (no more hardcoded `2.0`), `.kit-project.json`, `.kit-sync.json`. VERSIONING.md states the canonical tree and that patches name a version.
- **Sync (H5).** Tombstones for deprecated/retracted patterns (+ not vendoring them into copies lacking them), `--exclude`, last-synced-hash conflict detection (exit 1, `--overwrite` backs up), KIT-VERSION record/stale warning.
- **Rosters (M1/M2).** Shell and scaffold derive scripts from `scripts/` minus `KIT_ONLY_SCRIPTS` (+ `_lib/`; scaffold also tests whose subject scripts ship); shell templates derived too. `AGENT-BRIEF.md` bug fixed (`PROJECT-AGENT-BRIEF.md`); missing roster files now warn and exit 1.

## Tests (all run)
`node --test scripts/selftest.mjs` from `$KIT` and from `/tmp`: 85/85 pass (56 originals + all added tests, mine included). `node scripts/validate.mjs --kit`: 73 pass / 0 fail. My 3 files: 19 tests incl. real shell + scaffold scaffolding, git repo identity, secret refusal, 400-case diff/apply fuzz vs `git apply` (scratch script, not shipped).

## Verified vs inferred
Verified by running: everything above on Linux. Inferred, not run: Windows (PowerShell archive path unchanged code; paths via `node:path`, CRLF hashing tested by unit test only), macOS.

## Deviations
- Export refuses (exit 3) on a `scan-secrets.mjs` hit - not in the brief; follows the secrets rule. No bypass flag by design.
- `docs/` project files are not shipped without `--include-docs` (project docs are not kit docs); brief listed docs/.
- Sync now defaults to excluding kit-local dirs (`kit-staging/`, `_to_delete/`, `docs/changes/`) and fixes the `--to=./tins-kit` reverse-sync source path (was itself). Module export now ships subdirectories (old code dropped `tests/`).
- Pattern status is read by a 3-key mini reader in `kit-tree.mjs`, not `pattern-meta.mjs`, so sync works on a copy predating it.
- `KIT-VERSION` label defaulted to `2.0.0`.

## Deferred
Proposals are per-file (no multi-file grouping). Vendored-layout export only lightly exercised (no test).

## Needs from another WP
- **WP-D1 (`kit-ingest.mjs`)**: read `kit-staging-export.json` (schema `kit-staging-export/2`: `repo`, `against`, `proposals[]`, `additions[]` with `kind` script|schema|template|prompt|doc|pattern|module, `skipped`); handle `proposals/<id>/` as an "amend" candidate (point reviewer to `kit-proposal-check.mjs`); de-dup consumers by `repo.firstCommit`.
- **WP-F**: add `kit-version.mjs --check` to validate; keep `validate.mjs` §8.33e's literal `f === 'examples'` in `kit-sync.mjs` (preserved); list new scripts in expected rosters/INDEX.
- **Integrator**: run `node scripts/kit-version.mjs --write` as the LAST step (KIT-VERSION was stamped now and will be stale after other WPs land). Prompts the shell should carry for new scripts (WP-A/B/C) must be added to the hand-kept `shellFiles` list in `kit-new-project-shell.mjs`.
