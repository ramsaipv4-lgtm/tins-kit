# Round 1B — WP-A (dispatch): change note

## Files changed / created
- `scripts/orchestrate.mjs` — rewritten dispatch half (status/plan/exit-code/ledger logic untouched).
- `templates/ORCHESTRATION.json` — new `adapter` / `adapters` / `promptFile`; legacy `workerCmd` kept.
- `prompts/EXECUTION-MODE-INTERVIEW.md`, `prompts/DELEGATE-WORK.md`, `prompts/NEW-PROJECT.md`.
- NEW `scripts/tests/orchestrate.test.mjs` (14 tests).

## What was built
1. **PACKET.md.** For each wave task the runner renders `delegation/tasks/<id>/PACKET.md` from the LEDGER row (`Touched files`), `delegation/tasks/<id>/BRIEF.md` (Brief — or Context+Scope —, Acceptance criteria, Interface contract; `templates/TASK-BRIEF.md` headings work; unfilled `<...>` template text counts as missing) and the worker prompt. It takes the content of the outer fence after `## The prompt` (WP-C's new layout), fills all placeholders in one pass, rewrites `$PWD`, prepends a facts table (absolute paths, kit dir) and appends a `RESULT.json` contract. Unknown `{{X}}`, empty values, unsafe task ids or a leftover `{{...}}` fail the whole wave with exit 2 before anything is spawned. Brief/criteria/contract are fenced with a per-render random `[UNTRUSTED-<nonce>]` marker. Per-task override: ledger column `Prompt file`, else config `promptFile`, else the kit's prompt (path must stay inside project or kit). Kit root comes from `import.meta.url`, so `.kit-shell/` works.
2. **No shell.** Workers start from an argv array (`spawn`, `shell:false`) with a short pointer ("Read <PACKET.md> and follow it exactly…") or the packet/pointer on stdin. Adapter names (config or ledger `Adapter` column) are only whitelist keys in `adapters` (own-property check). Legacy `workerCmd` is tokenised without a shell; `$(…)`, backticks and `| & ; < > ( )` are refused.
3. **Adapters:** `claude-code`, `cline`, `opencode` (flags read from local `--help`), `codex`/`gemini` (kept, marked UNVERIFIED), `relay` (prints PACKET path, waits for `RESULT.json`, `timeoutSeconds`/`pollSeconds`, stale result set aside).
4. New flags `--root`, `--render` (write packets, spawn nothing); `--dry-run` now reports per-task packet render status without writing.

## Tests (commands and results)
- `node --test scripts/tests/orchestrate.test.mjs` → 14/14. Covers placeholders filled; missing values → exit 2 with no worker started; hostile task ids and adapter names refused with no side-effect; a project path containing `& $(…) ;` arrives as one inert argument; legacy `workerCmd` refusals; stdin adapter; failing worker; missing executable; relay timeout/success/stale result; `promptFile` override; `--dry-run`/`--render`; template shape.
- `node --test scripts/selftest.mjs` from `$KIT` and from `/tmp` → 104/104 (includes the pre-existing orchestrate tests). `node scripts/validate.mjs --kit` → 73 pass / 0 fail.

## Verified vs inferred
- Verified: everything above on Linux/WSL with a fake worker CLI; `claude`, `cline` 3.0.68, `opencode` 1.18.34 flag names read from their `--help`.
- Inferred / unverified: no real model CLI was run (no auth, per brief); codex/gemini not installed; the Windows `.cmd`-shim path (shell only after an arg charset check) and PATHEXT lookup were not run on Windows; `opencode --auto` semantics read from help only.

## Deviations
- Task text comes from `delegation/tasks/<id>/BRIEF.md`, not the ledger row (the row has no room for it) — a convention I chose; documented in the template and prompts.
- Kept `_workerCmdPresets` (dated note + one-line shapes) because `validate.mjs` §8.32h reads it.
- Fixed fence parity in DELEGATE-WORK and NEW-PROJECT (outer four-backtick fence, steps inside); NEW-PROJECT's `$PWD` removed.

## Deferred
Worktree/kit prep (harness C2), `maxRetries` loop, ledger status writes (auditor's job), a real run per CLI.

## Needs from another WP
- **WP-F (`validate.mjs`):** §8.32h should read `adapters` (≥2 non-underscore keys, dated `_note`) rather than `_workerCmdPresets`; a fence-parity lint should accept four-backtick fences; docs/INDEX should mention `--render`, `BRIEF.md`, `RESULT.json`.
- **WP-C (`AUTONOMOUS-BUILD.md`, `WORKER-SESSION.md`):** AUTONOMOUS-BUILD still documents `workerCmd` with `{{PROMPT_FILE}}` and Step 5 "native spawning" text; it should say adapters, `BRIEF.md`, and PACKET.md. WORKER-SESSION Step 7 could add `RESULT.json` (the packet appends it already). Step 2's literal `{{PLACEHOLDER}}` is tolerated and rewritten to `<PLACEHOLDER>` by the renderer.
- **WP-E:** `kit-new-project-shell.mjs` already ships orchestrate.mjs/WORKER-SESSION; orchestrate.mjs is deliberately a single self-contained file so no roster change is needed.
