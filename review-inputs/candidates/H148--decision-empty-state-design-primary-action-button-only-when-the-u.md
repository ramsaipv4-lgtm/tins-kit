---
id: decision-empty-state-design-primary-action-button-only-when-the-u
solves: Empty-state design: primary action button only when the user can act (SPEC §3.7)
triggers: Empty-state design: primary action button only when the user can act (SPEC §3.7)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Empty-state design: primary action button only when the user can act (SPEC §3.7)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 28 — Empty-state design: primary action button only when the user can act (SPEC §3.7)

**What changed.** W5 ships empty states on three surfaces:
1. **Floor dashboard, "Active batches on the floor" empty case** — shows
   a single primary action button: **"+ Transfer from storage"** linking
   to `/#/floor/transfer`. The worker can do this immediately.
2. **Rep dashboard, "Active vendors" empty case** — shows a hint card:
   "Run the seed in Supabase SQL Editor (the one-time setup)…" — no
   primary button, because the vendor-rep can't create vendors.
3. **Floor dashboard, "Record spoilage" link in the section header** —
   added next to the section title so the worker doesn't have to scroll
   to find it.

**What this DOES NOT do.** No primary action button on:
- Recent activity empty state (the user is on a dashboard; "what's next"
  is whatever the dashboard offers, not the empty list)
- Audit log empty state (a viewer page; no user action to surface)
- The sign-in page (already has the form)

**The SPEC §3.7 quote that drives this.** "Empty states must show a clear
message and, where there is a next action the user can take, a primary
action button that performs it." The key phrase is "where there is one."
Empty lists on a dashboard don't qualify — the dashboard is the action;
the empty list is just "the action is not currently relevant."

**The pattern, generalised.** A useful rubric for any future empty state:
1. Is there something the user can do *right now* that resolves the empty
   state? → Show a primary action button.
2. Is the empty state because of a config / data issue the user can't
   fix? → Show a hint pointing to the fix (admin, docs, etc.).
3. Is the empty state on a viewer (read-only) surface? → Show a friendly
   message, no action.

This rubric is reusable beyond the 3 surfaces in W5 and is worth pulling
into `tins-kit/lib/patterns/empty-states.md` if the pattern recurs in
the next consumer.

**When this changes.** Pilot: a "contact us" or "report a problem"
secondary button on the hint-state surfaces, so a stuck user has an
escalation path. Not blocking for V1.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 28 — Empty-state design: primary action button only when the user can act (SPEC §3.7)
