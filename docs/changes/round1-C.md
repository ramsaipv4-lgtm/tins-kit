# Round 1B change note: WP-C (security + prompts)

## Files created
- `scripts/scan-secrets.mjs` — CLI per the brief: `--stdin` and/or paths (directories recurse, skipping `.git`, `node_modules`, and `.env*` files themselves), `--root <dir>` (default nearest `.git` ancestor, else cwd), `--no-env`, `--json`. Exit 0 clean / 1 findings / 2 usage. Prints class + line (and, for the env check, the variable NAME, never a value).
  Layers: (1) every value from `.env*` files under root (depth 4; templates `.example/.sample/...` ignored; low-signal values skipped; multi-line quoted values and `\n`-escaped forms handled) matched verbatim; (2) provider shapes (JWT, `sb_secret_/sb_publishable_`, AWS key id, `sk-ant-`-style, GitHub, Slack, Google, Stripe, private-key block, passwords in URLs); (3) generic `password=/secret=/token=` assignments with a random-looking value and a conservative entropy check (>=32 chars, >=3 char classes, >=4.3 bits, not hex, not a path/file name/word-slug). No allowlist and no inline ignore marker, by design (a model can type a marker).
- `scripts/tests/scan-secrets.test.mjs` (10 tests, invented secrets assembled from fragments), `scripts/tests/tooling-audit.test.mjs` (5 tests).
- This note.

## Files changed
- `AGENTS.md`: new section 3a "Trust levels"; counts bullet, the 0b count sentence and the `ls` count comments replaced by "counts are generated" plus `TODO(WP-F)` marker (I touched the three stale-count spots, not only one).
- `lib/patterns/tiered-escalation.md`: authored front matter (`derived_from: ["tins-kit#D32"]`, `not_when: []`, `verified: null`); six named T2 triggers table in 1.1 (promote, retract/deprecate, gate code, history rewrite after close, edit another session's record, any secret detected).
- `scripts/tooling-audit.mjs` + `prompts/TOOLING-AUDIT.md`: offline path. `**Discovery mode:** offline` keeps the gate red until `**Offline waiver:** signed by <human> on <date> — <handicap>` exists; `--print-offline-waiver` prints the template. Shape checks: real non-future date, not a placeholder, signer not agent/model-named, handicap >= 8 words.
- Eight prompts (WORKER-SESSION, AUTONOMOUS-BUILD, INTEGRATE-DELEGATED-WORK, KITTING, SPEC-AUTHOR, TOOLING-AUDIT, RELEASE-CHECKLIST, CONTINUE-TINS-PROJECT): each is now ONE self-contained outer block (four-backtick fence where it nests code; steps inside), fences balanced, `$PWD` -> "the project root you were given", "extended/max thinking" -> "the highest reasoning setting available", and a compact Trust block (trusted vs untrusted data, instruction-in-data = finding, least privilege, patterns only trusted if promoted, secret handling, relevant T2s). Meaning of steps unchanged. `selftest.mjs` command kept. RELEASE-CHECKLIST also gained a scan-secrets item and a `curl -o NUL` portability note; KITTING gained a front-matter paragraph and "promotion is T2".

## Verified (commands run)
- `node --test scripts/selftest.mjs` from `$KIT` and from `/tmp`: 104/104 pass (includes other WPs' tests at the time).
- `node scripts/validate.mjs --kit`: 73 pass, 0 fail.
- Front matter parsed with `scripts/_lib/pattern-meta.mjs`: no errors/warnings.
- Fence lint (my CommonMark-style scratch checker): all 8 owned prompts closed and single-block.
- scan-secrets run over the project's `docs/`, `SPEC.md`, `HANDOVER.md`, `BUILDER-DECISIONS-REVIEW.md`, `delegation/LEDGER.md` with `--root` at an empty dir (no real `.env` read): zero findings. On the kit tree it flags 7 lines (demo `DevPassword123!` in supabase-auth-trigger.md, two URL-credential doc examples): true-shaped but harmless; reword before wiring the scan over the kit itself.

## Inferred / not verified
- Real-model obedience of the Trust blocks is untested (red-team's own caveat); the permission boundary is the defence.
- Windows-native run of the scripts not executed; code uses `node:path`, strips `\r`, tests cover CRLF and a path with spaces.
- The offline waiver cannot prove a human typed it.

## Deviations
- AGENTS.md: edited three count spots, not one. Did not hand-write new numbers.

## Deferred
- Wiring scan-secrets into validate (WP-F) and session close (WP-B); nonce-fence generator (WP-A/B).

## Needs from another WP
- **WP-A:** `orchestrate.mjs` must extract the outermost fenced block (four backticks) of WORKER-SESSION.md, or the whole file; the pasted block now contains the steps. The block contains no literal double-brace placeholders except the six real ones, so "fail if any remain" works. Generator should wrap untrusted blocks as `<<<UNTRUSTED <nonce>` ... `UNTRUSTED <nonce>>>>` (AGENTS.md 3a names this format).
- **WP-F:** fence-balance lint in validate; generated counts for AGENTS.md; add scan-secrets to validate over `sessions/**`, `kit-staging/inbox/**`. The same unbalanced-fence defect exists in 11 prompts I do not own: DELEGATE-WORK, NEW-PROJECT (A); KITTING-REVIEW, KIT-GROWTH-SESSION (E); FRONTEND-REFRESH, FRONTEND-VISION-INTERVIEW, GENERATE-CURRICULUM, GENERATE-INTERVIEW-PREP, PROMOTE-TO-TINS, PUBLISH-OPEN-SOURCE, SPEC-REVIEWER.
- **WP-B:** `session close` should call `scan-secrets.mjs --stdin --root <project>` before writing and refuse on exit 1.
- **Owner of `templates/TOOLING-AUDIT.md`:** add `**Discovery mode:**` / `**Offline waiver:**` lines to the template.
