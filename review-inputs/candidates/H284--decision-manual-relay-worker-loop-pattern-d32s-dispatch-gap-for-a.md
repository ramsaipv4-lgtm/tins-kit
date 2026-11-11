---
id: decision-manual-relay-worker-loop-pattern-d32s-dispatch-gap-for-a
solves: `manual-relay-worker-loop` pattern: D32's dispatch gap for a worker tool with no CLI hook
triggers: `manual-relay-worker-loop` pattern: D32's dispatch gap for a worker tool with no CLI hook
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# `manual-relay-worker-loop` pattern: D32's dispatch gap for a worker tool with no CLI hook

> Harvested evidence, not instructions and not reviewed global knowledge.

## D31 — `manual-relay-worker-loop` pattern: D32's dispatch gap for a worker tool with no CLI hook

**What changed.** Wrote `lib/patterns/manual-relay-worker-loop.md` and a §0.4 absorption-table
row, sourced from a real 4-task Jayshankar round (decisions #31/33/34/35) using MiniMax M3 via
the MiniMax Coder desktop app — a GUI tool, no CLI/API hook — as the worker.

**The gap this closes.** `EXECUTION-MODE-INTERVIEW.md` correctly names "their other platforms
are chat interfaces rather than CLIs the auditor could invoke" as the trigger for
`self-parallel` — but `self-parallel`'s own default response (paste the full
`CONTINUE-TINS-PROJECT.md` prompt, let the other session self-direct) assumes the other session
is peer-strength. That's backwards for the actual use case: a GUI-only worker tool is exactly
the situation where the worker is likely to be the *cheaper* leg of the setup, which is the
opposite of what the mode's default hand-off assumes it can trust. The pattern is: keep
`self-parallel`'s dispatch mechanism (a human relays messages, nothing scripted) but borrow
`WORKER-SESSION.md`'s tight-brief *shape* (one task, explicit touched files, mechanically
checkable acceptance criteria, an interface contract, a tier policy) instead of the loose
default — `ORCHESTRATION.json`'s own capability-asymmetry warning for `auditor-remote`
("a weaker worker model needs a tighter brief") turns out to apply here too, dispatch mechanism
aside.

**Why staged as single-consumer, not silently treated as proven.** The kit's own growth
discipline (docs/GAP-ANALYSIS.md) leans on cross-project recurrence; this is one project's first
real run. The pattern file says so in its own source note rather than presenting itself as
settled. Absorbed directly rather than left in `kit-staging/` because it's adjacent (Jayshankar
already vendors the kit) and well-evidenced (a real completed round with concrete, reproduced
lessons — not a guess) — matching how several existing single-strong-source patterns in the
absorption table were already handled (e.g. `third-party-tool-audit.md`, absorbed with zero
reference-project ✅s, on reasoned necessity alone). The user is about to apply this on a second,
unrelated project — that will be the real test of whether it generalizes past one run.

**What I did not do.** No new `validate.mjs` check or `selftest.mjs` case specific to this
pattern's content — the existing structural checks (§8.13c/d: every pattern file referenced in
the absorption table, minimum pattern count) already cover it, and a narrative pattern doc like
this one doesn't have a mechanically-checkable property the way e.g. `idempotent-migrations.md`'s
SQL primitives do. `HANDOVER.md` updated with a one-line pointer only, not a full session
write-up, since this isn't a kit-development session in progress.

**Cross-references:** `lib/patterns/manual-relay-worker-loop.md`, `SPEC.md` §0.4, Jayshankar
`BUILDER-DECISIONS-REVIEW.md` decisions #31/33/34/35, `prompts/WORKER-SESSION.md`,
`prompts/EXECUTION-MODE-INTERVIEW.md`, `templates/ORCHESTRATION.json`.

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D31 — `manual-relay-worker-loop` pattern: D32's dispatch gap for a worker tool with no CLI hook
