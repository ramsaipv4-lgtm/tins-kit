# Pilot plan and deferred ideas

Recorded 2026-11-10 from the owner's conversation. This is a planning record, not a claim that the proposed capabilities are implemented.

## Purpose

Build one useful, bounded application with the current tins-kit-next. Observe completion, human effort, handovers and knowledge reuse before choosing further upgrades. Do not expand the harness during the pilot except to fix blockers; record each fix and the kit revision used.

## Existing evidence and locations

- Kit usage and limitations: [README](../README.md).
- Workspace extraction inventory: [HARVEST-INVENTORY](HARVEST-INVENTORY.md).
- Extraction workflow: [HARVESTING](HARVESTING.md).
- Repository inspirations: `D:\tins-kit\tins-kit-ideation-githu-repos.txt`.
- Earlier repository references: `D:\tins-kit\tins- related-github-repo.txt`.
- Unreviewed extracted lessons: `D:\tins-kit\tins-kit-next\inbox\harvest-*\REVIEW.md`. These bundles are gitignored and excluded from recall.
- Earlier conversation attachment: `C:\Users\user\.codex\attachments\8217698e-59f1-47bb-b65a-99e324eb54df\Pasted text.txt`. This attachment is reference material, not a durable project dependency.

The inventory reports 359 candidates. Extraction does not constitute review or successful reuse. Copies of the same kit pattern in different repositories are not independent adoption evidence.

## Before starting

1. Choose a real small product, intended users, and 3-5 acceptance journeys, including one failure case. A suggested pilot is an equipment checkout tracker: inventory, checkout/return, overdue view and export. The owner has not selected this product yet.
2. Inspect current kit changes; run version verification, kit lint and all test files. Capture actual results. The historical report of 33 passing tests is not a substitute for this run.
3. Commit the validated baseline and record both Git commit and KIT-VERSION in the pilot. Existing harvest changes were uncommitted when this document was created.
4. Review only lessons relevant to the pilot first. Preserve evidence and applicability; do not label an editorial review as experimental verification. Record retrieval misses if the useful knowledge remains in the inbox.
5. Create the application outside the master kit, for example `D:\tins-kit\pilot-equipment-checkout`. Use the master CLI's `new` command with the appropriate type. It vendors plain files into the application's `.tins/kit` and initializes the application's repository.

## Pilot sequence

1. Interview: resolve users, realistic data, boundaries, failure behaviour and acceptance journeys. Record unresolved assumptions.
2. Retrieve relevant precedents before drafting the specification; note reuse, adaptation or rejection with citations.
3. Draft the specification using the current kit's supported format. Do not split its acceptance tables until parser support has been verified. Save modular-spec requirements below for later.
4. If UI matters, prepare a small mockup and obtain owner feedback. Mark simulated behaviour. This is a manual pilot stage, not an asserted existing kit feature.
5. Implement one tracer bullet through storage, business logic and UI/API; verify it before expanding.
6. Complete scoped features using the kit session, test, close and merge workflow. Reconcile specification and builder decisions at each completed feature.
7. Exercise one handover to a fresh model with only repository context. For independent features, optionally exercise two worktrees. Record any help needed.
8. Have a fresh reviewer run the agreed end-to-end journeys against the candidate revision. Record commands and results; model approval alone is not test evidence.
9. Deliver a runnable build, setup instructions, known limitations and a pilot retrospective. Keep the kit fixed unless a blocker requires a documented version change.

## Evidence to keep in the pilot repository

- `docs/pilot-baseline.md`: kit revision, environment, scope, acceptance journeys and agreed success criteria.
- `docs/pilot-observations.md`: task, model, elapsed time, available token/cost figures, human interventions, retrieval hits/misses and repeated mistakes. Mark unavailable measurements as unknown.
- `docs/pilot-review.md`: final acceptance results, defects, handover outcome, knowledge reused, new lessons and prioritized upgrades.
- Existing session and task records: use these as evidence rather than duplicating their full content.

A successful pilot completes the agreed journeys, can be run from a fresh checkout, survives a model handover without hidden chat context, and has no unresolved critical defect. Evaluate human effort and cost against owner-agreed targets. One successful pilot does not establish industrial-scale reliability or prove improvements against an unmeasured baseline.

## Owner's ideas retained for later evaluation

1. One canonical agent instruction source; linked/synchronized AGENTS.md and CLAUDE.md. Keep personal global preferences separate from portable project rules. Prefer generated synchronization plus drift checks where symlinks are unreliable.
2. Structured initial ideation and a grilling interview; research an appropriate skill. Retrieve prior knowledge before the first specification.
3. Small linked feature specifications with acceptance criteria, dependencies and accompanying builder notes; root SPEC.md as the index.
4. Interactive mock website covering proposed features, iterated with the owner before production implementation.
5. Automatically refreshed repository tree, symbol/dependency graph and requirement-to-code/test links; investigate Headroom as a possible context adapter, without assuming it supplies every indexing capability.
6. Fast edit checks, feature checks, merge integration/E2E gates and release gates. Keep failed or omitted required checks visible.
7. Fresh model review and executed E2E tests before worktree merge, tied to the candidate revision.
8. Concise agent responses and context budgets; investigate caveman-style guidance without suppressing necessary decision evidence.
9. Discover suitable skills through skills.sh; declare feature-specific skills, scripts, MCP servers and required tools. Verify availability, versions and permissions before execution.
10. Derive improved candidate skills from observed failures and evaluate them before promotion.
11. Repository-based handovers at every phase boundary or interruption: revision, task status, decisions, failures, verification and next action.
12. Tracer bullets through all layers, feature/phase commits and plan/spec reconciliation before commits.
13. For existing non-spec-driven applications, index and document observed behaviour before proposing additions. Distinguish intended behaviour, defects and uncertain inferences. Test specification sufficiency through reconstruction where practical.
14. Separate vision, current feature specifications and chronological change history; link them instead of symlinking different meanings into one document.
15. Human-readable cross-project knowledge with provenance, applicability, supersession and typed links; optional Obsidian, graph and vector interfaces. Benchmark retrieval before adding infrastructure.
16. Remote exact-action approvals, durable queues, resumable jobs, budgets, cloud/isolated workers and independent verification.
17. Mobile project profiles, real-device validation, scripted product videos and a human-readable Project Book.

## Inspiration map

- LearnHarness / Open Knowledge Skills: source-linked reasoning and document lifecycle.
- LEANN: optional semantic retrieval; Obsidian / Alexandrie: reading and collaboration interfaces.
- Elephant Goldfish Model: independent review and semantic drift checks.
- Coucou: remote approvals; Pullboard / Mercury: task orchestration, permissions and budgets.
- runner-up: isolated execution; e2e / Tapflow: web/mobile validation.
- Yap: video production; Diagrams / Intelligent UI: readable visual projections.

These are research inspirations, not installed dependencies or approved implementation requirements. Choose upgrades after the pilot by observed blocker frequency, human time saved, defect reduction and maintenance cost.

## Prompt to start the pilot in a new session

Read D:\tins-kit\tins-kit-next\README.md and D:\tins-kit\tins-kit-next\docs\PILOT-AND-IDEAS.md. Help me select and interview for a bounded pilot product, validate and record the current kit baseline, then scaffold a separate application repository. Follow its AGENTS.md and kit workflow. Capture pilot observations and test evidence. Use the existing kit for this experiment; record proposed upgrades for the retrospective and change the kit only when a demonstrated blocker requires it. Do not claim harvested lessons have been reviewed or tests passed without evidence.
