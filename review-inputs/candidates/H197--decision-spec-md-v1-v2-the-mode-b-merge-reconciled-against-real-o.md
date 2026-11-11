---
id: decision-spec-md-v1-v2-the-mode-b-merge-reconciled-against-real-o
solves: SPEC.md v1 → v2: the Mode B merge, reconciled against real operational facts
triggers: SPEC.md v1 → v2: the Mode B merge, reconciled against real operational facts
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# SPEC.md v1 → v2: the Mode B merge, reconciled against real operational facts

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 36 — SPEC.md v1 → v2: the Mode B merge, reconciled against real operational facts

**What changed.** `SPEC.md` is now v2. This merges `SPEC-AMENDMENT-v2.md` (D18–D27 — containers,
bills, receiving confirmation, CRM, payments, reversal, multi-store/warehouse schema, dormant
GST, notifications) into the canonical spec, **and** reconciles it against real operational facts
gathered directly from the user across a scoping conversation on 2026-09-10, captured in
`client-qa/operational-reality-2026-09-10.md`. This was not a mechanical copy-paste merge — several
of the amendment's own assumptions, and several of V1's original assumptions, turned out to be
wrong once real information came in, and got corrected during the merge rather than carried
forward wrong. `SPEC-AMENDMENT-v2.md` is marked superseded, kept as historical record.

**Four new locked decisions, D28–D31 (full text in `SPEC.md` §0.2):**
- **D28 — one mobile app, not one per role.** Researched 6 comparable products; the same pattern
  held everywhere (office/admin roles share one app; only the field/delivery role gets a
  genuinely separate minimal surface, and even that's a "make it cheap to split later" bet, not
  a second app built now).
- **D29 — supersedes D9.** There is one warehouse, no retail store, no display counter, no
  freezer — all three were V1 guesses that didn't match reality. `transfer` is repurposed for
  the (currently unused) cross-warehouse case; the real day-to-day "move stock around" operation
  is `repack`, which the amendment already specified for a different reason and turned out to be
  exactly the right shape for this too.
- **D30 — supersedes D6's offline-write exclusion, for the worker role.** V1 assumed "reliable
  shop WiFi"; the real worker job is hauling fish to buyers in the field. This was actually
  already flagged as a live conditional in V1's own closing notes ("if Mode B reveals the worker
  genuinely needs to record picks offline...") — the user independently recalled this mid-session
  before I'd surfaced it, and was right to. Now confirmed, sized honestly as significant
  engineering (write-queue, conflict resolution, sync UX), not a small add-on.
- **D31 — no price/rate value is ever pushed to a customer, automatically, ever.** Sourced from
  a real complaint about the wholesaler's current khata app. Checked against this app's actual
  code before writing the decision: `SaleForm.tsx` already enters price per-transaction with no
  published "current price" anywhere — this app never had the khata app's problem structurally.
  The decision makes that permanent and explicit rather than an accidental byproduct, binding on
  D20's WhatsApp channel and D27's notifications both.

**What else moved.** §9 (out of scope) revised — multi-store/offline-write-queue/reverse-sale/
customer-CRM/iOS/barcode-scanning/photo-capture/reports-beyond-dashboard/email-SMS-notifications
all moved from "out of scope" to "in scope, here's where" (struck through in place, not silently
deleted, so the history of what changed is visible in the file itself). §1, §2.5 (location model
rewritten, plus a new §2.5a plain-language container-model section — the one AGENT-BRIEF.md's
documentation standard explicitly required land in `SPEC.md` itself, not stay in the amendment),
§2.7 (movements table now 6 kinds, `transfer` and the FIFO algorithms re-explained for the
warehouse-only reality), §2.11 (worker UI rewritten around D28/D30), §2.14 (offline mode split
by role), all of §4.2's new tables (§4.2.10–4.2.21, `stores`→`warehouses` renamed throughout),
all of §4.3's new algorithms (§4.3.7–4.3.11, including the C.4 transfer-timestamp bug fix),
new acceptance criteria §8.10–§8.17 (the amendment's §8.10–8.14 plus three new sections for
D29/D30/D31), and a new closing-notes §D listing what's still genuinely open (box quantities,
GST status, credit terms, second-warehouse timing, staff follow-up verification, and a
**Tanglish UI possibility raised as "maybe," deliberately not locked as a decision** — flagged
for a real conversation, not defaulted either direction).

**What I did NOT do in this pass.** Did not touch any code — this is spec-only, per D1 (never
edit generated code; edit the spec). Did not create delegation tasks yet — the user asked for
that as a next step, sequenced after this merge specifically so task briefs derive from the
final locked spec rather than being written in parallel with it changing. `npm run validate`
confirmed still green (72/72) after the full merge — the validator's structural checks
(markers, §0.0–§0.2 presence, decision-count, acceptance-criteria presence) don't parse deep
content, so this is a necessary check, not a sufficient one; a close human read of the merged
sections is still worth doing before treating every word as final.

**When this changes.** When the still-open items in `SPEC.md`'s closing §D get real answers, or
when Mode B build work itself reveals something in this merge was wrong — same discipline as
always: amend the spec, log the decision, don't patch around it in code.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 36 — SPEC.md v1 → v2: the Mode B merge, reconciled against real operational facts
