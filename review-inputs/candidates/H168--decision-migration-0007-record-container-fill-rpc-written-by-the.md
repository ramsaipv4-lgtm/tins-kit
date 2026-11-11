---
id: decision-migration-0007-record-container-fill-rpc-written-by-the
solves: Migration 0007: `record_container_fill` RPC, written by the auditor and covered by a real live test before being called done
triggers: Migration 0007: `record_container_fill` RPC, written by the auditor and covered by a real live test before being called done
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Migration 0007: `record_container_fill` RPC, written by the auditor and covered by a real live test before being called done

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 38 — Migration 0007: `record_container_fill` RPC, written by the auditor and covered by a real live test before being called done

**What changed.** `supabase/migrations/0007_record_container_fill.sql` adds
`compute_container_fill_expiry(filled_at, sku_ids[])` (pure helper, `filled_at + min(shelf_life_hours)`
across a fill's SKUs — `SPEC.md` §4.2.12) and `record_container_fill(bill_id, location_id,
container_number, capacity_kg, items[])` (§4.3.7, the receiving-side operation). Both are
`SECURITY DEFINER`, matching the `record_transfer_cascade` precedent (migration 0005).
`record_container_fill` validates: container availability (rejects loading into a container that
still has stock per §4.2.11's derived-availability rule), capacity (total kg ≤ container capacity),
and that every item's batch traces to the *same* bill (§4.2.12's one-purchase-event-per-fill rule
— a cross-row consistency check, not expressible as a column constraint). Scoped deliberately
narrower than the full amendment range — this is the prerequisite every other container operation
needs (repack, container-sourced sale/spoilage FIFO, the C.4 transfer fix all need real
`container_fills` rows to exist first, and none did). Written directly, not delegated, same
reasoning as decision #37 (live schema, full context from authoring `SPEC.md`).

**A real security point, not just a style choice.** `SECURITY DEFINER` bypasses RLS entirely —
the careful per-role policies in `rls-policies.sql` do *not* protect a caller of this function.
Both new functions do their own internal role check in the function body
(`current_user_role() not in (...)` → `raise exception ... using errcode = '42501'`), matching
the `containers`/`bills`/`container_fills` INSERT policies (admin, co-admin, vendor-rep,
super-worker — receiving is not a worker task, unlike repack will be). This matters for any
future `SECURITY DEFINER` function too: the existing `record_transfer_cascade` (migration 0005)
has no internal role check, which was fine only because Mode A's transfer was genuinely open to
every role — that stops being true once a transfer-fix RPC is built for D29 (transfer restricted
to admin/co-admin only), and that RPC will need an explicit role check this one didn't need to
teach it.

**A schema gap found while designing the next piece, flagged rather than improvised past.**
`SPEC.md` §4.3.9 (repack) asks for one `movements` row referencing *both* the source and
destination `container_fill_id` — but migration 0006 only added a single `container_fill_id`
column to `movements`, not two. Discovered this mid-design for `record_repack`, before writing
any code against it. Not fixed in this migration — flagged here and in 0007's own header comment
as a concrete, scoped follow-up (likely a `source_container_fill_id` column added by a small
migration 0008) for whoever builds repack next, rather than quietly reinterpreting the spec's
intent to fit the existing column in the same breath as unrelated work.

**A real bug the live test caught, not a hypothetical one.** First live run of
`scripts/test-container-fill.mjs` failed 1 of 14 assertions: the capacity-exceeded error path
used `format('... %.3f ... %.2f ...', ...)` — Postgres's `format()` only supports `%s`/`%I`/`%L`/
`%%`, no printf-style precision specifiers, so it raised `unrecognized format() type specifier`
instead of returning the intended error message. Three call sites had the same mistake (capacity
check, per-item shortfall check, invalid-capacity check). Fixed by `round(x, N)`-casting through
`%s`. Re-ran the fixed function (re-applied via `CREATE OR REPLACE FUNCTION`, no new migration
number needed) and all 14 assertions passed. Worth remembering as a standing lesson: this class
of bug (a syntax mistake inside a string literal, invisible to `npm run validate`'s structural
checks) is exactly what a real call against the live database catches and a read-through doesn't
— matches `AGENT-BRIEF.md`'s explicit warning that this area is "the easiest thing in this whole
amendment to get subtly wrong."

**The test itself, and why it doesn't trust the RPC's own report.** `scripts/test-container-fill.mjs`
signs in as the real `admin@jayshankar.demo` and `worker@jayshankar.demo` demo users via the Auth
password grant rather than using the secret key to call the RPC — `current_user_role()` reads
`auth.uid()`, which is `NULL` for secret-key calls (no JWT subject), so testing the internal role
check requires a real session, the same way the app itself will call it. The secret key is used
only for read-back verification (confirming what's actually persisted in `container_fills`/
`container_fill_items` matches what the RPC claimed, not just trusting its return value) and for
cleanup afterward. All 6 test groups passed: happy path including the min-shelf-life rule across
2 SKUs, container-reuse rejection, capacity rejection, cross-bill rejection, worker-role
rejection (HTTP 403), and the helper function in isolation. Every row the test creates is deleted
afterward regardless of pass/fail — caught and fixed one bug in the test's own cleanup order
before the first live run (`container_fill_items` is `ON DELETE RESTRICT` back to
`container_fills`, not `CASCADE`; the items must be deleted first, by `container_fill_id`, or the
`container_fills` delete fails and leaves test data behind).

**When this changes.** `record_repack` (§4.3.9) is next, blocked on the `movements` schema gap
above — needs its own small migration before it can be written correctly rather than worked
around. The C.4 transfer-timestamp fix (§4.3.10) has no live 2-warehouse scenario to test against
yet and stays queued behind repack, which is the operation actually used day to day right now and
carries the identical "must never reset the freshness clock" risk. Once repack exists, wiring the
application forms (`SaleForm.tsx`/`SpoilageForm.tsx`) to container-aware RPCs becomes a genuine
MiniMax-appropriate delegated task again — this and #37 are schema/algorithm work, not frontend
work, which is why both stayed with the auditor.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 38 — Migration 0007: `record_container_fill` RPC, written by the auditor and covered by a real live test before being called done
