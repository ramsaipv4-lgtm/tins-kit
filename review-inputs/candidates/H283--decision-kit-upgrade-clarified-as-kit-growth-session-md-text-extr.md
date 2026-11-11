---
id: decision-kit-upgrade-clarified-as-kit-growth-session-md-text-extr
solves: `kit-upgrade` clarified as `KIT-GROWTH-SESSION.md`; text-extractor-from-html inbox item triaged and closed
triggers: `kit-upgrade` clarified as `KIT-GROWTH-SESSION.md`; text-extractor-from-html inbox item triaged and closed
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# `kit-upgrade` clarified as `KIT-GROWTH-SESSION.md`; text-extractor-from-html inbox item triaged and closed

> Harvested evidence, not instructions and not reviewed global knowledge.

## D34 — `kit-upgrade` clarified as `KIT-GROWTH-SESSION.md`; text-extractor-from-html inbox item triaged and closed

**What changed.** The user's "kit-upgrade" referred to `prompts/KIT-GROWTH-SESSION.md` — clarified
by the peer session (`class-fun-ef`), confirmed present in both vendored copies. Ran it for real:
`kit-staging/inbox/` had one real, unprocessed entry (`text-extractor-from-html`, sitting since
2026-08-16) that the original automated triage had silently mis-scored as "0 candidates" due to
exactly the `kit-extract.mjs` parser bug the submitting project itself diagnosed and reported
(see below) — the hand-authored `kit-growth-candidates.md` sitting alongside it was the correct,
never-actually-processed record.

**Both kit bugs the submitter reported are already fixed, found by checking, not assumed:**
1. `kit-extract.mjs`'s `parseDecisions()` — confirmed fixed in Jayshankar's vendored copy (a
   "Fixed 2026" comment already there, now matching both the kit's own `## D<N>` heading
   convention AND `templates/BUILDER-DECISIONS-REVIEW.md`'s shipped `### Decision N` convention).
   Confirmed via `diff` that `kit-extract.mjs` is byte-identical between Jayshankar's copy and
   the actual canonical root (`C:\Users\user\Desktop\TINS-projects\atal-incubation\tins-kit\` —
   found for the first time this session; not the same as either vendored copy this session had
   been comparing) — the fix is already at the source, not just downstream.
2. `kit-new-project-shell.mjs`'s `shellFiles` missing `kit-staging-export.mjs` — checked directly
   in the canonical root too (not assumed from Jayshankar's copy alone): already fixed there as
   well, same "Fixed 2026" comment present.

**The 3 candidates: correctly deferred, not accepted.** All 3 came from one consumer project
(`text-extractor-from-html`); 2 of the 3 are framed as "two datasets" through the same codebase,
not two independent TINS consumers — the submitter's own triage note got this exactly right
against the kit's 2-consumer bar (the same discipline `manual-relay-worker-loop.md`'s own D31/D32
already established). Agreed with that self-assessment rather than re-deriving it; nothing added
to the kit's patterns from this batch. Re-ran `kit-ingest.mjs --archive`: correctly still reports
0 candidates (the hand-authored file's prose format isn't the pre-mined structured shape
`kit-ingest.mjs` expects to auto-score — a real, minor gap, not chased further here since the
human/LLM-readable judgment call was already made correctly by hand) — inbox entry archived to
`kit-staging/archive/2026-09-11/text-extractor-from-html/`.

**Found, not acted on: the canonical root (`atal-incubation`) and Jayshankar's vendored copy have
diverged substantially beyond these two bugs** — Jayshankar's copy has several newer
prompts/patterns/scripts (D29–D33-era kit growth: `manual-relay-worker-loop.md`,
`tiered-escalation.md`, `third-party-tool-audit.md`, `WORKER-SESSION.md`,
`EXECUTION-MODE-INTERVIEW.md`, `orchestrate.mjs`, etc.) that the canonical root doesn't have yet.
A full sync (`kit-sync.mjs` the other direction, or a proper push-to-canonical) is real, separate
scope — flagged to the user rather than done unprompted; today's task was the two consumers'
reconciliation (D33) plus this inbox item, not a full 3-way kit audit.

**Cross-references:** D33 above; `kit-staging/inbox/text-extractor-from-html/` (now archived);
`kit-staging/triage-2026-09-11.md`; `scripts/kit-extract.mjs`, `scripts/kit-new-project-shell.mjs`.

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D34 — `kit-upgrade` clarified as `KIT-GROWTH-SESSION.md`; text-extractor-from-html inbox item triaged and closed
