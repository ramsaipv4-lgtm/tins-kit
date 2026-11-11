---
id: decision-first-delegated-task-t1-floordashboard-tsx-location-disp
solves: First delegated task (T1): `FloorDashboard.tsx` location display name, via MiniMax M3
triggers: First delegated task (T1): `FloorDashboard.tsx` location display name, via MiniMax M3
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# First delegated task (T1): `FloorDashboard.tsx` location display name, via MiniMax M3

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 31 — First delegated task (T1): `FloorDashboard.tsx` location display name, via MiniMax M3

**What changed.** `src/pages/FloorDashboard.tsx`'s `locations` query selected only `id, name`,
so the Active-batches table's Location column showed raw short names (`storage`, `display`,
`freezer`) instead of the friendly `display_name` (`Cold Storage`, `Display Counter`, `Deep
Freezer`) every other screen shows. Fixed by adding `display_name` to the query, the `Location`
interface, and `locationName()`'s fallback chain — matching the existing pattern in
`src/components/RecentActivity.tsx` exactly. One file, three lines.

**Who built it.** This is the first real task run through the new `delegation/` setup (see
`delegation/README.md`): Claude planned the task and wrote the brief, **MiniMax M3 (via the
MiniMax Coder desktop app on native Windows) built it**, Claude audited independently before
integrating. Full record: `delegation/tasks/T1-floor-location-display-name/` (`WORKER-PROMPT.md`,
`NOTES.md`, `AUDIT.md`).

**Why this is worth recording in the real decision log, not just the delegation folder.** The
delegation folder is process/coordination state; this file is the project's actual decision
history, same as any other builder session's work — where the code came from doesn't change
that. Two things worth knowing if you're reading this later: (1) the loop worked end-to-end on
its first real try — MiniMax's diff was exactly in scope and its self-reported verification was
independently confirmed accurate; (2) it also confirmed a real risk, not just a theoretical one
— MiniMax's own `npm run build` on Windows left Windows-only native binaries (`@rollup/rollup-
win32-...` in place of `@rollup/rollup-linux-x64-gnu`) in the `node_modules` folder this project
shares with its WSL2 mount, breaking the dev server on the auditor's side until a plain `npm
install` fixed it. Anyone auditing delegated work on this project from WSL should `npm install`
first, every time, not just when something breaks.

**Bonus fix, same commit, not MiniMax's work.** While auditing T1, found `npm run typecheck`
had been silently failing (`RecentActivity.tsx(4,1): 'Link' is declared but its value is never
read`) — pre-existing, unrelated to T1, never caught because neither `npm run validate` nor
`npm run selftest` (the project's actual gate) runs `tsc --noEmit`. Removed the unused import
(one line). Worth a future decision on whether `typecheck` should join the gate rather than stay
opt-in — not decided here.

**Not fixed here, logged as follow-up candidates** (see `delegation/tasks/T1-.../AUDIT.md` for
full detail): `AdminDashboard.tsx` has the same missing-`display_name` gap T1 just fixed, though
it's currently invisible (nothing renders a location name there yet, just a count) — lower
urgency than T1 was. Separately, `FloorDashboard.tsx`'s "Expires" column is unconditionally
blank because its `skus` query never selects `shelf_life_hours` even though `expiresAt()` reads
it — found during the audit's visual check, not something MiniMax was asked to look at.

**When this changes.** Whenever T2/T3 above get picked up, or if the delegation loop's process
itself needs adjusting based on how this first round actually went (the `self-parallel`-with-a-
`WORKER-SESSION.md`-shaped-brief adaptation in `delegation/README.md` is explicitly unvalidated
until a real run — this is that real run, and it held up).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 31 — First delegated task (T1): `FloorDashboard.tsx` location display name, via MiniMax M3
