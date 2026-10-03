# FRICTION.md — focus-queue, round 2 (kit 2.0.0+65d1dd6bab6a)

## 1. Did CORE.md get you started alone?
Mostly yes: the session commands in §3/§6 worked as written. Looked up elsewhere: `scripts/session.mjs` header (flags
for `--touched`, `claim`), `prompts/SPEC-AUTHOR.md` (it assumes a human to interview), `scripts/decision-log.mjs` header,
`scripts/validate.mjs` source (to learn why 35 checks failed). The brief's `_external/round2/` did not exist; I created it.
CORE §5 sends you to `prompts/NEW-PROJECT.md`, which is **not in the scaffold** (and `validate` reports it missing).
The scaffold's `AGENTS.md`/`HANDOVER.md` are unfilled `<placeholders>` and mention `pnpm typecheck`, a dev port, curl health checks: irrelevant to a CLI.

## 2. Instructions skimmed, misread or impossible
- CORE §4.1: "`node scripts/validate.mjs --spec SPEC.md`" is the rule-1/rule-2 gate. **Impossible as written** (see 3a).
- new-project output: "3. node scripts/validate.mjs --spec=SPEC.md  # should be green". It is red on a fresh scaffold.
- SPEC-AUTHOR: "interview me ... Give the LLM a session with web search ... measure my input data". No human, no data, offline; I skipped A/B/C and said so in the spec's assumptions. The prompt has no "no human" branch.
- SPEC-AUTHOR/FIFO pattern NOT WHEN "needs more than about 5 numbered steps": my algorithm has 8; I split it into 4.3.1/4.3.2 purely to comply. 
- CORE §4 rule 7 "money is never a float ... no DELETE policy — in AGENTS.md": the scaffold AGENTS.md has none of these rules.

## 3. Surprising command results
a. **`node scripts/validate.mjs --spec=SPEC.md` -> `35 fail ... Result: FAIL`** (missing `prompts/PUBLISH-OPEN-SOURCE.md`, `examples/...`, etc.). Cause: `isKitSelf = resolve(args.spec) === join(kitRoot,'SPEC.md')`; in a consumer the "kit root" is the project root, so its own SPEC.md always triggers the kit-inventory layer. Spec-only result is 10 pass. I did not edit the gate; I validate a copy (`cp SPEC.md .tmp/spec-copy.md`). This is the #1 defect: a consumer can never go green by the documented command.
b. `session ack` Q3 "highest decision number in BUILDER-DECISIONS-REVIEW.md" = 8, counted from the template's *fenced worked example*; `claim decision-number:next` returned `0001`; `decision-log --number=1` then worked. Three tools, three notions of "next". Zero-padded `0001` vs `D1`/`Decision 1`.
c. `node --test tests/` fails on Node 22 ("Cannot find module .../tests"); the kit docs use the directory form elsewhere. `node --test scripts/selftest.mjs` is fine (19.6 s, 144 pass / 16 skipped).
d. Scaffold `package.json` ships `typescript` as devDependency, contradicting "zero deps" (brief rule 6). `scripts` referenced `migrate:check`, `kit:list` etc. I removed them.
e. `ack` modifies the session record after `start` committed it, leaving a dirty tree; nothing said to commit it.

## 4. Retrieval
Spec time (`--spec SPEC.md`, 12 of 24 hits above floor):
| pattern | score | verdict | why |
|---|---|---|---|
| append-only-audit-log | 8.5 | adapted | Postgres trigger/RLS replaced by hash-chained JSONL + single-writer grep test; the 3 lessons kept |
| fifo-cascade-algorithm | 7 | adapted | numbered procedure + hand-computed fixtures + tie-break rule were exactly right; Postgres-free |
| tiered-escalation | 4.5 | rejected | about LLM autonomy, matched on the word "tier"/"park" |
| empty-states | 4 | adapted | the 3-tier rubric used for `status` empty states (action vs message) |
| idempotent-migrations, pwa-offline, cross-tenant-404, multi-tenant-rls, observability-first, client-side-aggregation, FRONTEND-OVERHAUL, kit-self-application, manual-relay-worker-loop | 2.4-3.5 | rejected | no DB, no web, one user; matched on "schema/seed/offline/queue/forbidden" vocabulary |
Task time (`--task "...nextTicket scoring ... hash chain ... refuses finish..." --json`): append-only-audit-log 3.5, fifo-cascade-algorithm 3.5 (both already used), manual-relay-worker-loop 1.69, private-to-public 1.24 (rejected, noise).
**Misses:** nothing for "event sourcing / derive state by fold" (my core design), "CLI exit-code contract", "injectable clock / pure function testing", "single-user local JSON store". The first coverage run on the unfilled template also returned 12 noise hits.

## 5. Protocol cost vs value
Extra commands: doctor, start, ack x2, claim x6, decision-log x6, check-task-independence, close, check, scan-secrets = ~21 (claims for a single-writer project were pure ceremony). Saved: the dirty-tree refusal and `check` are cheap integrity; `decision-log.mjs` gave the entry shape with Date automatically; the `ack` questions did force reading the repo state.

## 6. Kit should do (ranked)
1. Fix `validate --spec` in consumers (`isKitSelf` should be false when `.kit-project.json` exists).
2. One definition of "next decision number" shared by `ack`, `claim next`, `decision-log`; ignore fenced code blocks; remove the fake "Decision 8" from the template (or stop it counting).
3. Scaffold should be internally green and consistent: no `typescript` devDep, no dead scripts, fill-in `AGENTS.md`/`HANDOVER.md` for non-web projects, include `prompts/NEW-PROJECT.md`, create `tests/` with a runnable example and a `gate` script.
4. A "no human" variant of SPEC-AUTHOR (state assumptions instead of interviewing).
5. `session.mjs close --gate-cmd` should be copy-pasteable from `package.json` scripts; document whether it uses a shell.
6. Patterns for pure-core + CLI + event-sourcing.

## 7. What worked well
`session start` refusing a dirty tree; `ack` proving state; `kit-coverage` printing NOT WHEN lines (I read and applied them); `decision-log.mjs`; the FIFO pattern's insistence on tie-break rules and fixtures shaped my test plan; `scan-secrets` clean/no-.env note was clear; the selftest skipping kit-only tests inside a consumer.

## 8. Verified vs inferred
Verified (ran): scaffold, doctor, start, ack, claim, decision-log, kit-coverage (spec + task), validate (both ways), scan-secrets, check-task-independence, `npm run gate` (spec 10 pass, 44 project tests, 144 selftest pass/16 skip). Inferred: that `isKitSelf` is the sole cause of 3a (read from source, confirmed by validating a copy); that claims matter only with multiple writers. Session close: passed, gate exit 0 (`npm run gate`), secrets clean; `session check`: "nothing to report", exit 0.
