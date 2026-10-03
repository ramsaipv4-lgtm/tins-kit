# Prompt: EXECUTION-MODE-INTERVIEW (ask how this round's work should actually get built)

> **The shared interview that asks the user how the remaining work should be
> executed, instead of guessing it from how they happened to phrase the W.**
> One interview, several trigger points (D4): `prompts/SPEC-AUTHOR.md` once a
> new spec is locked, `prompts/NEW-PROJECT.md` at the same moment,
> `prompts/CONTINUE-TINS-PROJECT.md` Step 2 at the start of each round, and
> `prompts/AUTONOMOUS-BUILD.md` Step 0 as a confirmation.
>
> **Source:** D35 (session 17). Same shape as D28's
> `FRONTEND-VISION-INTERVIEW.md` — never duplicated, always referenced.
> It replaces the self-vs-external question `prompts/DELEGATE-WORK.md` Step 2
> used to ask on its own, so the user is asked once per round, in one place.
>
> **Ask per round, not per project.** Pre-fill with the previous round's
> answer so it is a one-word confirm when nothing has changed. The right mode
> genuinely shifts as remaining scope shrinks: five independent modules is a
> different question from the last two bug fixes.

---

## 0. Why this is asked at all

The kit can now build work five different ways, and the difference between
them is not a preference — it changes who is in the loop, what gets scrubbed,
which credentials are involved, and how failures surface. Guessing wastes real
money and real time. Three concrete ways guessing goes wrong:

- Spinning up an auditor and three workers for two files' worth of work costs
  more in coordination and tokens than doing it in this session.
- Assuming the user wants everything on one harness when they are paying for
  three, and would rather the other two were working.
- Assuming work stays in-house when the user intends to hand a task to a
  contractor — which means a packet needed scrubbing and never got it.

So: ask, show the real trade-offs, record the answer where the next session
can read it.

---

## 1. Read the previous answer first

```bash
grep -i "Execution mode for this round\|Default mode for this round" delegation/LEDGER.md 2>/dev/null
```

If a previous round's mode is recorded, open with it: *"Last round you ran
`auditor-local`. Same again for this one?"* If nothing is recorded, this is
the first round — present the full menu below.

Either way, if the remaining scope has changed shape since last time, say so.
"Last round had six independent modules; this one is two bug fixes in the same
file" is exactly the information that should change the answer, and the user
cannot weigh it if you do not say it.

---

## 2. The menu

Present all five. Do not silently filter — the user knows what accounts they
own and what they are willing to pay for; you do not.

### `solo` — this session builds it, sequentially

One session, W by W, no splitting. **The honest default when the remaining
work is small or genuinely interlocked.** Splitting two tasks costs more
coordination than it saves, and an independence check that keeps finding
conflicts is telling you the work is one task.

*Who is in the loop:* the user, continuously.
*Routes to:* the normal `CONTINUE-TINS-PROJECT.md` Step 3 W interview.

### `auditor-local` — auditor + workers, all in this harness

This session becomes the auditor; it spawns worker sessions in the same
harness and runs unattended, escalating only T2 decisions.

*Best when:* the remaining scope splits into three or more genuinely
independent tasks, the spec is properly locked, and the user wants to walk
away.
*Costs:* every worker burns the same account's quota, in parallel.
*Who is in the loop:* nobody, until a T2 parks a task.
*Routes to:* `AUTONOMOUS-BUILD.md` with round mode `auditor-local`.

### `auditor-remote` — auditor here, workers on the user's other LLMs

Same auditor, but the `adapter` in `delegation/ORCHESTRATION.json` names a
different CLI (or a GUI the user drives by hand) — so the orchestration happens
here and the building happens on whichever accounts the user owns.

**What a worker receives is a *packet*.** For every task in the wave,
`scripts/orchestrate.mjs` renders `delegation/tasks/<id>/PACKET.md` from the
task's `LEDGER.md` row, its `delegation/tasks/<id>/BRIEF.md` (Brief, Acceptance
criteria, Interface contract — the headings of `templates/TASK-BRIEF.md` work)
and `prompts/WORKER-SESSION.md`, with every placeholder filled; it refuses to
dispatch if one is left over. The worker command is then given a short pointer
("Read `<PACKET.md>` and follow it exactly") — never the prompt itself, and
never through a shell. This packet is *not* the scrubbed external packet of
`DELEGATE-WORK.md`: it names real paths and the real repo.

*Best when:* the user pays for more than one provider and would rather spend
another quota than this one, or wants a specific model on a specific task.
*Ask which platforms they have available and which they want used.*
*Watch for:* capability asymmetry. A worker on a weaker model needs a tighter
brief and a narrower task, and a hard task given to a weak worker fails
subtly and confidently rather than loudly. Where a task is genuinely
difficult — a from-scratch algorithm, a security-sensitive path, a
concurrency question — say so and recommend a frontier model at
its highest reasoning setting for that one, the same way `DELEGATE-WORK.md` does for
a forced task merge.
*Routes to:* `AUTONOMOUS-BUILD.md` with round mode `auditor-remote`.

Worker adapters (the `adapters` table in `templates/ORCHESTRATION.json`; set
`adapter` to one key, or a ledger `Adapter` column per task). Each is an argv
array run without a shell, so nothing from a ledger row can be executed:

| Adapter | Runs | Status of the preset |
|---|---|---|
| `claude-code` | `claude -p <pointer> --permission-mode acceptEdits --output-format json` | flags checked against `claude --help`, 2026-10-02 |
| `cline` | `cline --cwd <root> --json <pointer>` | flags checked against `cline --help` (3.0.68); needs `cline auth` first; not run |
| `opencode` | `opencode run --dir <root> --auto <pointer>` | flags checked against `opencode run --help` (1.18.34); `--auto` skips permission prompts — drop it to be asked; not run |
| `codex` | `codex exec --full-auto -s workspace-write <pointer>` | **unverified here** — codex was not installed when this was written |
| `gemini` | `gemini -p <pointer> --output-format json` | **unverified here** — gemini was not installed when this was written |
| `relay` | prints the `PACKET.md` path, waits for `RESULT.json` | for a chat/GUI worker with repo access; times out with a clear message |

A worker that finishes writes `delegation/tasks/<id>/RESULT.json`
(`returned` / `blocked-escalation` / `failed`); the runner prints it, and for
`relay` it is the completion signal. The auditor still reads `status.md` and
`NOTES.md` before trusting any of it.

All of these exit 0 on success, which is what `orchestrate.mjs` reads. Before
the first real wave, run `node tins-kit/scripts/orchestrate.mjs --dry-run`
(it reports whether each packet would render), then run the adapter's command by
hand on one task and watch it work. A wrong adapter fails identically for every
task, at 3am, three times over.

### `self-parallel` — the user orchestrates across their own LLMs

No auditor session. The user personally opens a session per task, on whatever
accounts and platforms they own, and drives them. Full repo, full context,
real `SPEC.md`, nothing scrubbed, no scrubbed packets and no `PACKET.md`.

*Best when:* the user wants to stay in the loop on each task, or their other
platforms are chat interfaces rather than CLIs the auditor could invoke.
*The difference from `auditor-remote` is who orchestrates* — a session, or
the person. Both use several LLMs; only one runs unattended. Make that
distinction explicitly, because it is the one users most often collapse. (A
chat/GUI worker fed through the `relay` adapter is still `auditor-remote`: the
auditor session renders the packet and tracks the result, and the person only
carries it across. In `self-parallel` the person is the orchestrator.)
*Routes to:* `DELEGATE-WORK.md` in `self-parallel` mode — it produces the task split and
the per-task launch instructions the user pastes into each window.

### `external` — someone else builds it

A hired human, a teammate, or anyone else's LLM session. Tasks go out as
scrubbed, self-contained packets: no repo access, no history, no methodology
vocabulary.

*Best when:* the executor is not the user.
*Costs:* the packet-building and scanning work is real, and it is not
optional.
*Routes to:* `DELEGATE-WORK.md` in external mode — `TASK-BRIEF.md`,
`packet/files/`, and `scan-task-packet.mjs` before anything ships.

### `hybrid` — different modes for different tasks

Any mix, recorded per task. *"Auditor builds the API while I do the frontend
myself on another account, and the data-import script is hired out."*

Record `hybrid` as the round mode and give **every task row its own real
mode** — never leave a row reading `hybrid`, which names no executor. Each
task then follows its own mode's rules: external tasks get packets and
scanning, `auditor-*` tasks get dispatched, `self-parallel` and `solo` tasks
do not.

---

## 3. Help them choose, then record it

Two questions settle most of it:

1. **Who is executing — you, this harness on its own, or someone else?**
   That separates `solo` / `self-parallel` from `auditor-*` from `external`.
2. **Does the remaining work actually split?** Count the independent tasks.
   Fewer than three usually means `solo` regardless of the first answer,
   because coordination overhead eats the gain. If you cannot name three
   file-disjoint tasks, say so plainly rather than proposing a split you
   already doubt.

Then record it in `delegation/LEDGER.md`'s round header:

```markdown
**Execution mode for this round:** auditor-local
**Round started:** 2026-08-26
```

The closed vocabulary is `solo` | `auditor-local` | `auditor-remote` |
`self-parallel` | `external` | `hybrid`. `scripts/orchestrate.mjs` reads this
line literally and **refuses to dispatch a round the user declared
user-driven or external** — that refusal is the point, so never write a mode
the user did not choose in order to make a command run.

Legacy `delegation/LEDGER.md` files from before this decision say
`**Default mode for this round:** self | external`; `self` is read as
`self-parallel`. Leave old ledgers alone, and use the new line going forward.

If the user picked `auditor-remote`, also set `adapter` in
`delegation/ORCHESTRATION.json` to the key from §2's table for the platform
they named (`relay` if their worker is a chat or GUI), and make sure each task
has a `delegation/tasks/<id>/BRIEF.md`.

---

## 4. What you do NOT do

- **Don't skip the question because the mode seems obvious.** It costs one
  exchange, and the wrong guess costs a round.
- **Don't hide options** because you assume the user has one account or no
  budget for contractors. Present all five; let them filter.
- **Don't ask it once and reuse it forever.** Re-ask per round, pre-filled.
- **Don't record a mode the user did not choose** to get past
  `orchestrate.mjs`'s refusal. The refusal is a safety property: it means the
  runner never auto-dispatches work the user said they would drive
  themselves, or work destined for a scrubbed packet.
- **Don't leave a task row reading `hybrid`.** That is a round-level word; a
  task needs a real executor.
- **Don't propose a split you don't believe in.** If the work does not
  separate, say so and recommend `solo`. An independence check that keeps
  failing is evidence, not an obstacle.
- **Don't promise an adapter you haven't seen run.** Recommend one manual
  test on one task first, and say which presets are unverified.

---

## 5. What success looks like

1. The previous round's mode was read and offered, if there was one.
2. All five modes were presented with their real trade-offs and costs.
3. `auditor-remote` vs `self-parallel` was explained as *who orchestrates*,
   not as a difference in how many LLMs are used.
4. The number of genuinely independent tasks was counted before a parallel
   mode was recommended.
5. For `auditor-remote`, the user named their platform, `adapter` was set —
   and one manual test was recommended before the first wave.
6. The chosen mode is written into `delegation/LEDGER.md`'s round header using
   the closed vocabulary, and every task row carries a real executor.
7. The session routed to the right next prompt rather than asking again.

---

*— End of `EXECUTION-MODE-INTERVIEW.md`. See also: `prompts/AUTONOMOUS-BUILD.md`
(`auditor-local` / `auditor-remote`), `prompts/DELEGATE-WORK.md`
(`self-parallel` / `external`), `prompts/CONTINUE-TINS-PROJECT.md` (Scenario 3,
triggers this per round), `prompts/SPEC-AUTHOR.md` and `prompts/NEW-PROJECT.md`
(trigger it once the spec locks), `templates/DELEGATION-LEDGER.md`,
`templates/ORCHESTRATION.json`, `scripts/orchestrate.mjs`.*
