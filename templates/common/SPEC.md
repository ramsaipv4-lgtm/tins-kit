# {{NAME}} — specification

SPEC.md is the source of truth. Every behaviour is a row here first, then code.
`D-n` rows are decisions (status: locked, open, or superseded by D-n). `AC-n` rows are acceptance
criteria; the Check column names the test file that checks it, and that file mentions the AC id.

## Cheapest version that would work

(Name one concrete cheap artefact, and what the version below buys over it.)

## Decisions

| ID | Decision | Status | Why |
|---|---|---|---|
| D-1 | {{NAME}} is built spec-first with tins-kit: knowledge recall before work, a gate before done | locked | The repository, not a chat, is the shared memory between sessions and models |

## Acceptance

| ID | Check | What it proves |
|---|---|---|
| AC-1 | test/spec.test.mjs | SPEC.md exists and has at least one decision and one acceptance row |

## Out of scope

- (List what a keen implementer must not build.)
