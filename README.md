# Next TINS iteration — specification workspace

Start with [SPEC.md](SPEC.md), then [the 369-candidate review bundle](review-inputs/INDEX.md).

This folder is a specification and review-input package, not an implemented kit. The folder name v3 is a working label, not a release number. Agent Control is an optional fresh-build specification only; no product code is included.

This is the `main` branch of https://github.com/ramsaipv4-lgtm/tins-kit-next . It is a specification baseline, not a runnable kit release. Historical planning documents under docs retain their original source paths as context.

## Previous iterations

TINS means "There Is No Source": the intended source of product behaviour is a readable specification, with code produced and maintained to match it. In these iterations an LLM performs that work; none is a deterministic compiler or a guarantee that deleting code will reproduce the same application. Git carries decisions and continuity between agents.

| Branch | Intended operating model | Where to begin |
|---|---|---|
| [Document kit](https://github.com/ramsaipv4-lgtm/tins-kit-next/tree/archive/document-kit-fork) | Interview, author/review spec, implement, log decisions, extract reusable patterns, sync reviewed kit updates | Branch README, CORE.md, PIPELINE.md |
| [Compact CLI](https://github.com/ramsaipv4-lgtm/tins-kit-next/tree/archive/compact-cli-kit) | Compact instructions plus task scopes, worktrees, Git-derived sessions and blocking gates | Branch README and ENTRY.md |
| [Pilot kit](https://github.com/ramsaipv4-lgtm/tins-kit-next/tree/archive/tins-kit-next-pilot) | Compact workflow plus committed pre-work recall and project-to-kit learning lifecycle | Branch README |
| Current main | Specification for modular specs, evidence-bound completion, selective conversation memory, reconstruction and optional orchestration | SPEC.md and review-inputs/INDEX.md |

The evolution is from a documented development process, to more mechanical enforcement, to enforced retrieval, and now to a proposed evidence-driven factory. Earlier generations already contain scripts; "document kit" does not mean prose-only. A green gate verifies its programmed checks, not complete product correctness.

## How the current iteration is expected to work

1. Read and approve SPEC.md. Review all 369 candidates through the ledger; copied advice is not independently verified knowledge.
2. Implement the core in the phases defined by the spec, with compatibility tests for earlier projects.
3. For each consumer project: interview the owner, recall applicable precedents, author small linked feature specs, review a mockup where appropriate, and implement a tracer bullet.
4. Execute scoped tasks with measured acceptance checks, revision-bound review and repository-based handovers. Preserve material requirement conversations rather than routine continuation messages.
5. Verify and review lessons before distributing them in a pinned kit update. Optional search services and Agent Control must not become mandatory for offline core use.

These are build requirements, not commands available on main today. To run the existing pilot tooling, clone the pilot archive branch into a separate directory. To build the new iteration, use main. Do not apply an archive's command examples to main: the executable kit is intentionally absent here.

## What goes into a consumer project

The master kit and each application have separate Git repositories. The CLI generations vendor plain kit files under the application's `.tins/kit/`, with no inner `.git`; the older document generation commonly uses `tins-kit/`. Application specifications, decisions, tests and handovers belong to the application. Global approved knowledge belongs to the master kit and reaches applications through explicit updates. The kit is development machinery, not an application production-runtime dependency.

- `archive/document-kit-fork`: committed document-based kit and its history.
- `archive/compact-cli-kit`: standalone snapshot of Excalidraw's compact CLI kit; application code excluded.
- `archive/tins-kit-next-pilot`: tested pilot kit with its history, before this specification iteration.

The current main commit descends from the pilot baseline, so history is preserved without force-pushing. Archives exclude local uncommitted edits and ignored inboxes. The local prior implementation remains at `D:\tins-kit\tins-kit-next`; this new iteration is at `D:\tins-kit\tins-kit-v3`.

Verify this portable bundle:

```powershell
node D:\tins-kit\tins-kit-v3\review-inputs\verify.mjs
```

The one-time build-review-bundle utility requires the original workspace sources and refuses to overwrite this bundle. Normal reading, review and verification need no original inbox. Original code/test citations in candidate text may require source repositories; missing evidence must remain unverified.
