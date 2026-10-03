# Round 1B -- WP-B (sessions)

## Files
- **Created** `scripts/session.mjs` (subcommands `start close reap check index claim doctor ack`), `templates/SESSION-RECORD.md`,
  `scripts/tests/session.test.mjs` (31 tests), `scripts/tests/independence.test.mjs` (12 tests).
- **Rewritten** `scripts/check-task-independence.mjs` (was byte-identical to the live kit copy; legacy table contract, exit codes and
  the `Checked N task(s)` line kept; the existing selftest regression still passes).

## What it does
- Records: tracked `sessions/<UTC>-<sid>.md`, model name only in front matter, `model_source` enum. `start` refuses a dirty tree
  (entries under `sessions/` ignored) and any git config git itself rejects, records base/branch/worktree/host-os, prints the reading list.
  Start/close commit the record with a `Session:` trailer (`--no-commit` opts out).
- `close` derives everything with no model round-trip: trailer-attributed commits, `diff-tree -z -M --ignore-cr-at-eol`, created/modified/
  deleted/renamed, human lines vs "generated (N lines)" (defaults or `sessions/config.json`), real gate exit code, patch-ids, untrailed
  commits since base. Refuses: empty body, >4000 chars, shell fences, >5 learnings, `passed` with red/missing gate, `passed` with unattributed
  commits, scanner hit (calls `scan-secrets.mjs --stdin --root`; absent = loud warning, continue; exit 2 = refuse).
- `check` (merge/CI): orphan trailer commits, id uniqueness, record schema, late/forged commits (patch-id not in closed record), head
  ancestry (rebase downgraded to WARN when all patch-ids survive), config-driven unique-number rules (default: migration filename numbers,
  decision headings), gate-code/foreign-record flags (exit 3), anchored `--cited-in` completeness, canary. `reap`, `index`, `claim`
  (O_EXCL in the MAIN worktree, `<ns>:next` allocator, `--release`), `doctor`, `ack` (3 questions chosen deterministically per HEAD).
- Independence: reads open **tracked** session records plus the ledger, normalises case/slashes/`./`/backticks, globs, shared exemptions,
  coupled groups (manifest+lock, migrations+SCHEMA.md), declared and path-implied claims (migration/decision numbers), claim files.

## Tested (commands run, all green)
`node --test scripts/selftest.mjs` from `$KIT` and from `/tmp`: 182/182. `node scripts/validate.mjs --kit`: 73 pass, 0 fail.
Scenarios use throwaway repos in `os.tmpdir()`: two worktrees; duplicate `0037` (claims serialise, 6 parallel `claim next` distinct; `check`
catches it when claims were skipped); duplicate decision id via `merge=union`; `--no-verify`; amend after close; rebase; CRLF line counts;
generated separation; orphan + `reap`; forged trailer; moved worktree + `git worktree repair`; a `.git/config` with `filemode = core.autocrlf`.
Real `scan-secrets.mjs` refused an invented AWS example id; a stub covers the refusal path.

## Verified vs inferred
Verified on git 2.53/WSL only. **Inferred, not run:** native Windows git, macOS, git < 2.38, `/mnt/c` worktrees, `shell:true` gate
commands under `cmd.exe`, `core.longpaths` advice.

## Deviations / decisions
- Claims live in the main worktree's untracked `sessions/claims/` (cross-worktree on one machine); they do **not** travel in git, so `check`'s
  unique-number rules are the durable guard.
- `check` exits 3 (not 1) for "flag only: human merge"; 1 for failures.
- Session id is `s-<yyyymmdd>-<8 hex>`; delimiter safety is by exact-cell / anchor match rather than an `-end` suffix.
- `gateCmd` runs via `shell:true` from the CLI/config (the user's own text, never from a record).

## Deferred
Running the checker from the base branch automatically (it prints the exact `git show base:...` command instead); heartbeat leases;
a `commit-msg` hook installer; `.gitattributes` for CRLF; per-learning evidence verification against the diff.

## Needs from another WP
- **F:** `validate.mjs` §8.16 roster should know `templates/SESSION-RECORD.md`; consider a check that `scripts/session.mjs` and
  `scan-secrets.mjs` ship together. **E:** `kit-new-project-shell.mjs`/`new-project.mjs` must vendor `session.mjs`, `scan-secrets.mjs`,
  `check-task-independence.mjs` into a consumer's tracked `scripts/` (worktrees lack the gitignored `tins-kit/`). **A:** `orchestrate.mjs`
  should call `session.mjs claim` before dispatching tasks that allocate numbers.
