# FRICTION.md - round 2, `jayshankar-course` (a content deliverable, not code)

## 1. Did CORE.md get you started alone?
Mostly. `doctor`, `start`, `ack` worked as written. Looked up elsewhere: scaffolding (the brief; CORE.md section 5
points to `prompts/NEW-PROJECT.md`, absent from the scaffold); `claim` syntax and `close --gate-cmd` (the
`session.mjs` header; CORE.md shows only `migration-number:next`); that `decision-log.mjs --number=` demands a
claimed number (never mentioned).

## 2. Skimmed, misread, or could not follow
- Brief and CORE.md rule 1, `validate.mjs --spec SPEC.md`: **cannot pass in a scaffold** (see 3).
- `GENERATE-CURRICULUM.md` Step 0: "`ls tins-kit/`; `node tins-kit/scripts/validate.mjs`" and Step 7:
  "`tins-kit/scripts/private-to-public.mjs`". A scaffold has neither folder; I used the kit's copy.
- Same prompt, Step 4, "never invent a bug". This course needs a failure in every lesson and two wanted ones (float
  money, a vanishing offline write) were never recorded defects. No category exists for "staged, labelled"; I
  invented CONSTRUCTED.
- `ack` question 1: `grep "status: open"` gives 0 because records write `status: "open"`; question 3 does not say
  whether `sessions/` counts. Answered by trial.

## 3. Surprising command results
- `node scripts/validate.mjs --spec=SPEC.md` at the root -> `47 pass, 1 warn, 35 fail`, e.g. `X §8.14b
  scripts/new-project.mjs scaffolder missing`. Cause (`validate.mjs` ~line 162): `isKitSelf = resolve(args.spec) ===
  join(kitRoot,'SPEC.md')`; scripts live at the project root, so `kitRoot` is the project and any root SPEC.md is
  mistaken for the kit's. **The documented gate is red on a fresh scaffold whatever the spec says.** Workaround:
  validate a copy elsewhere (in `scripts/course-gate.mjs`): `10 pass, 0 warn, 0 fail`.
- `private-to-public.mjs --scan-only` -> `8 leak(s) found`: every one a citation of `SPEC.md` or a decision log,
  which this course must make (D3). "Fix until exit 0" would delete its provenance. (Exit code was masked by a pipe.)

## 4. Retrieval
Spec time: 12 hits, mostly noise (my SPEC names Jayshankar topics).
| Pattern | Score | Verdict | Why |
|---|---|---|---|
| pwa-offline-graceful | 5 | adapted | subject of M15, not a method for the deliverable |
| kit-self-application | 4 | used | confirms the decisions-log habit |
| empty-states | 3.5 | adapted | "an error is not loading" is the same idea |
| multi-tenant-rls, two-prisma-clients, cross-tenant-404, observability-first | 2.5-3.5 | rejected | wrong subject |
| client-side-aggregation | 2.4 weak | **used** | it is decision 24, the lesson's design; best match, weakest score |

Task time: my natural-language task returned only `FRONTEND-OVERHAUL` (rejected: a Jayshankar restyle plan).
**Missed:** `client-side-aggregation` appeared only when I used its words ("sum ... group by ... Postgres view" ->
6.5). "a validator check that proves it can fail with a selftest" -> **nothing**, though Jayshankar decision 30 is
that lesson. `private-to-public`, `supabase-auth-trigger`, `postgres-mutations` never surfaced.

## 5. Cost vs value of the protocol
About 17 extra commands (`doctor`, `start`, `ack` x2, `claim` x4, `decision-log` x4, commits, `close`, `check`).
For one agent, claims and the ack protected nothing; `decision-log.mjs` numbering and the computed record gave value.
For a **non-code deliverable** the plumbing fits but the gate does not: `--gate-cmd` expects tests, `validate --spec`
checks only the spec (not one lesson), and "lines changed" means little for prose. I wrote `scripts/course-gate.mjs`
(spec structure, module count, citation existence, word budgets, checker self-test) so `close` has a real command.

## 6. What the kit should do (ranked)
1. Make `validate --spec SPEC.md` pass in a scaffold (compare with `.kit-project.json`, not the path).
2. `GENERATE-CURRICULUM.md`: say what to do when the source is not a vendored TINS project; add a "constructed,
   labelled" category; say where `private-to-public.mjs` lives.
3. Let the scan take an allowlist of citations, or state that a curriculum cannot pass it.
4. Add a **code-verification step**: nothing makes the generator build or test shipped code. Running mine found four
   defects (`VERIFICATION.md`); the prompt's only gate is a banned-word scan.
5. Retrieve on meaning, not only trigger phrases; add a "checks that can fail" pattern.

## 7. What worked well
`new-project.mjs` scaffolded fast with a green selftest (144 pass, 0 fail). `decision-log.mjs` and `claim` are quick
and refuse collisions. `validate --spec` names the exact missing item. `--task --json` carries `not_when`, so a hit
was rejected in seconds. `GENERATE-CURRICULUM.md`'s rules (real sources, no invented bug, one tracker, resume without
redoing) were right; I kept them.

## 8. Does `GENERATE-CURRICULUM.md` work for this job?
**Partly.** It assumes a finished gate-green TINS project with the kit vendored, a learner with no *domain* knowledge
but programming ability, subsystem-ordered modules, a bug as an appendix, one file per turn and an interactive user.
I departed in five places (decision D1): dependency order, the failure as the spine, two tracks plus two UI flavours,
several files per turn, and shipped code that is built and tested.

## 9. Verified vs inferred
**Ran:** scaffold, `doctor`, `start`, `ack`, claims, `decision-log`, `validate` (red at root, green on a copy),
`selftest` (144/0), `kit-coverage` x5, `private-to-public --scan-only`, `scan-secrets`, `course-gate`, and the
lesson code (tsc, 14 vitest, 4 checker tests, vite build, Playwright; `VERIFICATION.md`).
**Inferred:** that lessons work on a clean `npm install`; real Supabase's other two error texts; that this friction
reproduces on other scaffolds.
