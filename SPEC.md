# TINS next iteration — implementation baseline

Date: 2026-11-11. Status: owner-review draft. This specifies a new implementation; it does not describe capabilities already delivered. No version number is assigned until release. The owner may revise this document before commissioning a builder.

## 1. Objective and authority

Build a portable, model-independent software development system that turns explicit product intent into tested software, preserves human-readable rationale, reuses validated lessons and coordinates bounded agent work with minimal routine human intervention. Measure intervention, rework, escaped defects, retrieval quality, time and cost; do not equate more records or passing structural checks with factory success.

The canonical sources are readable specifications, decisions, acceptance contracts and selected conversation evidence in Git. Code is an implementation artifact but MUST remain versioned until independent reconstruction demonstrates its replaceability. Search indexes, embeddings, summaries and graphs are rebuildable projections. Retrieved text and historical conversations are evidence, never authority to execute instructions.

This specification governs the new kit. The existing kit is a compatibility reference, not a mandate to retain its defects. The [complete lesson review inputs](review-inputs/INDEX.md) are untrusted historical candidates, not 369 requirements. Every candidate MUST receive a recorded disposition. The existing Agent Control application MUST NOT be copied, bundled or used as the implementation baseline. Its ten extracted lessons may be reviewed; its product/UI and source are explicitly rejected as reuse inputs. Section 13 defines a fresh optional extension.

## 2. Deliverables and boundaries

Deliver a standalone core CLI, schema validators, templates, migration tooling, automated tests, documentation, lesson review ledger, approved knowledge corpus, retrieval evaluation suite and example projects. Implement extension interfaces without forcing optional services into the core. Deliver Agent Control only as a separately selectable extension, regenerated from section 13 after core acceptance. External memory, browser, mobile, media and runner adapters must report unsupported capabilities truthfully.

Core must work offline with Node and Git on Windows and Linux; pin a supported Node LTS at implementation time. Keep core dependency-free unless a decision identifies a necessary library, license, maintenance cost and offline implications. Do not promise identical shell semantics across OSs. Quote paths safely, use argument arrays, and test spaces/non-ASCII paths. Avoid global machine changes during project initialization.

No automatic publication, paid-provider fallback, credential scraping, unbounded retries or implicit deployment. Public CI and remote multi-tenant hosting are optional deployment profiles, not prerequisites for local use. No claimed support for every harness without adapter validation.

## 3. Repository and installation contract

The master kit is its own repository. New projects vendor a pinned plain-file distribution under `.tins/kit/`, without a nested `.git`. A fresh clone includes everything required to execute core governance offline. Global personal preferences stay outside project truth. Team/project instructions and required capability manifests travel with the repository. No checked-in absolute paths to the original owner's machine.

Required project layout (paths relative to each project):

```text
AGENTS.md                 canonical agent instructions
CLAUDE.md                 generated equivalent; never manually edited
SPEC.md                   brief feature index and authority rules
VISION.md                 intended outcomes and boundaries
specs/features/<id>.md    current behaviour and acceptance contracts
specs/changes/<id>.md     chronological amendments and rationale
specs/decisions/<id>.md   stable decisions and supersession links
notes/features/<id>.md    builder discoveries, rejected approaches, evidence links
conversations/            sanitized material discussion excerpts
tasks/                    scoped work and dependencies
sessions/                 pre-work receipts, results and handovers
knowledge/                local candidates and reviewed precedents
evidence/                 small manifests; large artifacts stored externally
docs/next.md              concise current state and next action
PROJECT-BOOK.md           human learning/reconstruction guide
tins.json                 versioned configuration and capability references
```

`CLAUDE.md` MUST be reproducibly generated from `AGENTS.md`; lint rejects drift. Symlinks may be optional but cannot be required on Windows. Vision, current behaviour and historical changes are different documents, never aliases of the same file. Every feature has stable IDs and bidirectional links to its decisions, tests and notes. Index links must resolve. Prefer coherent small features over arbitrary line-count fragmentation; recommend a configurable 300-line soft warning, with referenced schemas/data split out rather than lost.

## 4. Public CLI contract

Implement these command families with documented flags, JSON output, stable schema version and exit codes: 0 success, 1 verification failure, 2 invalid input/configuration, 3 capability unavailable, 4 approval required. Report partial results without claiming success. Help must distinguish implemented adapters from planned ones.

| Family | Required behaviour |
|---|---|
| `new`, `init`, `upgrade` | Scaffold empty project; adopt existing Git repo non-destructively; preview/apply pinned upgrade |
| `doctor`, `version`, `lint-kit` | Check distribution integrity, environment, schemas and capability readiness |
| `spec lint`, `spec reconcile` | Validate modular and legacy specs; detect unresolved links, IDs and implementation amendments |
| `recall`, `knowledge eval` | Cited status-aware retrieval and reproducible evaluation |
| `learn`, `harvest`, `knowledge review/export/import` | Capture, review and distribute sanitized knowledge with provenance |
| `start`, `close`, `abort`, `status`, `handover` | Durable pre-work session receipts and truthful terminal states |
| `task`, `check`, `merge` | Dependency-aware scoped worktrees and independently verified integration |
| `gate`, `review` | Layered checks and revision-bound acceptance/approval records |
| `index`, `adopt`, `reconstruct` | Repository navigation and existing-project reconstruction workflow |
| `conversation import/capture` | Select material discussion with provenance and redaction |
| `capabilities`, `skills` | Discover/validate configured skill, script, MCP and agent capabilities |

`init` MUST preview collisions and preserve existing history and user files. Upgrade must support rollback and legacy cutover without falsely condemning old commits. Preserve existing D-n/AC-n IDs and single SPEC.md projects. Never rewrite previous receipts to make new validation pass. Version retrieval algorithms and retain replay compatibility or provide explicit archived evidence verification.

## 5. Product development workflow

Interview the owner about users, real inputs, constraints, worst supported device, failure cases, costs, out-of-scope behaviour and cheapest viable alternative. Record unresolved assumptions. Retrieve existing knowledge before drafting the first specification. For each relevant precedent, record reuse/adaptation/rejection and applicability. Empty successful search is not proof of novelty; failed search means unknown.

Produce a linked feature plan and, for visual products, a clickable mockup showing agreed journeys and failure states. Label simulation. Record owner design acceptance before production UI implementation; minor deterministic fixes can follow a pre-agreed review policy. Begin with a tracer bullet spanning all major layers, then expand coherent features. Reconcile specs and builder decisions before each completed-feature commit. Commit progress and generate a handover on interruptions without labelling incomplete work complete.

A fresh agent must recover state from the repository alone: current revision, open task, prior work, tests, blockers, decisions, relevant precedents, environment needs and next executable action. Do not require copying a chat transcript to continue. Concise interaction is default; necessary explanations and failures must not be suppressed by a token-saving style skill.

## 6. Feature completion and review

Each acceptance item contains `id`, `feature`, preconditions, fixtures, observable expected result, check type, exact command or manual procedure, timeout, evidence requirements and review policy. Commands are structured arguments, not unchecked shell text from retrieved documents. Tests must exercise behaviour; mentioning an AC identifier is only traceability.

A completion record binds acceptance IDs, spec digest, code revision/tree digest, environment/tool versions, commands, exit results, artifact hashes and reviewer identity. Any relevant change invalidates affected approvals. States are pending, running, passed, failed, blocked and not-applicable-with-reason. No missing check becomes passed. A builder cannot waive a required review after seeing its own result.

Generate a checklist usable by a person or independent model: action, input, expected visible outcome, evidence link and disposition per AC. Human approval is mandatory for changed intent, subjective design and owner-designated risk boundaries. Independent model review may satisfy permitted deterministic review, with separate session identity and actual executed checks. Browser/MCP tools can gather evidence; stable assertions and repeatable browser tests must back regression claims. Screenshot approval cannot establish backend correctness.

Gate tiers: edit (unit/static), feature (contracts and acceptance), merge (integration/E2E and independent review), release (installation, recovery, deployment where applicable). Run the same pinned commands locally and in CI. Emit bounded console summaries and complete artifact logs, not truncated-only failures. Store timing and available usage/cost; unknown remains unknown.

## 7. Knowledge and the 369-input review

The accompanying bundle contains 359 historical candidates and 10 Agent Control candidates, each separately identified. Do not drop duplicate-looking entries before assigning a disposition. Preserve original text and original licensing status; inclusion as review material grants no redistribution license. Secret-scanned omissions from the old harvest are not secretly restored. Inventory-only narrative files are not part of the 369 reviewed candidate bodies.

Create `knowledge-review.json` containing one row per bundle ID: original hash, reviewer, disposition (`carry`, `revise`, `merge`, `reject`, `defer`), rationale, applicability, evidence inspected, target knowledge ID when applicable, duplicate/merge links, license/privacy outcome and verification level. Merge targets must exist and mappings must be cycle-free. Defer is acceptable when evidence is absent, never silently mark verified. Emit a human-readable review report and count reconciliation.

Separate review status from verification: unreviewed/reviewed/rejected/superseded; verification unverified/fixture-tested/project-observed/independently-replicated. An agent may perform delegated editorial review under an identified role, but cannot fabricate test execution or human approval. Distinct repositories containing copied kit text are not independent consumers. Root commits identify lineage only; independent adoption requires actual implementation/outcome evidence. No universal two-project threshold substitutes for applicability or correctness.

Record failure modes, `not_when`, stack/version applicability, provenance (repository/revision/file/anchor/hash), evidence, supersession, conflicts and derived-from links. Money examples must reconcile integer settled amounts versus exact decimal intermediates with scale/rounding rules. Shared dependency-cache advice must account for concurrent builds. Earlier BYOK availability policy must not override later tested-only policy without explicit rationale.

Maintain project-private memory separately from approved global exports. No global promotion from raw agent answers, copied patterns or document counts. Export allowlists, redaction and license review precede distribution. Projects receive a pinned approved corpus with new/upgrade; unknown external services must not be required for recall.

## 8. Retrieval, graph and optional memory

Implement exact ID/keyword lookup and lexical ranking as an offline baseline. Return evidence packets with IDs, citations, source digests, status, applicability, conflicts and superseding records. Filter obsolete guidance by default while permitting explicit historical search. A session commits a pre-work receipt with query, corpus/version, results and dispositions. Merge verification detects missing/tampered receipts; it cannot prove comprehension. Enforcement must use a trusted verifier outside worker-controlled changes for protected branches.

Repository index includes files, symbols where parsers support them, imports, features, requirements and tests. Exclude secrets, generated caches and vendored duplicates. Identify index revision and supported languages; unsupported parsing is reported. Incremental rebuild must equal clean rebuild. Tree/graph navigation supplies references to exact source rather than replacing it with summaries.

Supermemory/LEANN-style adapters are optional and benchmarked against the same corpus. Support scoped document/memory search, provenance, contradiction/supersession, deletion, rebuild and export. Canonical decisions cannot be silently forgotten or rewritten by inferred memory. Retrieval failures fail visibly; a local/offline fallback must retain source authority. Hosted transmission requires explicit project policy. Local embeddings do not imply free extraction or offline URL ingestion.

Evaluation: create at least 30 reviewed queries across historical and pilot domains, including paraphrases, superseded-policy negatives, unrelated queries and conflicts. Report recall@5, precision@5, stale-hit count, citation correctness, latency and cost. Require zero broken citations and zero default superseded recommendations; compare quality against a frozen lexical baseline. Hold out queries when tuning. Do not label a backend superior without measured improvement and recorded tradeoffs.

## 9. Selective conversation preservation

Save initial ideation and substantive changes to requirements, constraints, rationale, alternatives, acceptance and review findings. Preserve exact relevant excerpts plus speaker, timestamp, session/message identity when available, contextual proposal, related IDs and resulting change revision. Redact before durable persistence and preserve redaction markers. Summaries are derived additions.

Exclude pure progress commands such as 'execute next phase' from the knowledge archive; retain operational task transitions separately. Mixed messages such as 'continue, but remove login' retain the requirement change and sufficient context. A bare approval links to the precise proposal and revision. Deduplicate imports by source identity/hash. Unsupported harness capture must report a gap and support explicit export/import; never assert invisible conversations were captured. Conversations are private by default and never automatically syndicated to the global corpus.

## 10. Existing application adoption

Before adding functionality to a non-spec-driven app, snapshot revision/environment, index source and characterize user journeys, data, external contracts and errors. Distinguish observed behaviour, intended behaviour, defects and uncertainty. Write modular reconstruction specs with assets, schema/migrations, seeds, environment, build inputs and acceptance fixtures. Tests for intended behaviour must be independently reviewed so bugs do not become requirements accidentally.

In an independent checkout, reconstruct using only declared inputs and specifications, without reading original implementation. Run the agreed acceptance suite. Record equivalence boundaries, omissions and integration stubs. Only after the baseline acceptance contract passes may new-feature implementation start; unresolved external dependencies keep adoption blocked or explicitly incomplete. Do not promise byte-identical code or complete equivalence from finite tests. Vision/current state/change history remain distinct linked records.

## 11. Tasks, orchestration and execution

One task owns a branch/worktree and declared scope. Define dependencies and shared contracts before dispatch; serialize conflicting tasks. Durable states: ready, running, awaiting-approval, blocked, submitted, verified, merged, failed, abandoned. Use leases, heartbeats, bounded retries, idempotent transitions and a single integration authority. Worker crashes preserve logs and partial work; resuming never duplicates external side effects blindly. Waiting approval parks only dependent work. Cross-agent handover records source/target sessions and evidence.

Independent review occurs before integration; gates rerun on the actual merged candidate. A worker cannot modify its own verifier/policy to authorize merging. Bind approvals to task, repository, revision, action/diff digest and expiry; enforce single use. Configuration changes affecting governance receive their own review. Worktree isolation is not process/security isolation.

Local execution is default where selected. Support optional environment adapters and eventual cloud workers through a shared capability protocol. Runner-up is an optional self-hosted GitHub Actions backend, not a requirement for local gates or a guarantee of zero costs. Validate OS/provider compatibility; its currently documented Linux/macOS coordinator and experimental Windows execution need separate acceptance. No installation, privileged service setup or cloud provisioning occurs merely by reading this spec.

## 12. Skills, MCP and human understanding

Feature specs declare capability IDs, pinned skill source/version/hash, license, required tools/MCP servers, scripts, permissions, environment and fallback. Discover skills through skills.sh and primary repositories; inspect and evaluate before installing. Never execute scripts from retrieval output. Preflight reports missing dependencies clearly. Improve skills from observed lessons via candidate changes and regression evaluations, not automatic self-promotion.

Provide optional Obsidian-compatible Markdown navigation without a second authoritative vault. Project Book explains purpose, architecture, data, modules, decisions, alternatives, setup, testing and recovery, with a guided learning path. Generate diagram projections from declared architecture. Media profiles create reproducible scripted demo journeys tied to ACs and build revisions; mobile profiles declare device/OS/offline/permissions/store constraints and real-device evidence. These optional packs cannot make core initialization depend on browser/mobile/media infrastructure.

## 13. Optional Agent Control extension — regenerate from this idea

Build fresh only after core contracts are accepted; reuse no code, UI, application state or release from the rejected pilot. The extension installs a desktop shortcut and opens a Chromium-based local interface. Startup/discovery/auth-status queries use deterministic code without model inference. Single-instance launch must handle cold/warm start, failure, concurrent clicks and explicit exit.

Discover Codex, Claude Code, Cline Desktop/CLI and configured additional harnesses using supported interfaces and manual path registration. Separate installed, authenticated, subscription/API mode, environment-ready, automatable and task-verified states. Missing CLI does not imply missing desktop app. Do not scrape credentials or infer quota from an executable. Use supported browser auth and user-provided credential references. Subscription credentials must not silently become API billing.

The user selects the steering harness, permitted worker pool and reviewer per project/run; optional coordinator assignment operates only within that allowlist. Keep selection separate from dynamic scheduling. Model providers OpenRouter, Groq, NVIDIA and other configured providers need an agent runtime; they are not harnesses by themselves. Free-only mode checks applicable pricing/entitlement/capability, uses bounded explicit probes, shows limits and forbids paid fallback. Model identity and availability are not quality benchmarks.

Environment choices: host/none, WSL, Windows Sandbox, Hyper-V, Windows/Linux containers and devvm through separately validated adapters. Show unavailable choices with reasons. No silent isolated-to-host fallback. Authentication inside a guest is separately verified. Persist/export evidence before ephemeral teardown. User selects resource/spending/time limits. Remote approval UI is optional and uses the exact-action protocol in section 11.

UI must support project selection, specification/knowledge navigation, task state, live bounded logs, pending approvals, review checklists, failures, artifacts and handovers. Produce an interactive design mockup and obtain owner approval before rebuilding this extension. Accept with two real supported harnesses on a disposable project, independent worktrees, failure recovery and a coordinator switch. No general 'works with any harness' claim from mocks. The core remains usable when the extension is absent.

## 14. Acceptance matrix for the new kit

These are required test intentions, not existing test files or passing results. Builder assigns concrete test paths before each implementation slice.

| ID | Required demonstration |
|---|---|
| AC-K01 | New project initializes and gates offline on Windows/Linux; existing repo init preserves files/history and reports collisions |
| AC-K02 | Modular and legacy specs validate; duplicate IDs, missing links, orphan criteria and instruction-file drift fail |
| AC-K03 | Interview, precedent decisions and mockup approval link to initial feature specs; a changed requirement leaves a supersession trail |
| AC-K04 | Missing/stale/altered evidence cannot complete a feature; human-required approval cannot be replaced by builder self-approval |
| AC-K05 | All 369 manifest IDs receive one disposition; duplicate/merge mappings resolve; unverified/rejected inputs do not enter active advice |
| AC-K06 | Retrieval evaluation meets section 8 integrity thresholds; paraphrases, conflicts and stale guidance are explicitly evaluated |
| AC-K07 | Missing/forged pre-work receipt fails verification; algorithm upgrade retains old receipt verification |
| AC-K08 | Conversation fixtures distinguish pure commands, mixed requirements, contextual approval, review corrections, duplicates and secret redaction |
| AC-K09 | Incremental/clean index agree; unsupported language and stale revision are visible |
| AC-K10 | Two worktrees integrate safely; overlap, failed merged gate, crashed worker and approval expiry are handled without lost evidence |
| AC-K11 | Fresh model resumes from repository without previous chat and completes a tracer bullet |
| AC-K12 | Existing-project reconstruction passes declared behavioural suite before feature expansion; missing input blocks truthful completion |
| AC-K13 | Missing skill/MCP/script fails preflight; untrusted memory cannot grant execution permissions |
| AC-K14 | Same gate contract runs locally and on optional self-hosted CI, reporting exact revision and full logs |
| AC-K15 | Optional memory absent/offline does not break core; namespace leakage, deletion and superseded results have negative tests |
| AC-K16 | Regenerated Agent Control passes native startup, selected-harness task, review, recovery and handover checks; unsupported adapters stay unavailable |
| AC-K17 | Upgrade/rollback preserves project work and historical receipts; pinned distribution tampering is detected |
| AC-K18 | Project Book and optional demo/mobile packs identify prerequisites and measured evidence without claiming unrun checks |

## 15. Build phases and handoff instructions

P0: validate this specification and complete the 369-row review ledger; resolve contradictory advice without automatic licensing changes. P1: schemas, modular specs, initialization/migration and synchronized instructions. P2: acceptance/checklists, conversation capture and handover. P3: knowledge/index/retrieval and evaluations. P4: task/review/merge/recovery and local execution. P5: reconstruction pilot and human-readable Project Book. P6: optional memory/runner/skill/media/mobile adapters with separate capability tests. P7: regenerate Agent Control from approved mockup and validate two real harnesses.

For every phase: start governed work, implement a vertical slice, reconcile specs/notes, run relevant gates, commit and produce a revision-bound handover. Publish an honest matrix of implemented, tested, observed, unavailable and deferred capabilities. No placeholder scripts count as implementation. Only owner-approved scope changes may remove acceptance requirements.

The next model must read this file and the bundle index before planning. Do not ingest the 369 documents into an authoritative corpus wholesale. Use the supplied validator to verify inputs; then review in batches with an exhaustive ledger. Consult original source evidence where available; missing external evidence means defer or unverified, not invention. Keep implementation in a new iteration branch or separate repository and preserve the current baseline. Do not modify the rejected Agent Control product.
