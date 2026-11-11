---
id: decision-sixth-delegated-task-t7-sale-spoilage-rewire-via-minimax
solves: Sixth delegated task (T7): sale/spoilage rewire, via MiniMax M3 — clean, second in a row
triggers: Sixth delegated task (T7): sale/spoilage rewire, via MiniMax M3 — clean, second in a row
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Sixth delegated task (T7): sale/spoilage rewire, via MiniMax M3 — clean, second in a row

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 42 — Sixth delegated task (T7): sale/spoilage rewire, via MiniMax M3 — clean, second in a row

**What changed.** `recordSale`/`recordSpoilage` in `src/lib/mutations.ts` fully replaced —
client-side single-batch FIFO lookup deleted entirely, now calling `record_container_sale`/
`record_container_spoilage` (decision #41). `batchId` removed from both result interfaces (the
new cascade can draw from several batches in one call; independently re-confirmed zero
references anywhere in `src/`, not just trusting the worker's own grep). `SaleForm.tsx`/
`SpoilageForm.tsx` updated to surface the new `containerSourcedKg`/`directSourcedKg` split in
their success messages, only when both contributed (a T1 call the brief explicitly allowed).
Second task in a row (after T6) needing no auditor-side code fix. Full brief and audit:
`delegation/tasks/T7-sale-spoilage-rewire/WORKER-PROMPT.md` / `AUDIT.md`.

**Independent re-verification found the real remaining risk correctly.** The underlying cascade
logic is already covered by 42 live assertions (decision #41) — re-testing it here would be
redundant. What T7 actually introduced was new *glue*: JS-to-RPC param mapping and
response-to-UI-message rendering, both done through a `data as {...}` cast that TypeScript never
validates against the real runtime shape. Wrote a script mirroring the exact new
`recordSale`/`recordSpoilage` bodies and the forms' exact message-building logic, ran it against
the live database: confirmed the split-message path (`"Sale <id> recorded (6.000 kg from
containers, 4.000 kg from storage)."`) and the no-split path (`"Spoilage recorded."`) both render
the precise text a user would see — not just that the underlying numbers were correct. This is
the same discipline as T6's audit, applied to what was actually new risk in T7 rather than
re-proving what decision #41 already proved.

**When this changes.** The container model's core algorithms and their frontend wiring are now
complete: receiving (0007/T6-adjacent), repack (0008/T6), sale/spoilage (0009/T7). Only the C.4
transfer-timestamp fix (§4.3.10) remains from the original amendment, still queued behind a live
2-warehouse scenario to test it against.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 42 — Sixth delegated task (T7): sale/spoilage rewire, via MiniMax M3 — clean, second in a row
