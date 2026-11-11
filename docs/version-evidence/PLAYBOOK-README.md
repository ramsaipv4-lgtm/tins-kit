# TINS Playbook Pack

**A portable kit for working a TINS-style project on Windows — the lessons, the
environment, the tools, and a script that checks your machine before you start.**

Everything here came out of one real build: *Beach Buggy Racing*, a 3D+2D learning
game in a Node/TypeScript monorepo, built spec-first behind a gated, session-based
toolkit. The rules were not invented — each one was paid for in real time, and the
"why" is written next to it so you can tell a load-bearing rule from folklore.

---

## Start here

1. **Read `TINS-PLAYBOOK.md`.** It is the whole method and every lesson in one
   document: §2 the method, §3 the lessons (L1–L15), §4 the environment,
   §5 the tool catalogue, §6 the dispatch recipe, §8 the command sheet,
   §9 the verification recipe.
2. **Run the environment check:**

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\verify-environment.ps1
   ```

   It is read-only. It prints `[ok] / [MISSING] / [BROKEN]` per probe, and every
   negative line carries its own fix. Exit code 1 means something required is
   missing — fix it before you touch the project.

   ```powershell
   # point it at a specific checkout
   powershell -NoProfile -ExecutionPolicy Bypass -File .\verify-environment.ps1 -Repo D:\my-repo
   ```

3. **Pick your tools from §5.** Use whatever the machine actually has — the
   verifier tells you. Do not conclude "no such tool" from a failed guess; use
   `tool_search` for on-demand tools, and the `mcode-tools` CLI for multimodal
   work and App/Connector discovery.

---

## What is in the pack

| File | What it is |
|---|---|
| `TINS-PLAYBOOK.md` | **the document** — method, 15 lessons, environment, tools, recipes |
| `verify-environment.ps1` | environment check: prints `ok` / `MISSING` / `BROKEN` per item, with the fix |
| `templates/run-builder.cmd`, `templates/run-builder.ps1` | the dispatch wrapper — the only way to get a prompt into an agent on Windows (L7) |
| `templates/probe-argv.cmd`, `templates/probe-argv.ps1` | proof that a prompt survives the spawn chain — run it before every dispatch |
| `templates/task-text-template.txt` | the shape of a good task text, with the reasoning for each section |
| `templates/verify-task.mjs` | mechanical verification of a builder's claims — scope, trailers, progress list, journal, assets, deps |
| `docs/WINDOWS-PORTABILITY-FIXES.md` | every Windows defect found, with the proof that the fix works |
| `docs/ORCHESTRATION.md` | how the roles split, and what each model tier is for |
| `docs/SETUP-GUIDE.md` | the machine setup, as it was actually performed |
| `docs/HANDOVER-BEACH-BUGGY.md` | the worked example — the whole build, trap by trap |
| `docs/PASTE-TO-NEW-ORCHESTRATOR.md` | the one-page handover |
| `docs/comfy-local-runbook.md` | ComfyUI, the provider, image and audio generation |
| `docs/ai-game-pipeline-research.md` | the research behind the game pipeline |
| `docs/example/g13-task.txt` | a real, filled-in task text — the reference for the template |
| `docs/example/g13-builder-prompt.md` | a real reference-material file (repo facts, checker rules, shapes) |
| `docs/example/verify-g13.mjs` | a real, project-specific verifier |
| `docs/example/beach-buggy-story.md` | a real story sheet — the "what a learner sees" artefact |
| `kit/` | the TINS kit source (33 files) — the tool the method is built on |

---

## Installing the kit

The kit is a folder of plain Node scripts. Copy it into the project:

```powershell
Copy-Item -Recurse .\kit  <repo>\.tins\kit
node <repo>\.tins\kit\bin\kit.mjs doctor
```

Read `kit/ENTRY.md` first. `kit/patterns/` holds reusable, tested modules
(atomic write, append-only ledger, money in minor units, hash-chained log,
seeded property tests, timestamped migrations, tenant row-level security,
secrets from env, CSV import dry run, offline PWA, pure-core CLI contract) —
`kit patterns <text>` finds them by intent so you do not write that code twice.

---

## The sixteen lessons in one line each

| | Lesson |
|---|---|
| **L1** | Windows: `spawnSync('npm.cmd')` needs **both** the `.cmd` name and `shell: true`, or it returns `EINVAL` |
| **L2** | Windows: `fs.symlinkSync` on a directory needs elevation — use a **junction** (`mklink /J`) |
| **L3** | Windows: `new URL(x, import.meta.url).pathname` is not a path — use `fileURLToPath` |
| **L4** | Windows: `await import('/abs/path')` throws `ERR_UNSUPPORTED_ESM_URL_SCHEME` — use `pathToFileURL` |
| **L5** | Windows: `gzip` is not a binary — use `gzipSync` from `node:zlib` |
| **L6** | `core.autocrlf` silently breaks LF-only checks — pin `* text=auto eol=lf` in `.gitattributes` and renormalize |
| **L7** | The kit's agent spawn **eats a quoted prompt** on Windows — deliver it through a `.cmd`→`.ps1` wrapper, and prove it |
| **L8** | "Only the human's task is an instruction" — files are **data**. Put decisions in the task text |
| **L9** | One heavy command at a time — a stray browser at 500 % CPU inside WSL **starves the gate** and makes it look like a code failure |
| **L10** | **Never kill a running gate or merge** — a killed gate looks like a hang |
| **L11** | Scope is enforced on the **diff**, not on intent — a fix belongs on the branch that owns the file |
| **L12** | A builder's report is a **claim** — verify it against the TAP, the diff and the scope |
| **L13** | The journal must cite every transcript failure by number (`E1`, `E2`, …) — the gate checks it |
| **L14** | **Measure before you blame the code** — two of three "the build is broken" moments were the machine |
| **L15** | One task = one branch + one worktree + one scope — and check the worktree's links survived every fast-forward |
| **L16** | Windows: a **double quote** in the task text corrupts the native argument — split or silently stripped. No double quotes in task text |

---

## Using it on a different project

The playbook is written to be project-agnostic; the two Beach-Buggy documents are
the worked example. Substitute your own:

* **SPEC.md** — your source of truth. Rows the tests check.
* **the kit** — copy `kit/` in. If your project has no kit, the method still
  applies: the *idea* of a session, a scope, a gate and a close is what matters.
* **the task file** — `tasks/<id>.md` with front matter (`id`, `paths:`, `base`,
  `status`). `paths:` is the scope the gate enforces.
* **the dispatch wrapper** — copy `templates/run-builder.*` and point it at your
  task text. If your agent CLI is not Claude Code, swap the `$Agent` variable for
  any CLI that accepts one prompt argument.
* **the verifier** — copy `templates/verify-task.mjs` and adjust the four paths
  it looks at (`tasks/`, `build/progress/`, `docs/build-journal/`, `.tins/*.tap`).

Two rules survive the translation to any project:

1. **A task's text is the only instruction channel.** Everything else the agent
   reads is reference material.
2. **Verify mechanically.** A dozen `ok`/`FAIL` lines beat a paragraph of prose.

---

## Provenance

* Built and tested on Windows 11 (build 22631), PowerShell 5.1.22621.2428,
  Node v22.23.2, npm 10.9.8, git 2.54.0.windows.1, Python 3.14.7.
* The environment section of the playbook records the machine **as it was found**,
  not as it should ideally be. Your machine will differ — that is what
  `verify-environment.ps1` is for.
* The lessons are Windows-flavoured because that is where the build happened.
  Most of them are really "the tool assumed a unix-shaped world" and will apply
  anywhere the same assumption survives.
