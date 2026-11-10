# Initial workspace harvest inventory

Harvested read-only on 2026-11-09. These are **review candidates, not promoted global knowledge**.

| Source project | Candidates | Secret-scanned skips | Narrative documents inventoried | Git-backed |
|---|---:|---:|---:|---|
| `excalidraw` | 5 | 0 | 2 | Yes |
| `Jayshankar` | 132 | 1 | 16 | Yes |
| `tins-lms` | 15 | 0 | 327 | Yes |
| `tins-kit-fork` | 58 | 1 | 1 | Yes |
| `tins-sandbox/demo` | 25 | 1 | 1 | Yes |
| `TINS-projects/atal-incubation` | 23 | 1 | 1 | No |
| `atal-incubation/exam-forge` | 20 | 1 | 1 | No |
| `atal-incubation/incubos` | 20 | 1 | 55 | Yes |
| `atal-incubation/Data-cleaning-script` | 20 | 1 | 0 | No |
| `atal-incubation/package5` | 20 | 1 | 0 | No |
| `atal-incubation/vikas-FDP-AI-for-educators` | 21 | 1 | 0 | No |
| **Total** | **359** | **9** | **404** | **6 Git-backed / 5 unversioned** |

Every secret-scanned skip is a copy of the same `supabase-auth-trigger` pattern section containing demo credential assignments. The values were not printed or copied into a candidate. The conservative skip remains until a human produces and reviews a sanitized version.

## Where the review queues live

Bundles are under `D:\tins-kit\tins-kit-next\inbox\harvest-*\`. Open each bundle's `REVIEW.md`. The inbox is deliberately gitignored and excluded from recall.

Notable additional sources now included:

- Excalidraw C1–C5: named handoff, merged-task status, task abandonment/rename, shared `node_modules`, and resource/disk tracking.
- `tins-lms` integration journal: parallel-team route/navigation ownership, merged-environment dependency drift, build-output coupling, and measuring the correct performance boundary.
- Legacy pattern libraries across the atal-incubation sources, including unversioned projects whose evidence cannot count toward `active` status.

No source repository was initialized, edited, or committed by the harvester.
