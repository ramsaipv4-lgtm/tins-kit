# FRICTION.md — expense-tracker (round 2, kit 2.0.0+65d1dd6bab6a)

## 1. Did CORE.md get you started alone?
Mostly. Session protocol (§3, §6) worked from CORE alone. Looked up elsewhere:
- `CORE §5` says "start a new project -> `prompts/NEW-PROJECT.md`": **not in the scaffold**, and the kit's copy describes a different flow (`.kit-shell/`). Also absent: `GENERATE-CURRICULUM.md`, `STEERING-PROMPTS.md`, `INDEX.md`.
- `scripts/session.mjs` and `scripts/decision-log.mjs` headers (the only place `--touched`, claim semantics and `--number` are documented).
- Scaffolded `AGENTS.md` / `HANDOVER.md` are unfilled web-app templates (PowerShell, `pnpm typecheck`, `/api/auth/login`); the scaffold also ships `prisma/` and `src/lib/validations/` for a project with no database.

## 2. Instructions skimmed, misread, impossible
- CORE §4.1 / brief: "`node scripts/validate.mjs --spec SPEC.md`" is **impossible to pass in a consumer**. `validate.mjs` sets `isKitSelf = resolve(args.spec) === join(kitRoot,'SPEC.md')`; in a consumer, kitRoot is the project root, so every spec is treated as the kit's own and ~35 kit-inventory checks (`§8.14a 21 missing files`, `§8.28a GENERATE-CURRICULUM.md missing`) fail on a fresh scaffold. Workaround: validate a copy of SPEC.md from outside the root (10 pass, 0 fail). `npm run validate` is red out of the box; CORE says "a red gate stops you".
- CORE §4.7: "Money is never a float ... project rules in `AGENTS.md`" — the scaffolded AGENTS.md contains no money rule (`<rule 1>` placeholders). I wrote it myself.
- `ack` counts are guess-and-check: my own `start` commit adds `sessions/`, and `status: "open"` is quoted YAML (my first grep found 0). 34|11|1 passed.

## 3. Surprising command results
- `node scripts/validate.mjs --spec=SPEC.md` -> `47 pass, 1 warn, 35 fail` on the untouched scaffold (see §2).
- `node --test tests/` -> `# fail 1` on Node 22 (a directory argument is not accepted); glob works. `package.json` has no `test` script (I added one).
- `decision-log.mjs --context/--decision` render as headings "What changed" / "Why": flags and headings do not line up.
- `claim decision-number:next` returns `0001`, but the template file already contains a `### Decision 8` worked example, so "max+1" and "claim next" disagree about what is free.
- `kit-coverage --spec` prints 12 hits but 8 are "weak: matched on shared vocabulary" with Postgres/React-only patterns (`cross-tenant-404`, `FRONTEND-OVERHAUL`, `idempotent-migrations`) — pure noise for a CLI.

## 4. Retrieval
Spec time (`kit-coverage --spec SPEC.md`):

| Pattern | Score | Verdict | Why |
|---|---|---|---|
| append-only-audit-log | 4 | **adapted** (principle only) | Postgres SECURITY DEFINER trigger recipe; I needed a domain ledger with reversing entries, which it does not cover |
| empty-states | 3.5 | adapted | UI-centric; I took "every list has a considered empty state" into plain-text output |
| env-vs-config, pwa-offline-graceful | 3 | rejected | env files; React hook + banner |
| observability-first, client-side-aggregation | 2.5 / 2.4 | rejected | multi-tenant runbook; React/Postgres decision aid |
| fifo-cascade-algorithm | 2.4 | adapted (form) | numbered algorithm + node:test fixture shape; content irrelevant |
| five others (cross-tenant-404, FRONTEND-OVERHAUL, ...) | 2.4 | rejected | noise |

Task time (`--task`): a long task sentence returned only `append-only-audit-log` (3.5). Separate queries "store money as integer paise never float", "atomic write crash safe local json file", "parse bank statement csv quoted commas", "reversing entry correction ledger", "random property test generator" returned **nothing**.

**Misses (a human with the kit would have wanted):** integer-money/paise handling; atomic file write (temp + fsync + rename); crash-safety testing by killing a child; append-only *domain ledger* with reversal/correction chains; CSV tokenizing/import dedupe; property-style testing with a seeded PRNG; CLI-with-JSON-store layout. **Coverage did not surface a money pattern because none exists**, and CORE only mentions money in one line. The append-only pattern surfaced only as an audit-log trigger, which a model must reinterpret.

## 5. Protocol cost vs value
Cost: doctor, start, 3 repo-counting commands + ack, 5 claims (one per decision number), 5 decision-log calls, close, check ~ 17 commands, ~3 reads of script headers. Most of it was cheap. The 5 separate claims for sequential numbers in one single-agent session are pure overhead (decision-log refuses without `--number` once `claims/` exists, so the first claim silently makes all later ones mandatory). Saved me: the Session-trailer reminder printed by `start`; `scan-secrets`. `check-task-independence` (trivially green with one task) and `ack` gave me nothing.

## 6. Things the kit should do (ranked)
1. Make `validate --spec SPEC.md` pass in a consumer (kit-self detection by path is wrong in a scaffold).
2. Fill scaffolded AGENTS.md/HANDOVER.md per project type or ship a CLI variant; drop prisma/ and `src/lib/validations/` unless asked; include the prompts CORE names.
3. Ship patterns for: integer money, atomic file write, append-only domain ledger/reversal, CSV import, seeded property tests. Put "money = integer minor units" in CORE or AGENTS template as a rule with a check (a grep test is what I built).
4. `session claim decision-number` auto-claim inside `decision-log` for single-agent use; align flag names with headings.
5. Add a `test` script and Node-22-safe glob to the scaffold; hide "weak" coverage matches by default.

## 7. What worked well
`session.mjs` start/close/check is coherent and fast; `scan-secrets` and `doctor` are quiet and exact; `NOT WHEN` lines made rejections quick; the SPEC skeleton (§0.0, §0.4, §9) forced useful thinking; spec-structural validation (on a copy) is precise.

## 8. Verified vs inferred
Ran: scaffold, doctor/start/ack/claim/close/check, validate (in place 35 fail; copy 10 pass), selftest (144 pass, 0 fail, 16 skipped), 25 product tests, a mutation check (breaking `summary` fails 3 tests), the coverage queries above. Inferred: Windows rename-over-existing behaviour; that `isKitSelf` is the only cause of the red in-place validation (read in source, not patched).
