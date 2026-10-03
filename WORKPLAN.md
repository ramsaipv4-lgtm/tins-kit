# WORKPLAN — two days on the kit (written 2026-10-03)

> The kit is its own git repository now (it had no history before). **This folder is the working fork**; its upstream
> baseline is `Jayshankar/_external/tins-kit-next` (commit `287e2de`+). The live `tins-kit/` inside the Jayshankar repo is
> still the *old* kit and is untouched. Evidence for every item below: `docs/findings/2026-10-round1-round2/`
> (start at `ROUND2-FINDINGS.md`). Gate before every commit: `node scripts/validate.mjs --kit`,
> `node --test scripts/selftest.mjs` (also run it from another directory), `node scripts/kit-version.mjs --check`.

## Day 1 — fix what two or more independent builders hit

| # | Item | Why (source) | Size |
|---|---|---|---|
| 1 | **`new-project.mjs --type cli\|web\|content`** — fill `AGENTS.md`/`HANDOVER.md` for the type, drop `prisma/`, `src/lib/validations/` and the `typescript` devDependency unless `web`, give a runnable `tests/` example and a `gate` script | Both code builders: blank web-app templates, `pnpm typecheck`, dead scripts | M |
| 2 | **Patterns the builders had to invent** (use `kit-new-pattern.mjs`, front matter per `docs/findings/…/drafts/pattern-lifecycle-reuse-loop.md` §1.1): *integer minor-unit money* (with a grep check), *atomic file write* (temp + fsync + rename, and a kill-the-child crash test), *append-only domain ledger with reversal chains* | Hit by **both** code builders → meets the two-consumer bar | M |
| 3 | Single-consumer candidates, labelled honestly as such (precedent: `manual-relay-worker-loop`): *hash-chained event log / fold to state*, *CSV import with dry-run dedupe*, *seeded property tests*, *pure core + injectable clock + CLI exit-code contract*, *"checks that can fail"* | One builder each | M |
| 4 | **Retrieval:** index `lib/<module>/` READMEs in `kit-coverage` (it never finds `money-as-decimal`); add the natural-language misses to `triggers` of the new patterns; re-measure on the three specs in the retrieval reviewer's report (miss 41% → 23% so far) | Round 2: "store money as integer paise" returned nothing | S |
| 5 | **Small friction fixes:** `decision-log.mjs` flags vs headings (`--context` renders "What changed"); auto-claim inside `decision-log` for a single writer; `session.mjs ack` leaves a dirty tree; document that `close --gate-cmd` runs without a shell | Both builders | S |
| 6 | **Housekeeping:** fence lint for the 11 prompts WP-C did not own; implement the `§8.13c` absorption check and an INDEX-completeness check in `validate.mjs` (each needs a SPEC row + selftest case — rule D24); generate counts in `AGENTS.md`/`INDEX.md` from `kit-listing --json` | Consistency review | M |

## Day 2 — prove it somewhere it has not been proven (**these need you**)

| # | Item | Who | Why |
|---|---|---|---|
| 7 | **Validate in a non-Claude harness**: follow `NEXT-VALIDATION.md` §0–§3 verbatim (Cline / opencode / Codex / Gemini / a chat relay); write down pass / fail / surprise per row | **You** | Every builder and reviewer so far was a Claude subagent |
| 8 | **The unrun multi-agent test**: two `git worktree`s + a reconciler using `session.mjs check`, ideally across WSL **and** native Windows (worktree pointers are absolute paths) | **You** drive, I can prepare the fixture | The riskiest part of the ledger design, never exercised |
| 9 | Fix whatever 7 and 8 find (expect real findings) | Both | |
| 10 | **Promote**: back up the live kit (`cp -a tins-kit tins-kit.bak-2026-10`), then copy this fork's tree over it excluding `.git` (`rsync -a --exclude .git`), run the gates there, re-stamp `KIT-VERSION` | **You decide** | The live kit has no history; the backup is the only undo |

## Explicitly NOT in these two days (deferred on purpose — no second consumer yet)
Per-reference "dispositions", a reinvention-rate metric, map-then-reduce reconciling, embeddings. Triggers for revisiting each are in
`docs/findings/…/drafts/` (§3 of each draft).

## Working agreements
- One commit per item, message says which item (`#2 money pattern`). Keep `KIT-VERSION` current (`kit-version.mjs --write` last).
- A change to an existing kit file goes through the proposals lane (`scripts/kit-proposal-check.mjs`) when it comes from a *consumer*; inside the kit itself, just commit.
- Anything that changes a locked kit decision (`AGENTS.md` D-rules) is *ask first*.
