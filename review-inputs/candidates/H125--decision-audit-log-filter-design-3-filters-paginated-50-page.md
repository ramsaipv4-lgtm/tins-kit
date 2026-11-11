---
id: decision-audit-log-filter-design-3-filters-paginated-50-page
solves: Audit log filter design: 3 filters, paginated 50/page
triggers: Audit log filter design: 3 filters, paginated 50/page
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Audit log filter design: 3 filters, paginated 50/page

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 25 — Audit log filter design: 3 filters, paginated 50/page

**What changed.** W4 ships `src/pages/AuditLog.tsx` at `/#/admin/audit-log`.
3 filters (table_name dropdown, user_id dropdown, from/to date pickers),
pagination (50 per page, ← Previous / Next → buttons), and a Show/Hide
button per row to expand the JSON before/after blobs.

**Why these 3 filters.** The 3 most-asked audit questions in a wholesale
context:
- "What did the worker do today?" → user + date range
- "Which batches have been touched?" → table = batches
- "What happened in the last hour?" → date range, no other filter

**Why no "action" filter (INSERT/UPDATE/DELETE).** For the demo, the 9
tables we audit are all INSERT-heavy (we don't do UPDATE except the
kg_remaining trigger). The action filter would be useful for a system
with lots of UPDATEs; Pilot can add it.

**Why no search box.** Fuzzy search across the JSON blobs is expensive
(client-side filter) or requires Postgres `tsvector` (Pilot). For W4, the
table + user + date filters are the right surface.

**Why paginate at 50.** 50 rows × ~150 bytes per row = ~7.5 KB response.
That's well under the 1MB Supabase response limit and loads in <100ms on
2021 Android. 100 per page would also work; 50 is the conservative choice
that keeps the UI snappy on slower networks.

**Show/Hide JSON expansion.** Each row's `before_json` and `after_json` are
up to a few KB. Showing them all by default would be visually overwhelming.
Show/Hide lets the admin drill in on demand. The JSON is rendered in a
`<pre>` block with whitespace-pre-wrap, so it's readable in any viewport.

**When this changes.** Pilot/Production: add a JSON diff view (highlight
changed keys in UPDATE rows), add an Export CSV button, and consider an
audit_log retention policy (the table grows unbounded; 90-day TTL via a
cron job is a Pilot item).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 25 — Audit log filter design: 3 filters, paginated 50/page
