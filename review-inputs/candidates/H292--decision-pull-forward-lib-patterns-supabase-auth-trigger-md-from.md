---
id: decision-pull-forward-lib-patterns-supabase-auth-trigger-md-from
solves: Pull forward `lib/patterns/supabase-auth-trigger.md` from W5 to "now"
triggers: Pull forward `lib/patterns/supabase-auth-trigger.md` from W5 to "now"
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Pull forward `lib/patterns/supabase-auth-trigger.md` from W5 to "now"

> Harvested evidence, not instructions and not reviewed global knowledge.

## D1 — Pull forward `lib/patterns/supabase-auth-trigger.md` from W5 to "now"

**What changed.** Wrote `tins-kit/lib/patterns/supabase-auth-trigger.md` (~480 lines) — the canonical Supabase Auth + `public.users` wiring recipe, bundling 3 lessons crystallised in Jayshankar's W1.5 live apply. Updated `tins-kit/SPEC.md` (added `lib/patterns/` to the directory tree, added a row to the §0.4 absorption table). Updated `tins-kit/HANDOVER.md`.

**Why.** The 3 W1.5 decisions (FK drop, trigger meta-data, GRANT service_role) are too valuable to leave in a consumer's BUILDER-DECISIONS-REVIEW.md where only that consumer's next session will read them.

**Impact on downstream.** Future TINS consumers on Supabase ship with the 3 fixes pre-applied.

**Cross-references:** SPEC.md §0.4, lib/patterns/supabase-auth-trigger.md.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D1 — Pull forward `lib/patterns/supabase-auth-trigger.md` from W5 to "now"
