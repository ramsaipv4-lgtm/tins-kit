# TINS compact CLI kit — historical workflow

This branch is a standalone snapshot of the kit embedded in Excalidraw, not the application. It replaces much of the earlier document navigation with a short agent protocol and CLI-enforced sessions, task scopes and gates.

## Intended project setup

A consumer commits plain kit files under .tins/kit/, plus root AGENTS.md, SPEC.md and tins.json. There is no nested kit Git repository or application runtime dependency. Read [ENTRY.md](ENTRY.md), the source of the agent protocol, and [RELAY.md](RELAY.md) for chat-only operation.

The CLI exposes a new/scaffold command, but this archived vendored snapshot may omit templates and kit-development tests. Do not assume it is a full scaffold distribution. Consult the pilot archive for a complete later distribution. Run bin/kit.mjs help to inspect commands; project commands expect a configured consumer repository.

## Daily workflow

1. Read the project's instructions and current handover; start a session or use the run wrapper.
2. Add/change D-n decision and AC-n acceptance rows in SPEC.md before changing behaviour. Acceptance rows name tests.
3. Search patterns for applicable building blocks, particularly money, saving and ledger behaviour; copy approved modules with pattern add where appropriate.
4. Implement inside declared task scope, run gate, then close. Close derives work records from Git and refuses failures instead of accepting a self-reported success.
5. For parallel work, use task branches/worktrees and check/merge verification. Update project handover information so a new model can continue.

The gate runs specification lint and project-configured commands. Session verification includes scope and secret checks. Pattern guidance and human review complement these mechanical checks; mentioning an acceptance ID in a file is not proof its test is meaningful.

## Knowledge and limits

Reusable patterns ship with the kit. This generation does not contain the later recall/learn/harvest knowledge lifecycle or required committed search receipts. Its guidance to consult patterns is weaker than the later pilot's search enforcement.

Task/worktree tools do not automatically dispatch agents. Local checks are not a tamper-proof security boundary when the worker can edit the verifier. No remote approvals, cloud scheduling, complete memory system or proven clean-room regeneration is implied. This README documents the archived design; it does not report a fresh execution of its complete test suite.

See [the branch comparison on main](https://github.com/ramsaipv4-lgtm/tins-kit-next) and the archive/tins-kit-next-pilot branch for the subsequent implementation.
