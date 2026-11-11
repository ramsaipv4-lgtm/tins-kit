---
id: decision-regenerated-jayshankar-clean-found-and-fixed-real-gaps-i
solves: Regenerated `Jayshankar-clean`; found and fixed real gaps in the kit's own publish tooling
triggers: Regenerated `Jayshankar-clean`; found and fixed real gaps in the kit's own publish tooling
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Regenerated `Jayshankar-clean`; found and fixed real gaps in the kit's own publish tooling

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 56 — Regenerated `Jayshankar-clean`; found and fixed real gaps in the kit's own publish tooling

**What changed.** User asked for the checklist plus the actual regenerated `Jayshankar-clean`
content, referencing `tins-kit/prompts/PUBLISH-OPEN-SOURCE.md` for how they want the scrub done.
Ran the kit's real `private-to-public.mjs` copy+scan tool rather than a manual copy — and found
it had never actually been exercised against a codebase this size before. Six real bugs/gaps
fixed in the kit itself (not one-off Jayshankar patches — general, selftest-covered, benefit
every future TINS project's public release):

1. `../` path-escape check flagged every ordinary relative import (`'../lib/auth'`) — narrowed
   to doc/text files only, and to 2+ consecutive segments (single-level intra-repo links are
   never actually a leak given this project's flat directory depth).
2. Bare single-word banned terms (`TINS`) matched as a substring anywhere — false-positived
   inside `custInsert` (`cus-TINS-ert`). Fixed to word-boundary matching for bare words.
3. `validate.mjs`/`selftest.mjs` are irreducibly SPEC.md-coupled (they check conformance against
   a file that never exists in the public tree) — excluded by name; `package.json`'s `scripts`
   entries for both are now mechanically stripped at copy time (found the destination-only fix
   getting silently clobbered by the very next re-copy — same pitfall the pattern doc's own §8.5
   already named).
4. `docs/W*-*.md` (build-phase verification checklists) are a methodology fingerprint by naming
   convention alone — excluded.
5. `.gitignore` is no longer blindly copied (the private one's own explanatory prose doesn't
   belong in public) — now authored once via a bundled default, preserved (not clobbered) on
   every future re-run, the same category as README/CONTRIBUTING.
6. `supabase/functions/**` and `capacitor.config.ts` were missing from `INCLUDE_PATTERNS`
   entirely — Edge Functions and Capacitor didn't exist as artefact types when the kit's list was
   written; the Edge Function and Android config were silently never reaching the public copy.

Also added a mechanical `CONTENT_REWRITES` step (same mechanism as the existing marker-line
rewrite) that turns `SPEC.md §X.Y` / `BUILDER-DECISIONS-REVIEW.md` / `HANDOVER.md` citations into
generic prose at copy time — ~40 such citations exist across this codebase's comments by design
(the standing "point at the spec, don't duplicate it" convention), and hand-editing them at the
source would have either fought that convention or needed redoing by hand on every future
regeneration.

**Also fixed at the source (private repo), genuinely, not just for the public copy:** an absolute
Windows path in two setup docs (non-portable for any reader, not just a public-scrub concern),
and a migration comment citing a kit pattern file by name, reworded to keep the substantive
Supabase GRANT-defaults gotcha without the methodology citation.

**Not yet done: syncing these kit fixes back to the canonical `tins-kit` this project's copy was
vendored from.** They currently exist only in `Jayshankar/tins-kit/` (this project's own vendored
copy) — the kit's own `kit-sync.mjs`-style propagation to the canonical source and other TINS
projects is a real, separate step the user needs to decide on and run themselves.

**License:** confirmed against the private repo's own pre-existing README ("UNLICENSED —
proprietary") rather than guessed — carried the same stance into the public copy as an explicit
"proprietary, all rights reserved, shared for reference/portfolio purposes" statement, not an
open-source license grant.

**Verified before handing back:** the regenerated `Jayshankar-clean` scans clean
(`--scan-only`), and `npm run typecheck && npm run build` both pass inside the destination
itself, not just the private repo.

**Cross-reference:** `tins-kit/scripts/private-to-public.mjs`, `tins-kit/scripts/selftest.mjs`
(55 tests, all green), `tins-kit/lib/patterns/private-to-public.md`; `Jayshankar-clean/` (all
docs); `docs/DEPLOY-NETLIFY.md`, `docs/SUPABASE-SETUP.md`,
`supabase/migrations/0004_grant_authenticated.sql`.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 56 — Regenerated `Jayshankar-clean`; found and fixed real gaps in the kit's own publish tooling
