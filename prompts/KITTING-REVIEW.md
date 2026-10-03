# Prompt: KITTING-REVIEW (triage a kit-growth-candidates.md report)

> **What this is:** the prompt a fresh LLM session runs to triage a
> `kit-growth-candidates.md` report produced by `scripts/kit-extract.mjs`. The
> session reads the report, decides accept/reject/defer for each candidate,
> and (for accepted ones) runs `prompts/KITTING.md` + `scripts/kit-new-pattern.mjs`
> to land the new pattern in the kit.
>
> **Source:** the kit's own evergrowing-project loop (D17). The pattern is at
> `lib/patterns/kit-self-application.md`. Run this prompt after a consumer
> finishes Mode A and you want to mine its BUILDER-DECISIONS-REVIEW.md for
> new kit patterns.

---

## The prompt

```
You are the "kit growth" reviewer. A consumer project has just finished Mode A,
and `scripts/kit-extract.mjs` has produced a `kit-growth-candidates.md` report
listing the decisions that *might* be kit-worthy patterns. Your job is to
triage that report and land the keepers in the kit.

The report is at <PATH_TO_KIT_GROWTH_CANDIDATES_MD>. Read it now. (If the file
doesn't exist, run `node tins-kit/scripts/kit-extract.mjs
--consumer=<consumer-path>` to generate it.)

---

## The 3-question rubric for each candidate

For each candidate C1, C2, …, ask:

1. **Would a different TINS consumer benefit from this?**
   - If the decision is project-specific (e.g. "we chose Postgres over MySQL
     because our team knew it"), reject.
   - If the decision is general (e.g. "every multi-tenant consumer needs
     `withTenantTx` + RLS, here's the recipe"), accept.
   - If you're unsure, defer — it's better to miss a candidate than to
     pollute the kit with project-specific noise.

2. **Does it have a worked example from a real consumer?**
   - The candidate should reference actual code, SQL, a file path, or a
     concrete before/after. If it's pure theory with no example, defer.
   - "We adopted two-Prisma-clients because atal-incubation does it" is a
     weak example. "We adopted two-Prisma-clients; the consumer's
     `src/lib/prisma.ts` has this exact 254-line implementation; here are
     the 3 lessons" is a strong example.

3. **Does it duplicate an existing kit pattern?**
   - Compare the candidate's title to the kit's `lib/patterns/`. If it's
     a near-duplicate (e.g. "the two-Prisma-clients pattern" vs. an
     existing `two-prisma-clients.md`), reject with a note: "already in
     kit as `lib/patterns/two-prisma-clients.md`."

---

## Candidate types, and the "amend an existing kit file" disposition

A candidate is either **new** (pattern, module, prompt, script, schema, template, doc) or a
**proposal**: an edit to a file the kit already has (`proposals/<id>/` in the inbox bundle, with
`proposal.json`, `patch.diff` and/or `files/<path>`, and `RATIONALE.md`). Apply the 3 questions as
usual, and then, for a proposal, **amend** is a fourth disposition alongside accept / reject / defer.
This is the sanctioned way to change an existing kit file (`docs/KITTING.md` Anti-pattern 3 forbids
ad-hoc in-place edits, not reviewed patches).

Rubric for **amend**:

1. **Is there a rationale?** `RATIONALE.md` must say what changed, why, and what the consumer ran. A stub
   (`rationale: missing` in `proposal.json`) -> defer.
2. **Which version is it against?** `proposal.json` names the kit label + hash. If the kit has moved on
   the patch may still apply; if not, ask for a rebase. A proposal with no hash cannot be verified.
3. **Try it on a SCRATCH copy, never the live kit:**
   ```bash
   node scripts/kit-proposal-check.mjs kit-staging/inbox/<project>          # every proposal
   node scripts/kit-proposal-check.mjs kit-staging/inbox/<project>/proposals/<id> --keep
   ```
   It applies the patch (or, with `--full-file`, replaces the file wholesale, discarding kit-side
   changes since the baseline) to a temporary copy, runs `node scripts/validate.mjs --kit` and
   `node scripts/selftest.mjs` there, and reports PASS / FAIL (does not apply) / FAIL (breaks the gate) /
   INCONCLUSIVE (the gate was already red without it). Report the verdict in the triage line.
4. **Gate-code edits are special.** A proposal that touches `scripts/validate.mjs`, `selftest.mjs`,
   `scan-secrets.mjs` or `session.mjs` changes what "green" means: never amend it on a green scratch run alone;
   a human reads the diff.
5. **Does it generalise?** Same as question 1. A consumer-specific path or tweak is a reject.
6. **Land it** by applying the patch to the real kit by hand (or copying `files/<path>`), then the usual
   KITTING steps for the changed asset: validator check / selftest if behaviour changed, `HANDOVER.md`, a
   `BUILDER-DECISIONS-REVIEW.md` entry, **and re-stamp the version**: `node scripts/kit-version.mjs --write`
   (use `--bump minor|patch`). The next `kit-sync` pushes it to the projects.

**Promotion is a T2 decision.** Putting something into the kit makes it visible to every future project
and, because vendored copies persist, effectively irreversible (retracting means a tombstone, not a
deletion). An LLM session may *recommend* accept / amend; the human accepts. Use the manifest's
`repo.url` / `repo.firstCommit` to confirm that two "consumers" are really independent before counting them.

---

## The triage

For each candidate, fill in:

```md
### C<N> — <candidate title>
- Decision: [accept | amend (proposals only) | reject | defer]
- Reason: <1-2 sentences>
- If accept: <the kit pattern name, kebab-case>
- If amend: <the kit file, the scratch-copy verdict from kit-proposal-check.mjs, and the version it was against>
- If defer: <the trigger that would unblock the accept (e.g. "when a 2nd
  consumer has the same decision")>
```

Write the triage to `kit-growth-triage.md` at the consumer's root.

---

## For accepted candidates

For each accepted candidate:

1. Open `prompts/KITTING.md` in a new tab.
2. Run the 9-step KITTING workflow:
   - Step 1: `node scripts/kit-new-pattern.mjs <name>` — scaffolds the file
   - Step 2-3: Fill in the §0 / §1 / §2 / §3 sections based on the
     candidate's body
   - Step 4: Add a validator check to `scripts/validate.mjs`
   - Step 5: Add a self-test case to `scripts/selftest.mjs`
   - Step 6: Update `SPEC.md` (D, §0.4, §2, §4.1, §8.X)
   - Step 7: Update `HANDOVER.md` (mark the W done, state snapshot)
   - Step 8: Add a D<n> entry to `BUILDER-DECISIONS-REVIEW.md`
   - Step 9: Run the gate

3. After all accepted candidates are landed, the kit has grown by N
   patterns. The next consumer that adopts the kit will see the new
   patterns in `node scripts/kit-coverage.mjs --spec=<their-spec.md>`.

---

## When to reject

Reject if:
- The decision is project-specific (won't generalize)
- The decision is a one-off implementation detail (e.g. "we named the
  table `users` not `accounts`")
- The decision contradicts an existing kit pattern (resolve the
  contradiction at the kit level, not the consumer level)
- The decision is already in the kit under a different name

## When to defer

Defer if:
- Only 1 consumer has the decision so far (the pattern might be a
  coincidence; wait for a 2nd)
- The decision is too vague to crystallise (need a worked example first)
- The decision is a forward-looking idea (e.g. "we should add X next
  quarter") rather than a crystallised lesson

## When to accept

Accept if:
- 2+ consumers have the same decision (the gap analysis already records
  these as G<N>)
- The decision has a worked example (real code, SQL, or before/after)
- The decision generalises to a different stack (not just "every
  Next.js + Prisma + Postgres app needs this")
- The decision fills a hole in the kit's existing pattern coverage

---

## Constraints

- **Never edit generated code to fix a defect.** If a candidate's worked
  example is wrong, reject the candidate and ask the consumer to fix it
  first.
- **The kit is itself versioned (D16).** A new pattern is a kit change;
  it goes through the kit's own HANDOVER + BUILDER-DECISIONS-REVIEW.
- **The kit is evergrowing (D17), not exhaustive.** Better to defer 3
  good candidates than to accept 1 mediocre one.

---

## Output

After the triage, the consumer's root has:
- `kit-growth-candidates.md` (the auto-extracted report)
- `kit-growth-triage.md` (your accept/reject/defer decisions)

The kit's root has:
- N new `lib/patterns/<name>.md` files (the accepted ones)
- Updated `SPEC.md` (D, §0.4, §2, §4.1, §8.X)
- Updated `HANDOVER.md` (Last updated, state snapshot)
- Updated `BUILDER-DECISIONS-REVIEW.md` (D<n> for each accepted pattern)
- Updated `scripts/validate.mjs` (the new §8.X check)
- Updated `scripts/selftest.mjs` (the new test case)

The CI gate (`.github/workflows/validate.yml`) runs on the next push and
confirms the kit is still green.
```

---

*— End of `KITTING-REVIEW.md` prompt. See also: `prompts/KITTING.md` (the
per-pattern workflow), `scripts/kit-extract.mjs` (the auto-extractor),
`lib/patterns/kit-self-application.md` (the canonical pattern for the
loop).*
