---
id: decision-removed-the-backend-zs-marker-from-the-spec-header
solves: Removed the `BACKEND` ZS marker from the spec header
triggers: Removed the `BACKEND` ZS marker from the spec header
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Removed the `BACKEND` ZS marker from the spec header

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 1 — Removed the `BACKEND` ZS marker from the spec header

**What changed.** The original SPEC.md had four `<!-- ZS:KEY:VALUE -->` markers in its header:
`COMPLEXITY`, `PLATFORM`, `LANGUAGE`, `BACKEND`. The kit's validator (`tins-kit/scripts/validate.mjs`)
allows only the first three — it fails on any unknown key. Fix: replaced the `BACKEND` line with a
plain HTML comment that says "Backend: Supabase Postgres (recorded in §0.2 D1; not a ZS marker because
the kit's validator only allows COMPLEXITY / PLATFORM / LANGUAGE)."

**Why.** TINS rule: the spec must pass the kit's validator without modifying the kit. The kit
hardcodes the allowed ZS keys as a defensive measure (unknown keys = typos). Removing the marker
loses nothing — the "Supabase is the backend" decision is already in `§0.2 D1` and `§4.1`. The ZS
markers are a machine-readable index, not a documentation surface.

**Impact on downstream.** None. The validator now reports "all ZS: keys are known". Future
Jayshankar sessions don't see `BACKEND` in the header but find the same info in D1.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 1 — Removed the `BACKEND` ZS marker from the spec header
