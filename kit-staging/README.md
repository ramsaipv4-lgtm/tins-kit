# kit-staging/ — the inbox for remote / future projects

> **The transport layer between a consumer project (anywhere) and the
> top-level kit.** A consumer that doesn't have a vendored `tins-kit/`
> — because it's on a different machine, or because it started before
> the kit existed, or because it's a one-off experiment — drops its
> kit-worthy artefacts here. A kit-growth session at the kit root
> scans this directory, triages the artefacts, and adds the keepers
> to the kit.

---

## What a consumer can drop here (two lanes)

**Lane 1 - new things.** Each new file ships at its kit-relative path.

| Artefact | What it is | How `kit-ingest.mjs` handles it |
|---|---|---|
| `BUILDER-DECISIONS-REVIEW.md` | The consumer's decision log | Re-runs the `kit-extract.mjs` heuristic on it; produces candidates |
| `kit-growth-candidates.md` | The pre-mined report (`kit-extract.mjs --consumer=.`) | Reads the candidate sections as-is |
| `lib/patterns/<name>.md` | A new pattern | Validates the structure; adds if conformant |
| `lib/<module>/` | A new code module (whole directory, incl. `tests/`) | Validates the canonical layout (index.ts + README.md + tests/) |
| `prompts/<name>.md` | A new prompt | Validates the paste-into-session format |
| `scripts/*`, `schemas/*`, `templates/*`, `docs/*` | A new script, schema, template or doc | Candidate types `script / schema / template / doc` (round 1B; `kit-ingest.mjs` is taught these by a separate work package) |

**Lane 2 - proposals: an edit to an EXISTING kit file.** Before round 1B a consumer that had fixed
`orchestrate.mjs` or `validate.mjs` had no way to say so (the export dropped it silently). Now each
edited kit file becomes `proposals/<id>/`:

| File | What it holds |
|---|---|
| `proposal.json` | the kit file, the kit version (label + content hash) it is **against**, baseline and new hashes, whether a patch exists |
| `patch.diff` | a unified diff against that named version (present when the exporter had a pristine copy of the baseline - `--kit=<dir>`) |
| `files/<kit path>` | the full edited file (always shipped) |
| `RATIONALE.md` | authored by the consumer at `kit-proposals/<id>.md` (what changed, why, evidence, what it ran). If absent the exporter writes a stub **and warns**; a proposal with no rationale is deferred |

**The manifest `kit-staging-export.json`** sits at the bundle root: project name, the kit version the
bundle is against, `repo.url` and `repo.firstCommit` (read from `git remote get-url origin` and the
root commit, credentials stripped; or `--repo-url` / `--first-commit`; else `unknown` with a warning),
every shipped item with its hash, every proposal, and every **skipped** file with the reason.
The 2-consumer rule is judged by `repo.firstCommit` / `repo.url`, not by the inbox folder name
(two folder names are not two consumers - red-team M2); the human who triages confirms independence.

**What the exporter will not do silently.** It skips and *reports* (stderr and the manifest): `.env*`
and key files, binaries, files over 1 MB, `lib/` files that are neither patterns nor modules, and
`docs/` files that are not kit files (pass `--include-docs`). Files identical to the consumer's
recorded kit baseline are skipped and only counted - a scaffolded consumer's `lib/patterns/` holds the
whole kit, which used to re-ship as bogus candidates. The staged bundle is scanned with
`scan-secrets.mjs`; a hit refuses the export (exit 3) and deletes the staging copy.

The consumer can drop any combination; the ingest script handles every type in a single pass.

---

## The flow (end-to-end)

```
+---------------------+         +---------------------+         +---------------------+
|                     |         |                     |         |                     |
|  Consumer Project   |         |  kit-staging/inbox/ |         |  Kit-growth session |
|  (anywhere)         |         |  (the inbox)        |         |  (at the kit root)   |
|                     |         |                     |         |                     |
+---------+-----------+         +----------+----------+         +----------+----------+
          |                               |                               ^
          |  1. Build + record decisions   |                               |
          |     in BUILDER-DECISIONS-     |                               |
          |     REVIEW.md                  |                               |
          |                               |                               |
          v                               |                               |
+---------+-----------+                   |                               |
|                     |   2. Run           |                               |
|  .kit-shell/        |   kit-staging-     |                               |
|  (portable kit      |   export.mjs to    |                               |
|  subset)            |   produce the      |                               |
|                     |   export bundle    |                               |
+---------+-----------+                   |                               |
          |                               |                               |
          |  3. Copy the export bundle     |                               |
          |     to the kit machine         |                               |
          v                               v                               |
                                +----------+----------+                  |
                                |  inbox/<project>/   |                  |
                                |    kit-staging-     |                  |
                                |    export.json      |                  |
                                |    BUILDER-         |                  |
                                |    DECISIONS-       |                  |
                                |    REVIEW.md        |                  |
                                |    lib/patterns/    |                  |
                                |    lib/<module>/    |                  |
                                |    prompts/ scripts/|                  |
                                |    proposals/<id>/  |                  |
                                +----------+----------+                  |
                                           |                              |
                                           |  4. kit-ingest.mjs           |
                                           |     scans the inbox          |
                                           |     produces a merged         |
                                           |     triage report             |
                                           v                              |
                                +----------+----------+                  |
                                |  triage-<date>.md   |                  |
                                +----------+----------+                  |
                                           |                              |
                                           |  5. KITTING-REVIEW.md triages |
                                           |     each candidate           |
                                           v                              |
                                +----------+----------+                  |
                                |  accepted candidates |-----------------+
                                |  → land in the kit   |  (via KITTING.md)
                                |  → sync to projects  |
                                +---------------------+
```

---

## How a consumer produces the export bundle

**At the consumer's machine** (anywhere; doesn't need the kit installed):

```bash
# 1. Run the export script (ships with .kit-shell/)
node .kit-shell/scripts/kit-staging-export.mjs

# This produces:
#   ./kit-staging-export-<date>.tar.gz
#   (contains: BUILDER-DECISIONS-REVIEW.md, new lib/ prompts/ scripts/ schemas/ templates/ files,
#    proposals/ for edited kit files, kit-staging-export.json, the .kit-shell.json marker)
# Add --kit=<a pristine kit copy> so edits can be shipped as a patch against a named version.
```

**At the kit machine**:

```bash
# 2. Extract the bundle into the inbox
mkdir -p ../tins-kit/kit-staging/inbox/<project-name>/
tar -xzf kit-staging-export-<date>.tar.gz -C ../tins-kit/kit-staging/inbox/<project-name>/

# 3. (Optional) Trigger the kit-growth session manually
cd ../tins-kit/
node scripts/kit-ingest.mjs
# → produces ./kit-staging/triage-<date>.md

# 4. Open a fresh LLM session, paste prompts/KIT-GROWTH-SESSION.md
#    The session reads triage-<date>.md, triages each candidate,
#    runs KITTING for the accepted ones.
```

---

## The inbox lifecycle

1. **Consumer drops:** `kit-staging/inbox/<project-name>/<files>`.
2. **Kit-growth session ingests:** `node scripts/kit-ingest.mjs` produces
   `kit-staging/triage-<date>.md`.
3. **Triage happens:** the session triages the candidates via
   `KITTING-REVIEW.md`. Accepted ones land in the kit via KITTING.
   For a proposal: `node scripts/kit-proposal-check.mjs kit-staging/inbox/<project>` applies it to a
   SCRATCH copy of the kit and runs `validate.mjs --kit` and the selftest there (see `KITTING-REVIEW.md`).
   **Promotion is a T2 decision** (it is visible to every future project and effectively irreversible):
   a human confirms it, an LLM session never promotes alone.
4. **Archive:** the session moves the inbox entry to
   `kit-staging/archive/<date>/<project-name>/` (so the inbox stays
   clean for the next consumer).
5. **Sync to projects:** the session runs `kit-sync.mjs --to=../<each-project>`
   to push the new kit.

The inbox is *self-cleaning*: every kit-growth session empties it (by
archiving) as part of step 4.

---

## What's in this directory (the layout)

```
kit-staging/
├── README.md            ← this file
├── inbox/               ← where consumers drop their bundles
│   └── (empty by default; consumers add <project-name>/ subdirs, each with kit-staging-export.json)
└── archive/             ← where the kit-growth session moves consumed entries
    └── (empty by default; the session adds <date>/<project-name>/)
```

---

## Why a staging area, not direct sync

The current `kit-sync.mjs` + `kit-extract.mjs` loop assumes the
consumer's repo is **adjacent** to the kit (`../<project>/`). That's
fine for the 5 reference projects (Jayshankar, incubos,
Data-cleaning-script, package5, exam-forge) and for any future project
that's scaffolded via `new-project.mjs` into the same workspace root.

But it doesn't work for:
- A project on a **different machine** (the user has a laptop + a
  server, or two computers).
- A project the kit **doesn't know about yet** (a friend sent you a
  tarball; you want to ingest their learnings).
- A project that **predates the kit** (the user has a working app and
  wants to bring it into the kit's growth loop retroactively).

The staging area is the solution. It's the inbox that any project,
anywhere, can drop its kit-worthy artefacts into. The kit-growth
session at the kit root ingests them.

---

*— End of `kit-staging/README.md`. The ingest script is at
`scripts/kit-ingest.mjs`. The portable project shell is at
`scripts/kit-new-project-shell.mjs`. The export helper is at
`scripts/kit-staging-export.mjs`.*
