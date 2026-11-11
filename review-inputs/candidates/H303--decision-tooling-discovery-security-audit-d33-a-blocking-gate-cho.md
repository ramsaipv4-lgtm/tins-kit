---
id: decision-tooling-discovery-security-audit-d33-a-blocking-gate-cho
solves: Tooling discovery + security audit (D33): a blocking gate, chosen over advisory-but-recorded
triggers: Tooling discovery + security audit (D33): a blocking gate, chosen over advisory-but-recorded
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Tooling discovery + security audit (D33): a blocking gate, chosen over advisory-but-recorded

> Harvested evidence, not instructions and not reviewed global knowledge.

## D27 — Tooling discovery + security audit (D33): a blocking gate, chosen over advisory-but-recorded

**What changed.** Added `prompts/TOOLING-AUDIT.md` (6-step workflow), `scripts/tooling-audit.mjs` (the gate), `templates/TOOLING-AUDIT.md` (the record), and `lib/patterns/third-party-tool-audit.md` (nine red flags, three verdicts). Wired it as a blocking Step 0 into both `NEW-PROJECT.md` and `CONTINUE-TINS-PROJECT.md`, and added the new files to the portable shell scaffolder.

**Why blocking rather than advisory.** The reviewer's instinct was advisory-but-recorded — lower friction, still auditable. The user overrode it, and the argument is decisive: proceeding "with assumptions and handicaps" is the precise failure being prevented, and a gate that can be skipped silently does not prevent it. The failure mode is specific and invisible — a session lacking a capability does not stop, it improvises: guesses at an API response, estimates a number it could have looked up, writes a plausible paragraph where a real query belonged.

**Why a waiver must name the handicap.** The gate can be declined; that is the user's call. But `skipped, not needed` is worthless to the next session. Requiring the waiver to name the capability given up **and** where assumptions now stand in for real data is what makes the handicap inheritable rather than invisible — and invisible handicaps get written up as facts. `tooling-audit.mjs` rejects a placeholder waiver note for exactly this reason.

**Why uncertainty resolves to REVIEW-REQUIRED.** The user's phrasing was "if you are unsure just flag the user to read it." Making that the default rather than a fallback matters because a skill is not a library — it is instructions the model follows, with the same authority as the user's own, where the dangerous line is a plain-English sentence that passes every linter ever written. A confident clearance of a half-read skill is the outcome the rubric exists to prevent.

**Why the kit never executes a candidate.** Dynamic analysis feels more rigorous and is strictly worse here: running an untrusted skill to evaluate it *is* the compromise, and a payload that fires only on a second run or only with a real credential present is invisible to a test run. The audit is static reading, and SAFE is defined honestly as "nothing in the source gave cause for concern" rather than "observed to be harmless."

**Impact on downstream.** Every project now starts with a written, inheritable answer to "what can this harness actually do, and what are we pretending we can do?"

**Cross-references:** SPEC.md D33 + §8.30, lib/patterns/third-party-tool-audit.md, prompts/TOOLING-AUDIT.md, scripts/tooling-audit.mjs.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D27 — Tooling discovery + security audit (D33): a blocking gate, chosen over advisory-but-recorded
