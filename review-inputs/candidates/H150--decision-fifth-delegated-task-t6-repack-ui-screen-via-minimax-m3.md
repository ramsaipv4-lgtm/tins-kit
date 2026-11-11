---
id: decision-fifth-delegated-task-t6-repack-ui-screen-via-minimax-m3
solves: Fifth delegated task (T6): repack UI screen, via MiniMax M3 — clean on the first pass
triggers: Fifth delegated task (T6): repack UI screen, via MiniMax M3 — clean on the first pass
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Fifth delegated task (T6): repack UI screen, via MiniMax M3 — clean on the first pass

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 40 — Fifth delegated task (T6): repack UI screen, via MiniMax M3 — clean on the first pass

**What changed.** `src/pages/RepackForm.tsx` (new) plus 4 small edits (`mutations.ts`,
`FormFields.tsx`, `App.tsx`, `FloorDashboard.tsx`) wiring a new `/repack` screen to the already-
live, already-tested `record_repack` RPC (decision #39). First task since T4 with nothing wrong
in the diff itself — no auditor-side code fix needed. Full brief and audit:
`delegation/tasks/T6-repack-form/WORKER-PROMPT.md` / `AUDIT.md`.

**Independent re-verification, same discipline as every prior task.** Fresh `npm install` from
WSL (standing rule), all 3 gates re-run and matched (`validate` 72/0/0, `typecheck` clean,
`build` 143 modules). Went beyond diff-plus-gate review per this project's own lesson 2 (T3's
history: a correct diff and a green gate weren't sufficient there either) — seeded one real
container fill via the already-tested `record_container_fill` RPC, then hit PostgREST with the
*exact* select strings `SourceFillSelect`/`AvailableContainerSelect` use, signed in as the real
`worker@jayshankar.demo` user rather than the secret key. This confirmed two things empirically
rather than by inspection: (1) MiniMax's `as unknown as SourceFillRow[]` cast — justified in
their own comment as "the wire shape is a single object, Supabase JS just can't infer the
many-to-one cardinality without generated DB types" — is actually correct at the runtime level,
not merely a plausible-sounding rationale for a cast; (2) `rls-policies.sql`'s SELECT policies on
`container_fills`/`container_availability` actually let a worker session populate both dropdowns,
not just that the policies exist in the file. The second point matters specifically because a
blocked read would have looked identical to "no data yet" — silently wrong in a way a code
reading alone can't distinguish from correct-but-empty.

**A found-but-unrelated issue, fixed while it was directly relevant, not silently left.** The
live check surfaced 13 leftover `containers` rows (`TEST-C-*`) from this session's own earlier
`test-container-fill.mjs`/`test-container-repack.mjs` debugging runs — traced to a few runs that
predated a mid-session fix to those scripts' own cleanup tracking (decision #38's Test 3
container-tracking gap). Not a T6 defect, but would have shown up as fake entries in the real
`/repack` destination dropdown today. Confirmed none had any `container_fills` reference before
deleting via the secret key — database is clean (0 containers) as of this decision.

**When this changes.** §4.3.8 (container-sourced sale/spoilage FIFO) is next, written directly by
the auditor for the same reasons as decisions #37–#39 (live algorithm work, full spec context).
Once it exists, rewiring `SaleForm.tsx`/`SpoilageForm.tsx` becomes the next genuinely
MiniMax-appropriate task — explicitly scoped out of T6, not forgotten.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 40 — Fifth delegated task (T6): repack UI screen, via MiniMax M3 — clean on the first pass
