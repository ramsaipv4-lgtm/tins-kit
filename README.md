# TINS document-based kit — historical workflow

This iteration organized specification-driven development around interviews, templates, decision logs, reusable patterns and scripts. It already contains validation, session and delegation tooling; it is not prose-only.

## How it was expected to work

1. Read [CORE.md](CORE.md), [PIPELINE.md](PIPELINE.md) and the application's HANDOVER.md. The historical entry documents overlap; check script help when examples differ.
2. Interview the owner using prompts/SPEC-AUTHOR.md. Author and review the application SPEC.md before implementation.
3. Use scripts/kit-coverage.mjs to find patterns; inspect applicability and NOT WHEN conditions.
4. Start a session, declare scope, update the specification, implement and test. Record non-obvious decisions and rejected alternatives in BUILDER-DECISIONS-REVIEW.md.
5. Run validators and product tests, close the session with evidence, update the handover and commit. Record failures and abandoned work truthfully.
6. Extract candidate lessons, review them through the KITTING workflow, then synchronize approved kit changes to consumers.

## Project setup

Keep the master kit and application repositories separate. Consumer projects commonly copy plain kit files into their own tins-kit/ directory, without the kit's .git. The application's SPEC.md and HANDOVER.md govern its product; the kit's own specification describes the kit.

Read scripts/new-project.mjs and prompts/NEW-PROJECT.md for scaffolding. The portable-shell route uses scripts/kit-new-project-shell.mjs. Historical commands assume different directory layouts; do not reuse old absolute machine paths blindly.

## Reuse, delegation and continuity

Patterns/modules live in lib/. Builder decisions feed scripts/kit-extract.mjs and a reviewed staging queue. Remote consumers export bundles; adjacent consumers can use synchronization scripts. A recurring pattern needs actual adoption evidence, not merely two copied library files.

Delegation prompts create task packets; session tooling tracks work and shared claims. New agents resume from repository handovers and decisions. Chat-only agents use human-relayed packets and must not claim unexecuted checks.

## Limits and navigation

This workflow depends on substantial documentation maintenance and human judgement. Extraction creates candidates, not verified truth. Structural checks do not prove product correctness or reconstruction from specification alone. This documentation update does not claim the archived runtime has been freshly tested.

- [INDEX.md](INDEX.md): tools and patterns.
- [VERSIONING.md](VERSIONING.md): distribution and synchronization.
- [Current iteration](https://github.com/ramsaipv4-lgtm/tins-kit-next): new specification baseline, not this implementation.
