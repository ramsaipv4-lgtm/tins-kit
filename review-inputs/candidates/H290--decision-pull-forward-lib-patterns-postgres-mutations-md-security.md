---
id: decision-pull-forward-lib-patterns-postgres-mutations-md-security
solves: Pull forward `lib/patterns/postgres-mutations.md` (SECURITY DEFINER pattern)
triggers: Pull forward `lib/patterns/postgres-mutations.md` (SECURITY DEFINER pattern)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Pull forward `lib/patterns/postgres-mutations.md` (SECURITY DEFINER pattern)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D4 — Pull forward `lib/patterns/postgres-mutations.md` (SECURITY DEFINER pattern)

**What changed.** Wrote `tins-kit/lib/patterns/postgres-mutations.md` (~310 lines).

**Why.** The transfer form was the first user action that touched 2 tables with different RLS policies. The function approach is the only one that gives race-condition safety AND RLS bypass AND a clean error message.

**Cross-references:** SPEC.md §0.4, lib/patterns/postgres-mutations.md, Jayshankar decision 23.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D4 — Pull forward `lib/patterns/postgres-mutations.md` (SECURITY DEFINER pattern)
