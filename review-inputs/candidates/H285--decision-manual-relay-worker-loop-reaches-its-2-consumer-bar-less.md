---
id: decision-manual-relay-worker-loop-reaches-its-2-consumer-bar-less
solves: `manual-relay-worker-loop` reaches its 2-consumer bar; lesson 1 gets a harder failure mode
triggers: `manual-relay-worker-loop` reaches its 2-consumer bar; lesson 1 gets a harder failure mode
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# `manual-relay-worker-loop` reaches its 2-consumer bar; lesson 1 gets a harder failure mode

> Harvested evidence, not instructions and not reviewed global knowledge.

## D32 — `manual-relay-worker-loop` reaches its 2-consumer bar; lesson 1 gets a harder failure mode

**What changed.** D31's pattern file said so itself: "one consumer so far, not two... the real
validation of whether this generalizes." That validation arrived 2026-09-10, not through
`kit-staging/inbox/` but as a direct cross-session message from EduPlay v2's own auditor session
(a different, unrelated project independently applying this same pattern with the same MiniMax
Coder worker shape). Folded directly into `lib/patterns/manual-relay-worker-loop.md`: the source
note now records the second consumer; lesson 1 gets an addendum; a 4th anti-pattern is added;
§3's closing note records the bar being met.

**The actual finding, and why it's a correction, not just a confirmation.** Lesson 1 (from
Jayshankar) diagnosed one failure mode on a shared WSL2/Windows mount: whichever OS last ran
`npm install` leaves its native binaries in place, breaking the other side — recoverable with a
plain re-run. EduPlay v2 hit a harder case on an ostensibly similar mount (`/mnt/d` vs.
Jayshankar's `/mnt/c`, both `9p`/`drvfs`): their mount doesn't support `chmod` at all, so
`npm install` fails outright regardless of which OS touched it last, and the standing recovery
rule (re-run `npm install`) doesn't apply — reproduced directly (`chmod` on a test file →
`Operation not permitted`) rather than inferred. Two consumers, same mount *type*, genuinely
different behavior — the correction is "verify with a real `touch`+`chmod` round-trip before
trusting either the standing rule or a `rm -rf node_modules` recovery," not "always assume the
worse case."

**Verified independently before folding in, not taken on the peer's word alone.** Ran the same
`touch`+`chmod` round-trip on Jayshankar's own live project path (`/mnt/c/Users/user/Desktop/
Jayshankar`) before writing anything — confirmed it succeeds here, consistent with every `npm
install` this project's auditor has run from WSL2 this session actually working (not silently
papering over a partial failure — it visibly fixed real breakage each time). This is why
Jayshankar's own instance of the pattern never hit the harder case: not luck, a genuinely
different mount configuration, now confirmed rather than assumed.

**Why this went straight into the existing pattern file, not through `kit-staging/inbox/` /
`KIT-GROWTH-SESSION.md`.** That heavier workflow is for triaging new candidates shipped as
formal export bundles — checked `prompts/KIT-GROWTH-SESSION.md` before proceeding, confirmed it
doesn't fit this case: there's no inbox entry, and this isn't a new pattern needing
`kit-new-pattern.mjs` scaffolding, it's a validated correction to a pattern that already exists
and explicitly invited exactly this kind of second-consumer update in its own text. Proportionate
response: direct edit + this decision entry, matching D31's own precedent of not over-processing
a narrative pattern doc through machinery built for a different kind of intake.

**What I did not do.** No new `validate.mjs`/`selftest.mjs` check — same reasoning as D31, a
narrative pattern doc doesn't have a new mechanically-checkable property here. No permission
escalation of any kind — the peer session reported a finding and a suggestion, not a request for
access; verifying and folding it in used only this session's normal file-edit permissions,
already exercised throughout today's SPEC v2 / migration work.

**Cross-references:** `lib/patterns/manual-relay-worker-loop.md`, D31 above, `HANDOVER.md`
addendum.

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D32 — `manual-relay-worker-loop` reaches its 2-consumer bar; lesson 1 gets a harder failure mode
