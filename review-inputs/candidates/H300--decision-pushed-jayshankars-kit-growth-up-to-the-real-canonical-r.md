---
id: decision-pushed-jayshankars-kit-growth-up-to-the-real-canonical-r
solves: Pushed Jayshankar's kit growth up to the real canonical root (`atal-incubation`)
triggers: Pushed Jayshankar's kit growth up to the real canonical root (`atal-incubation`)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Pushed Jayshankar's kit growth up to the real canonical root (`atal-incubation`)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D35 — Pushed Jayshankar's kit growth up to the real canonical root (`atal-incubation`)

**What changed.** User asked to reconcile the third kit location found while closing out D34
(`C:\Users\user\Desktop\TINS-projects\atal-incubation\tins-kit\` — the actual canonical root per
`VERSIONING.md`'s own layout, not a vendored copy). Used `kit-sync.mjs` exactly as built —
`--to=<canonical-path>` from Jayshankar's kit — treating Jayshankar's vendored copy as the
(more-advanced) source for this one push, the reverse of the tool's normal direction but
mechanically identical.

**Protected the 2 files `VERSIONING.md` Rule 6 names as legitimately independent before running
for real.** Backed up atal-incubation's own `HANDOVER.md`/`BUILDER-DECISIONS-REVIEW.md`, ran the
sync (46 files copied, 109 unchanged, 3 preserved), restored those 2 immediately after — `dry-run`
first showed the tool would have overwritten them too; it has no file-level exclusion flag.
`SPEC.md`/`INDEX.md` were correctly left to sync normally — Rule 6 names only the kit's own
HANDOVER/BUILDER-DECISIONS-REVIEW, not these.

**A real gap found by actually running the gate after, not assumed clean from the sync report
alone.** `validate.mjs` (freshly synced in) failed 4/83 — §8.33a-d, all requiring
`examples/autonomous-todo-app/` to exist. `kit-sync.mjs` deliberately excludes `examples/` by
design (D36's own comment: "reference material for a person," not meant to bloat every vendored
copy) — but a validator check added alongside that same D36 work requires it to exist regardless,
an inconsistency nothing had hit before because no full kit-sync into a fresh/older target had
been run against these particular checks until now. Copied `examples/` (308K) into
atal-incubation directly — the exclusion's own rationale argues FOR the canonical root keeping
it, even though per-consumer vendored copies shouldn't carry it. 83/83 after.

**Also cleaned up:** atal-incubation had its own independent, still-pending
`kit-staging/inbox/text-extractor-from-html/` (a separate copy of the same D34 item, apparently
distributed to multiple inbox locations at some point) — confirmed byte-identical to the
already-archived version before removing the duplicate rather than leaving two copies of the
same processed item.

**Verified after, not assumed.** `node --test scripts/selftest.mjs` (56/56) and
`node scripts/validate.mjs --spec=SPEC.md` (83/83) both re-run directly at the canonical root
after every change above, not just at Jayshankar's own copy.

**Not done: class-fun-ef's copy has its own separate, still-unprocessed inbox duplicate of the
same item** (`/mnt/d/Python-AI_ML-SRM/class-fun/tins-kit/kit-staging/inbox/text-extractor-from-html/`)
— this session's sandbox can't write there; flagged back to that session directly rather than
left silent.

**Cross-references:** D33, D34 above; `scripts/kit-sync.mjs`; `VERSIONING.md` Rules 1, 6;
`examples/autonomous-todo-app/`.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D35 — Pushed Jayshankar's kit growth up to the real canonical root (`atal-incubation`)
