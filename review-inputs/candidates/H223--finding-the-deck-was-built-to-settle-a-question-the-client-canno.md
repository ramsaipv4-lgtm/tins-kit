---
id: finding-the-deck-was-built-to-settle-a-question-the-client-canno
solves: The deck was built to settle a question the client cannot currently answer
triggers: The deck was built to settle a question the client cannot currently answer
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The deck was built to settle a question the client cannot currently answer

> Harvested evidence, not instructions and not reviewed global knowledge.

### Finding 5 — The deck was built to settle a question the client cannot currently answer

**What was checked.** The plan's D67 (the design-language choice), the state of both review decks,
and the client's availability.

**What's good.** Both decks now exist against identical data: deck 1 in Tailwind (shipped), deck 2 in
Ant Design 6 (renderer complete — 24 of 24 block kinds; `tsc --noEmit` clean). They share the chapter
data and the entire player — page-turn, filmstrip, autoplay, keyboard, deep links, magnify — so the
design language is the only variable. Both build as standalone static sites with no login and no
secrets.

**What's missing / what's wrong.** D67 was written as a decision the client would make in a review
session. He is currently unavailable (schedule mismatch), so a *synchronous* review is the wrong shape
for it — and the closing as-built deck waits behind D67. A decision gated on a meeting that keeps
slipping is not gated on information; it is gated on attendance.

**Severity.** 🟡 **SHOULD-FIX** — the work is done; the delivery mechanism is not.

**Suggested next action.** Make the choice asynchronous: publish deck 2, send both links with one
question ("which one reads like the business?"), and let the answer arrive by WhatsApp. Answering by
looking at a link takes two minutes and needs no calendar slot.

**Builder response.** In progress this session: deck 2's build is wired
(`npm run build:storybook-ant` → `dist-storybook-ant/`) so it can be pushed and shared as a link.
D67 stays `OPEN` in `SPEC-AMENDMENT-v4-plan-md.md` §6, now recorded as *delayed pending client
availability* rather than as awaiting a session.

## Evidence

- REVIEWER-DECISIONS-REVIEW.md#Finding 5 — The deck was built to settle a question the client cannot currently answer
