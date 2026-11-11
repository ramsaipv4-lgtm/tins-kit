---
id: decision-pull-forward-the-8-new-templates-g20-g27
solves: Pull forward the 8 new templates (G20–G27)
triggers: Pull forward the 8 new templates (G20–G27)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Pull forward the 8 new templates (G20–G27)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D12 — Pull forward the 8 new templates (G20–G27)

**What changed.** Wrote 8 new files under `templates/`:
- `HANDOVER.md` (G20) — the consumer's HANDOVER work system (W-queue + state snapshot + gotchas + protocol).
- `AGENTS.md` (G21) — the consumer's 1-page LLM onboarding (60-second orientation + reading list + standing rules + ask-vs-try).
- `zod-schemas/money.zod.ts` (G22) — the Zod schema for money, with the `MONEY_REGEX = /^\d+\.\d{2}$/` contract.
- `sql/rls-policies.sql` (G23) — the idempotent RLS-enable migration (now in templates/, not lib/).
- `sql/audit-trigger.sql` (G24) — the append-only audit log trigger, idempotent.
- `eslint/no-float-money.js` (G25) — the ESLint rule that bans `Number()` and `parseFloat()` on money fields.
- `.gitignore` (G26) — the kit's recommended `.gitignore` (9 must-ignore categories).
- `sql/idempotent-migration-pattern.sql` (G27) — a starter migration showing the 6 idempotency primitives.

**Why.** The SPEC §2.5 promised these templates; the gap analysis identified the gap. The consumer retro-fit (W7) needs every template present and non-empty.

**Impact on downstream.** Consumers copy the templates, fill in the project-specific values, and have a complete TINS workspace on day 1.

**Cross-references:** SPEC.md §2.5 (the templates layer), §8.6 + §8.16 (the acceptance criteria), docs/WORKFLOW.md §4.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D12 — Pull forward the 8 new templates (G20–G27)
