---
id: decision-w3-first-try-skus-column-mismatch-name-vs-english-name
solves: W3 first-try: SKUs column mismatch (`name` vs `english_name`)
triggers: W3 first-try: SKUs column mismatch (`name` vs `english_name`)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# W3 first-try: SKUs column mismatch (`name` vs `english_name`)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 21 — W3 first-try: SKUs column mismatch (`name` vs `english_name`)

**What changed.** W3 first try surfaced this: the `skus` table has columns
`english_name` and `tamil_name` (Tamil-first naming per SPEC), NOT a `name`
column. The form's `SkuSelect`, plus the Rep/Floor/Admin dashboards' SKU
queries, all selected `from('skus').select('id, code, name')` — wrong column.
The query returned `400 Bad Request` with `column skus.name does not exist`,
React Query set `data` to `null`, and the SKU dropdowns rendered empty. The
"unable to select" the user reported was a dropdown with no options.

**The fix.** All 5 query sites now select `english_name, tamil_name` (4 sites
just need `english_name`; the dropdown only renders `english_name` for the
demo — Tamil is a Pilot localisation). All 4 render sites updated to use
`s.english_name`. The AdminDashboard's `default_shelf_life_hours` (a
non-existent column) replaced with `shelf_life_hours` — the SKUs table on the
admin dashboard had been silently failing since W2.

**Bonus fix in the same PR:** the `FormField` wrapper didn't pass its `id`
down to the child select. `document.querySelector('#sku')` returned `null` —
not the cause of the empty dropdown, but a separate accessibility/debug issue.
The form now passes `id` explicitly to each select (4 forms updated). The
`<label htmlFor>` association was already correct via the form's `id` prop.

**Why this slipped past W2.** In W2, the rep/floor dashboards showed
"SKUs (...)" — the `...` placeholder meant the query was loading or had
returned an error, but the user didn't catch it because the rest of the
dashboard (vendors table, stat cards) worked fine. The empty SKU list looked
like a loading state, not a failure. The bug only became visible when the
W3 form REQUIRED a SKU selection (no fallback, no skip).

**The validator doesn't catch this.** The validator checks SPEC.md content,
SQL schema, and setup artefacts. It doesn't introspect the React code for
"did you remember the actual column names." A type check (TypeScript) would
have caught the `s.name` access on a `Sku` interface that doesn't define
`name` — but I was loose with the interface (just `{ id, code, name }`
everywhere). The new interfaces all use `english_name` correctly.

**Impact on downstream.** A future contributor copy-pasting the SKU query
pattern would hit the same bug. A linter rule ("PostgREST response columns
must match the table schema") would catch it; that's a Pilot-mode work item.
For W3, the diagnostic is: "dropdown is empty → paste the query in DevTools
console, look for `column X does not exist`."

**Kit-level implication.** The `tins-kit/templates/SPEC.md` should call
out the column-naming convention (Tamil-first for the fish app, English-first
for most apps) so future TINS consumers don't assume `name` exists. Pilot
work item.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 21 — W3 first-try: SKUs column mismatch (`name` vs `english_name`)
