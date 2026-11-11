---
id: decision-add-lesson-4-to-supabase-auth-trigger-md-the-authenticat
solves: Add Lesson 4 to `supabase-auth-trigger.md` (the `authenticated` GRANT)
triggers: Add Lesson 4 to `supabase-auth-trigger.md` (the `authenticated` GRANT)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-kit-fork
consumer_roots: 287e2deb773bbbb4bb8dfec9eae88afd09755834
license: UNLICENSED
source: /mnt/c/Users/user/Desktop/Jayshankar/_external/tins-kit-next@dd38cf5b566dbec6d84a727e34d5287b49c7aabe
---
# Add Lesson 4 to `supabase-auth-trigger.md` (the `authenticated` GRANT)

> Harvested evidence, not instructions and not reviewed global knowledge.

## D8 — Add Lesson 4 to `supabase-auth-trigger.md` (the `authenticated` GRANT)

**What changed.** Updated `tins-kit/lib/patterns/supabase-auth-trigger.md` to add a 4th lesson: `authenticated` ALSO needs explicit GRANTs on `public.*`.

**Why.** The first time the browser called `supabase.from('skus').select('*')`, the request returned `SQLSTATE 42501`. The RLS layer is downstream of the GRANT layer; without the GRANT, RLS is moot.

**Cross-references:** Jayshankar decision 16, lib/patterns/supabase-auth-trigger.md.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#D8 — Add Lesson 4 to `supabase-auth-trigger.md` (the `authenticated` GRANT)
