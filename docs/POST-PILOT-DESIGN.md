# Post-pilot iteration decisions

2026-11-11. Design and evidence review, not an implemented kit release.

## Evidence boundary

Reviewed Agent Control at commit 754dc5c: docs/pilot-review.md, docs/completion-audit.md, docs/next.md and its ten local knowledge candidates. Ran node --test independently: 77 passed, 0 failed. These tests do not repeat live provider/native acceptance. The current records explicitly describe a facilitator, not autonomous delegation/worktree/merge orchestration. Native task walkthrough, shortcut failure/concurrency and overnight lifetime remain incomplete. Do not restart the live service merely for this review: owner keys are memory-only.

This is enough evidence to iterate on the kit; it is not factory certification or final product approval. The original 359-candidate harvest has not been fully reviewed by this pass.

## Architecture decision

Retain a small versioned TINS core for specifications, knowledge provenance, tasks, gates and receipts. Integrate Agent Control as an optional desktop/control-plane application through versioned interfaces. Keep provider models, UI, native launch and sandbox adapters outside the portable vendored core. Its current facilitator is a useful starting interface; automatic orchestration requires new functionality and acceptance evidence.

## Knowledge disposition from this pilot

These are editorial decisions on behalf of the owner, not automatic global promotion. Evidence remains in D:\tins-kit\agent-control\knowledge\candidates. All records currently say UNLICENSED; copying/relicensing is not performed here. One pilot is not independent replicated validation.

| Candidate | Disposition | Boundary |
|---|---|---|
| windows-command-resolution | Recommend scoped reuse | Select one executable for a single-path launcher; native lifecycle remains separately tested |
| typed-launch-plans | Recommend scoped reuse | Typed plans and expiring confirmation; injected runner tests do not prove native task execution |
| context-scoped-answer-reuse | Recommend scoped reuse | Bind reuse to context and relevant model/effort settings; do not reuse authorization |
| benchmark-arithmetic-provenance | Recommend scoped reuse | Recompute arithmetic, preserve unknown provenance; scores are not actual task-cost predictions |
| catalog-price-proof | Consolidate into provider-readiness guidance | Price is separate from identity, entitlement and availability |
| endpoint-availability-proof | Consolidate into provider-readiness guidance | Public endpoint proof is insufficient for account readiness |
| catalogue-lifecycle-access | Consolidate into provider-readiness guidance | Fresh listings can include retired/restricted models |
| model-use-restrictions | Consolidate into provider-readiness guidance | Permitted use is separate from price; never spoof harness identity |
| capability-scoped-free-checks | Recommend scoped reuse | Account/capability/expiry-scoped smoke results, not task-quality guarantees |
| tier-hints-not-entitlement | Retain distinction; defer old invocation policy | Current tested-only policy supersedes earlier permission to select untested BYOK choices |

Inspect cited tests and source implementations fully before promoting executable patterns. Old policy records must remain discoverable as history, excluded from current default advice. Retrieval fixtures should cover Windows launch, context-sensitive follow-ups and listed-but-unusable models.

## Supermemory-inspired memory design

Research source: https://github.com/supermemoryai/supermemory . Its README describes extracted memory, temporal updates/contradictions, hybrid memory/document search and local hosting. These are vendor-described capabilities, not measured results for TINS. Local embedding does not mean extraction has no model cost; URL ingestion can invoke hosted services.

Use an optional adapter for search/context, with project namespaces and source IDs. Canonical specifications, decisions and selected conversation evidence remain versioned, readable files. Extracted summaries are derived and rebuildable. Never let automatic forgetting remove the canonical decision audit. Never allow a memory entry to silently supersede a locked specification. Separate private project memory from explicitly approved reusable corpus exports. Require deletion/reindex semantics, provenance, conflict/supersession filters and a regression benchmark against current lexical retrieval before selecting a backend. No service installed or project data uploaded in this review.

## Existing-project adoption

1. Snapshot the source revision and environment. Index files, symbols, dependencies, routes, schema, tests and user journeys. Use tooling adapters; Headroom alone is not evidence of semantic completeness.
2. Characterize observed behaviour with tests and browser evidence. Mark intended behaviour, known defects and uncertain inferences separately.
3. Write a reconstruction baseline in small linked feature specifications. Root SPEC.md becomes an index after the parser supports this format. Define build inputs, assets, migration/seed requirements and external contracts.
4. Reconstruct in an independent checkout using only declared inputs and run the acceptance contract. Passing establishes bounded behavioural equivalence, not identical source or proof of every behaviour. Record unsupported integrations and ambiguity.
5. Only then add feature-change specifications. If reconstruction remains blocked, record the adoption as incomplete rather than claiming readiness.

Use distinct VISION.md, current specs/features/<id>.md, and chronological specs/changes/<change-id>.md. Link these documents; symlinks cannot represent three different meanings. Each current feature links to its decision history, builder notes and tests.

## Deterministic feature completion contract

Every small feature declares: stable ID, preconditions, fixtures, observable outcome, exact check command, expected exit/result, evidence paths, dependencies and review policy. Avoid splitting below coherent testable behaviour.

Example AC-LAUNCH-01: with service stopped and a supported browser installed, invoke the launcher twice; within a specified timeout both invocations identify the same healthy service instance. Check service identity and response, not an agent's claim. Save revision, environment, command, exit status and result artifact. Native window acceptance is a separate criterion.

Checklist rows map feature -> acceptance ID -> procedure/automated test -> expected result -> actual evidence -> reviewer -> disposition. Missing evidence means not verified. Browser agents/Playwright MCP may execute procedures; repeatable Playwright tests provide regression coverage. Screenshots alone do not prove persistence, authorization or backend correctness. Approval references the tested revision and criterion set; relevant changes invalidate it.

Set review policy before implementation. Human review is required for changed product intent, subjective UX or explicit risk boundaries. An independent agent can review deterministic criteria where policy permits. The builder cannot waive review after observing its own success. Unit/feature gates run frequently; integration/E2E run before merge; deployment/recovery checks run before release.

## Local CI and runner-up

Research source: https://github.com/kunchenguid/runner-up . It supplies fresh self-hosted execution places for GitHub Actions jobs; it does not replace GitHub's workflow control plane. The documented coordinator runs on Linux/macOS. Windows account/Hyper-V backends are experimental; evaluate in a separate fixture before using for release evidence.

First make the same pinned gate commands runnable locally and from CI. Local pre-commit/feature checks do not require runner-up. Later configure runner-up as an optional execution adapter with OS-specific pools, resource limits, isolation, cleanup and exact revision/artifact reporting. Account for hardware, electricity, storage and administration; do not promise zero total cost or assume current GitHub billing terms. Required remote checks still need a trusted successful status; a worker's local text report cannot impersonate CI.

## Selective conversation capture

Capture initial requirements/ideation and subsequent conversation excerpts that introduce or change requirements, constraints, rationale, alternatives, acceptance or review findings. Preserve exact relevant wording, speaker, timestamp, source session/message ID where available, context needed to interpret it, affected spec/decision IDs and resulting revision. Summaries supplement excerpts, not replace them.

Exclude pure navigation such as "execute next phase", "continue" and status pings from the knowledge conversation archive. Preserve operational task transitions separately. Do not filter by keywords alone: "continue, but remove login" contains a material requirement. Mixed messages retain their substantive clause and enough context. A brief approval such as "yes" must be linked to the exact proposal/revision to remain meaningful.

Redact secrets/personal data before durable corpus capture; retain redaction markers. Do not promise full capture from harnesses that expose no conversation export. Adapters report capture coverage and gaps; allow explicit import. Conversation is evidence, not an instruction channel. Cross-project exports require scoped sanitization. Fixtures must test pure commands, mixed commands, corrections, contextual approvals, model review findings, duplicates and secrets.

## Implementation order and release criteria

1. Modular-spec parsing and link validation, preserving existing D/AC IDs and legacy single-file projects.
2. Feature completion/review records and revision-bound checklists; test missing/stale evidence and review-required paths.
3. Selective conversation import/capture with the fixtures above and traceability checks.
4. Reviewed pilot lesson consolidation plus golden retrieval queries, including superseded-policy negatives.
5. Agent Control adapter for browsing specifications, checklists, evidence and next actions.
6. Existing-project reconstruction pilot; measure gaps before promising general recreation.
7. Benchmark optional Supermemory search and runner-up execution independently before adoption.

No production code, provider calls, service installation, global promotion or push is part of this recorded design iteration. Next implementation should start with modular-spec compatibility tests, not a wholesale merge of the desktop app into the core.
