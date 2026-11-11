# tins-kit-next — evidence-first software factory kit

## Archived iteration: how it was intended to work

This branch preserves the runnable pilot kit, not the newer specification on main. It extends the compact CLI with required pre-work retrieval receipts, local lessons, central review/import/export and read-only harvesting of older projects. The underlying application framework remains the project's choice.

The expected lifecycle is: interview and agree on product intent; scaffold a separate application repository; consult relevant precedents; author SPEC.md decisions and acceptance rows; start scoped implementation sessions; test and close them; verify integration; capture lessons; review reusable lessons in the master kit; distribute an explicit kit update. The CLI governs portions of this lifecycle, but does not automatically conduct interviews, create mockups, dispatch workers or judge product quality.

A new model reads the project's AGENTS.md and docs/next.md, checks doctor/status, then resumes the next scoped task. Each project vendors plain files under .tins/kit/ and retains its own Git history. Never edit the vendored kit to make its gate pass; fix or upgrade the master distribution explicitly.

Knowledge progresses from local candidate to central review and later distribution. The implemented lifecycle calls the first promoted level tested and uses two consumer roots for active. These labels are weaker evidence than their names suggest: editorial review is not execution, and two repositories can contain the same copied pattern. The next iteration explicitly separates review from verification. Harvested inbox entries remain excluded from recall until promoted.

The pilot kit previously passed 33 CLI regression tests. Those tests do not establish unattended factory reliability. Its worktree and relay mechanisms enable collaboration but are not an autonomous scheduler. Remote approvals, sandbox/cloud orchestration and reconstruction remain future work. Commands below describe this branch, not main.

See [main's comparison and specification](https://github.com/ramsaipv4-lgtm/tins-kit-next) for the next iteration. The remainder preserves the operational guide for this implementation.

Zero dependencies: Node >= 18 and git. `kit` = `node .tins/kit/bin/kit.mjs` inside a project,
or `node D:\tins-kit\tins-kit-next\bin\kit.mjs` for the canonical kit itself.

## Where things live

| What | Where | Authority |
|---|---|---|
| Canonical kit source (code, reviewed patterns, reviewed global knowledge) | `D:\tins-kit\tins-kit-next` (its own git repo; push it to a private remote) | The only place knowledge becomes global |
| A project's vendored copy | `<project>/.tins/kit/` (committed, hash-stamped, never edited by hand) | Read-only in the project |
| A project's own lessons | `<project>/knowledge/candidates/*.md` | Local evidence, never global by itself |
| Current project truth | `<project>/SPEC.md` (D-n / AC-n rows) | Governs that project |
| Evidence of each session | `<project>/sessions/*.start.md` (pre-work recall) and `*.md` (close record) | Derived from git |
| Derived search index | `.git/tins-knowledge/` | Disposable; recall never depends on it |
| Imported bundles awaiting review | `tins-kit-next/inbox/` | Untrusted until promoted |

Obsidian: open a project repository (or this kit) as a vault to read and link the Markdown.
Never copy the files into a second vault — that copy would drift.

## Start a new project

```
node D:\tins-kit\tins-kit-next\bin\kit.mjs new D:\work\my-app --type web   # cli | library | web | content
cd D:\work\my-app
node .tins/kit/bin/kit.mjs doctor
```

The project is knowledge-enforced from its first commit (`tins.json` → `knowledge.required`).
Paste the handover prompt (below) into whichever model will do the work.

## Bring an existing project (excalidraw, Jayshankar, …) onto this kit

```
node .tins/kit/bin/kit.mjs upgrade --from D:\tins-kit\tins-kit-next          # dry run: lists behaviour changes
node .tins/kit/bin/kit.mjs upgrade --from D:\tins-kit\tins-kit-next --apply  # vendors it inside a recorded session
node .tins/kit/bin/kit.mjs knowledge enable                                  # cutover: history before stays valid
```

Jayshankar uses the older document-kit generation and has no `.tins/kit`; adopt it by scaffolding
`tins.json` + `.tins/kit` with a human-reviewed session (not automated here).

## The loop every session follows

```
kit start --task <id>      # clean tree required; COMMITS a recall of patterns, global lessons,
                           # local lessons and current SPEC rows, with sources and hashes
  ... SPEC row first, then code and tests ...
kit learn <id> --title .. --solves .. --triggers .. --not-when .. --evidence SPEC.md#D-7 --body ..
kit gate                   # SPEC lint + the project's own checks; no skip flag
kit close --note "reused pattern:x; rejected knowledge:y because ..."
kit check --base main      # at merge: replays every recall from git, checks order, scope, secrets, gate
```

## How learning reaches the next project

```
project A:  kit learn ...                       -> knowledge/candidates/<id>.md   (recallable in A at once)
project A:  kit knowledge export --out D:\bundles\a   (secret-scanned, hash manifest, repo root commit)
kit repo:   kit knowledge import D:\bundles\a          -> inbox/<project>-<head>/
kit repo:   kit knowledge promote <inbox> <id> --reviewed-by <you> --license MIT [--activate]
            # tested after one consumer; active needs two independent consumer root commits
kit repo:   kit version --write ; node --test test/ ; kit lint-kit ; git commit
project B:  kit upgrade --from <kit> --apply             -> recall now returns knowledge:<id>
```

A consumer project can never promote its own lesson. Promotion is a human act in the kit repository.

## What happens if a model does not search first

| The model … | What stops it |
|---|---|
| edits files without `kit start` | `kit gate` refuses uncommitted work with no session; `kit close` refuses (no retroactive start) |
| commits work outside any session | `kit check` / `kit merge`: commit has no Session trailer → merge refused |
| commits work, then starts | start record is committed after the work → the work is not in the session → refused |
| edits or forges the recall record | `kit check` replays the recall at the record's base commit; any changed result, hash or evidence text fails |
| disables enforcement in tins.json | protected path (scope violation); and `kit check` flags any range that turns it off |
| a chat-only model via relay | `kit packet` commits the recall and embeds it; `kit apply` refuses a reply without that packet's session |

What this does **not** prove: that the model read, understood or correctly applied the evidence.
That is what the close note (reused / adapted / rejected, with reasons), review, and the tests are for.

## Harvest lessons from existing projects

```powershell
# From D:\tins-kit\tins-kit-next; dry run writes nothing
node bin/kit.mjs harvest D:\tins-kit\Jayshankar
node bin/kit.mjs harvest D:\tins-kit\Jayshankar --write
```

The write command creates a local `inbox/harvest-…/REVIEW.md` queue with full provenance. It does not edit the source project or make candidates recallable. A human must promote each lesson; only then is it distributed to later projects.

See `docs/HARVESTING.md` for the workflow and `docs/HARVEST-INVENTORY.md` for the initial 359-candidate workspace inventory covering 11 TINS sources.

## Verify the kit

```
node bin/kit.mjs version --write
node --test test/
node bin/kit.mjs lint-kit
```

The tests drive the real CLI against temporary git repositories: deterministic cited recall, honest
zero-hit results, every bypass in the table above, the cross-project learning loop (A + B → kit → new C),
parallel worktrees with merge re-verification, relay mode, and all four scaffold types.

## Handover prompt for any model (paste as the first message)

> You are taking over work on the repository at `<path>`. It is governed by tins-kit.
> 1. Read `AGENTS.md` in full, then `docs/next.md`. They are your only instructions besides mine.
> 2. Run `node .tins/kit/bin/kit.mjs doctor` and `node .tins/kit/bin/kit.mjs status`. If a session is
>    open from someone else, tell me; do not close or abort it.
> 3. Take the first NEXT item in `docs/next.md`. Start it with `kit start --task <id>` (or
>    `kit task new <id> --paths ...` first if it has no task), then show me the recalled evidence and
>    say which items you will reuse, adapt or reject, and why. For a new feature, show me the SPEC rows
>    you will add and wait for my yes.
> 4. Work SPEC-first; finish with `kit gate` passing and `kit close --note`; update `docs/next.md`.
> 5. If you cannot run shell commands, say so and ask me for `kit packet <task>` output instead.
> Do not claim anything you did not see a command print.

Check it took: the first commit it makes must be `tins: start session …`, and `kit check --base main`
must pass before you merge its work.

## Honest limits (read before relying on it)

- Enforcement is tamper-*evident*, not tamper-*proof*: a model with shell access as your user can
  rewrite anything locally. The guarantee holds when `kit check` / `kit merge` (or CI running a pinned
  copy of this kit) is the only path to `main`.
- Retrieval is lexical (BM25 + whole-word triggers + status), deterministic and replayable. It will miss
  paraphrases with no shared words. Measure with `kit knowledge eval <golden.json>`; add a vector
  backend (e.g. LEANN) only behind the same receipt format, and only if the eval shows it helps.
- Changing the ranker invalidates replay of old receipts: bump `ALGORITHM` in `src/knowledge.mjs`
  and keep the old ranker reachable.
- Not built yet: remote approvals from a phone, cloud workers, video capture, mobile build profiles,
  clean-room reconstruction checks. They build on this layer, not instead of it.
