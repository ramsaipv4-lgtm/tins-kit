---
id: decision-fourth-delegated-task-t4-wcag-contrast-checker-via-minim
solves: Fourth delegated task (T4): WCAG contrast checker, via MiniMax M3
triggers: Fourth delegated task (T4): WCAG contrast checker, via MiniMax M3
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Fourth delegated task (T4): WCAG contrast checker, via MiniMax M3

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 35 — Fourth delegated task (T4): WCAG contrast checker, via MiniMax M3

**What changed.** New file, `scripts/check-contrast.mjs` — a zero-dependency Node ESM script
implementing the real WCAG 2.x relative-luminance/contrast-ratio formula, matching the style of
`scripts/validate.mjs`/`scripts/selftest.mjs`. Checks a hardcoded 16-pair default palette (this
project's actual Tailwind colors, taken from `src/`) and exits non-zero if any pair fails AA-normal
(ratio < 4.5). Exports `relativeLuminance`, `contrastRatio`, `checkPalette`, and `PALETTE` so the
functions are reusable, not just runnable from the CLI. This closes the gap flagged in decision
#32: `SPEC.md` §6 requires WCAG 2.1 AA, and until now nothing in the codebase checked it.

**Who built it, and how it was verified.** MiniMax M3 (`delegation/tasks/T4-contrast-checker/`).
The brief baked in a mathematically-verifiable known answer (black-on-white must compute to
exactly 21.0; the palette's 3 real failures and their exact ratios were pre-computed and given as
the expected output) specifically so both MiniMax and the auditor could check the implementation
against ground truth rather than each other's say-so. Both did: MiniMax's self-check matched, and
the auditor independently re-ran every mode (`--self-check`, default palette, `--help`, a
deliberate bad-argument case, and a direct programmatic `import()` of the exported functions) —
all matched exactly, including cross-referencing one ratio (`text-slate-500 on white` = 4.76)
against WebAIM's own contrast checker. This is the first task in the round with zero discrepancies
between the worker's self-report and the auditor's independent findings.

**Bonus fix, same commit, not MiniMax's work.** Two unused imports (`existsSync`, `readFileSync`
from `node:fs`) sat unreferenced in the file — harmless (outside `src/`, so `tsc` never sees it;
no lint step in this project's gate either), but the same class of dead-code cruft as decision
#31's fix. Removed.

**What this finds, and what it doesn't fix.** The palette check is real, not decorative: `text-
slate-400` (fg `94A3B8`) against white or `slate-50`, and `text-slate-300` (fg `CBD5E1`) against
white, both fail WCAG AA for normal text right now, in the actual shipped UI. This task deliberately
only builds the detector — remediating those colors, and deciding whether `check-contrast.mjs`
should be wired into `validate.mjs` as a real gate check (both explicitly out of scope per the
brief), are undone, logged follow-ups.

**Round status.** This was the last task in the round — `delegation/LEDGER.md` has no more
`assigned`/`proposed` rows. Four for four integrated (T1–T4), the loop validated itself on real
work, and it caught one real, non-trivial pre-existing bug (decision #34) along the way that
neither `validate.mjs` nor a surface read of the diff would have found.

**When this changes.** Whenever the user wants the 3 failing colors actually remediated, or wants
`check-contrast.mjs` wired into the gate — both logged, neither queued.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 35 — Fourth delegated task (T4): WCAG contrast checker, via MiniMax M3
