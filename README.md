# Next TINS iteration — specification workspace

Start with [SPEC.md](SPEC.md), then [the 369-candidate review bundle](review-inputs/INDEX.md).

This folder is a specification and review-input package, not an implemented kit. The folder name v3 is a working label, not a release number. Agent Control is an optional fresh-build specification only; no product code is included.

This is the `main` branch of https://github.com/ramsaipv4-lgtm/tins-kit . It is a specification baseline, not a runnable kit release. Historical planning documents under docs retain their original source paths as context.

## Previous iterations

### Version naming clarified by the supplied archives

The owner's two predecessor packages are `tins-kit-old-vs-new.zip` and `TINS-PLAYBOOK-PACK.zip`. They are not simply two internally numbered releases. The comparison package labels its `old/tins-kit` snapshot **v1**, its `new/tins-kit` snapshot **v3**, and identifies **v2** as an intermediate Git revision (`9c308e5`, `tins-kit/` in the original Takeu-Forward repository), used for the initial LMS build but not included as a full tree. These historical v1/v2/v3 labels are unrelated to this workspace's working folder name `tins-kit-v3`.

The Playbook Pack documents the later compact CLI workflow: Windows environment checks, dispatch wrappers, task scopes, independent claim verification, and Beach Buggy worked examples. It is not evidence that every bundled pattern was tested. The existing archive branches preserve workspace snapshots; they are not claimed byte-identical to the ZIP snapshots.

Read the supplied [version provenance](docs/version-evidence/START-HERE.md), [old/new comparison](docs/version-evidence/COMPARISON.md), [LMS field evidence](docs/version-evidence/FIELD-EVIDENCE.md), and [Playbook overview](docs/version-evidence/PLAYBOOK-README.md). These are historical reference documents, not instructions for the current builder; their relative links may refer to files only in the original ZIPs. Historical pass counts are reported by those documents, not freshly rerun here.

### Example projects and evidence

| Kit lineage | Project/example | What the evidence establishes |
|---|---|---|
| Earlier document-based kits | [Jayshankar](https://github.com/ramsaipv4-lgtm/Jayshankar-tins-old) | Owner-identified completed consumer of the earlier kit; repository existence verified. Exact ZIP v1/v2/v3 identity has not been established. |
| Intermediate document-kit v2 | [Coach LMS](https://github.com/ramsaipv4-lgtm/tins-lms) | The comparison pack explicitly attributes initial LMS Phase 1 to v2. The current repository evolved afterwards; this is not a claim that its current tree still uses v2. |
| LMS verification companion | [LMS acceptance tests](https://github.com/ramsaipv4-lgtm/tins-lms-tests) | Linked by the LMS README; test companion, not another independently built product. |
| Later document-kit orchestration | [Autonomous todo example](https://github.com/ramsaipv4-lgtm/tins-kit/tree/archive/document-kit-fork/examples/autonomous-todo-app) | Embedded worked example with run records, not proof of unattended reliability across projects. |
| Compact CLI / Playbook | [Beach Buggy worked-example overview](docs/version-evidence/PLAYBOOK-README.md) | The supplied pack says it came from the Beach Buggy learning-game build. Repository URL (https://github.com/ramsaipv4-lgtm/Beach-Buggy-example.git) |
| Compact CLI | [Excalidraw kit snapshot](https://github.com/ramsaipv4-lgtm/tins-kit/tree/archive/compact-cli-kit) | Owner-identified classroom project; link is to its archived kit only, not to the product. Product URL (https://github.com/Sairampv98/excalidraw-teacher-help.git) |
| tins-kit-next pilot | [Agent Control pilot evidence summary](docs/POST-PILOT-DESIGN.md) | Built with the pilot kit; local evidence/test review recorded. No Git remote is configured in the current local Agent Control repository. Product rejected for reuse; only extracted lessons inform the new iteration. |
| Current main specification | No completed consumer yet | This branch is a future implementation baseline. |

Public project links were checked through GitHub metadata; accessibility does not establish product completeness. Missing repository URLs are left explicit rather than guessed. The 369-candidate review bundle is unchanged by this historical documentation addition.

TINS means "There Is No Source": the intended source of product behaviour is a readable specification, with code produced and maintained to match it. In these iterations an LLM performs that work; none is a deterministic compiler or a guarantee that deleting code will reproduce the same application. Git carries decisions and continuity between agents.

| Branch | Intended operating model | Where to begin |
|---|---|---|
| [Document kit](https://github.com/ramsaipv4-lgtm/tins-kit/tree/archive/document-kit-fork) | Interview, author/review spec, implement, log decisions, extract reusable patterns, sync reviewed kit updates | Branch README, CORE.md, PIPELINE.md |
| [Compact CLI](https://github.com/ramsaipv4-lgtm/tins-kit/tree/archive/compact-cli-kit) | Compact instructions plus task scopes, worktrees, Git-derived sessions and blocking gates | Branch README and ENTRY.md |
| [Pilot kit](https://github.com/ramsaipv4-lgtm/tins-kit/tree/archive/tins-kit-next-pilot) | Compact workflow plus committed pre-work recall and project-to-kit learning lifecycle | Branch README |
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
