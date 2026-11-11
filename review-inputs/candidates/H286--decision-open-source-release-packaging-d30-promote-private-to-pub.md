---
id: decision-open-source-release-packaging-d30-promote-private-to-pub
solves: Open-source release packaging (D30): promote private-to-public.mjs, whole-tree scan, corporate-tone docs, quality rubric
triggers: Open-source release packaging (D30): promote private-to-public.mjs, whole-tree scan, corporate-tone docs, quality rubric
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Open-source release packaging (D30): promote private-to-public.mjs, whole-tree scan, corporate-tone docs, quality rubric

> Harvested evidence, not instructions and not reviewed global knowledge.

## D24 — Open-source release packaging (D30): promote private-to-public.mjs, whole-tree scan, corporate-tone docs, quality rubric

**Date:** 2026-08-21
**Status:** ✅ accepted
**Decided by:** <name>
**Cross-references:** —

**Context.** D29 deferred an open-source/public-release packaging capability as a D30 candidate. The user asked to finish it this session, and additionally wanted lib/patterns/private-to-public.md substantially reworked (not just the embedded script promoted as-is), in-line code comments considered for methodology scrutiny, and all generated public documentation to read in a fully corporate voice with no LLM authorship tells.

**Decision.** Two trigger points mirroring D28's shared-interview pattern: SPEC-AUTHOR.md question 8 (unconditional, every project) records Public release intended: TRUE/FALSE in SPEC.md section 0.2; prompts/PUBLISH-OPEN-SOURCE.md (new, 9 steps) does the actual packaging at release time. scripts/private-to-public.mjs promoted from an embedded code block in the pattern doc into a real, shipped, zero-dep script -- fixed a latent glob-matching bug in its inherited copy-filter along the way (scripts/*.mjs-style wildcard patterns never matched anything before this fix). It copies the private working copy into a public sibling per an include/exclude table, mechanically rewrites the TINS marker-line comment, then scans the ENTIRE destination tree -- every file, in-line comments included -- against its own banned-terms list covering methodology fingerprints AND LLM-authorship fingerprints (model/vendor names, leftover assistant-speak). lib/patterns/private-to-public.md rewritten: a corporate-tone requirement (section 3.0), a new docs/DESIGN-WALKTHROUGH.md doc type (section 3.6), a 5-question quality rubric (section 3.7), and the full script text replaced with a reference to the real file to avoid drift.

**Alternatives considered.**
- Folding the packaging step into RELEASE-CHECKLIST.md's existing private-to-public sweep section (rejected -- that section is a same-repo prod-readiness sweep, a different concern from producing a second public-facing repo). Sharing one banned-terms list between scan-task-packet.mjs (D29) and private-to-public.mjs (D30) (rejected -- user's explicit choice to keep them separate for now, since the two scripts solve different problems: one scoped task packet vs. a whole publicly-released project). A single early-only or late-only trigger (rejected in favor of two trigger points, matching D28's precedent of one interview shared across two entry points).

**Consequences.**
- Every future SPEC-AUTHOR.md interview now asks about public-release intent regardless of project type, adding one more locked decision row. Releasing a project publicly is now a defined, scannable, rubric-gated workflow instead of an ad-hoc 2-hour manual process (the original Jayshankar baseline). The corporate-tone requirement means public docs need real editorial effort, not just a clean scan -- the scanner proves absence of bad strings, not presence of good documentation. The curriculum-generator idea the user also raised was deliberately scoped out as a D31 candidate rather than attempted alongside D30, since it has zero prior art in the kit and is a from-scratch design effort of comparable size to D29 or D30 itself.

**How to verify.** `node scripts/validate.mjs --spec=SPEC.md` exits 0 (47 pass, 0 warn, 0 fail, up from 41); `node scripts/validate.mjs --kit` exits 0 (37 pass, 0 warn, 0 fail); `node --test scripts/selftest.mjs` exits 0 (19/19, up from 15, the 4 new cases exercise `scripts/private-to-public.mjs` directly rather than via the validator); `node scripts/private-to-public.mjs <src> <dst> --name="..."` smoke-tested live against a fixture with planted TINS/AGENTS.md/HANDOVER.md/Claude/"as an AI"/"Certainly!" leaks (exit 1, all caught), the same fixture cleaned (exit 0), and no-args usage (exit 2).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D24 — Open-source release packaging (D30): promote private-to-public.mjs, whole-tree scan, corporate-tone docs, quality rubric
