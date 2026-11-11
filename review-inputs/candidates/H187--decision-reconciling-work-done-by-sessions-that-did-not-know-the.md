---
id: decision-reconciling-work-done-by-sessions-that-did-not-know-the
solves: Reconciling work done by sessions that did not know the TINS methodology
triggers: Reconciling work done by sessions that did not know the TINS methodology
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Reconciling work done by sessions that did not know the TINS methodology

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 93 — Reconciling work done by sessions that did not know the TINS methodology

**What changed.** A methodology audit (`tins-kit/prompts/CONTINUE-TINS-PROJECT.md` Steps 0 and 6, then the
standing rules in `AGENTS.md` §3 checked one by one against the repo) found the following, all now
reconciled **in the spec and the docs — no generated code was edited**:

1. **Gate was red.** `node tins-kit/scripts/tooling-audit.mjs` exited 1: a verdict cell in
   `TOOLING-AUDIT.md` carried a sentence instead of `SAFE`. Fixed; gate green. (`validate` 10/10 kit +
   73/73 project, `selftest` 9/9, the kit's own selftest 56/56 *when run from `tins-kit/`* — run from the
   project root it reports 41 false failures, because it resolves `scripts/validate.mjs` from `cwd` and so
   tests this project's validator instead of the kit's. **Kit-growth candidate:** the kit's selftest
   should resolve its siblings from `import.meta.url`, not `process.cwd()`.)
2. **Ten packages in `package.json` with no `SPEC.md` §4.4 row** (rule 2): `fuse.js` (search, D44), the
   shadcn/Radix layer (`@radix-ui/react-slot`, `@radix-ui/react-collapsible`, `class-variance-authority`,
   `clsx`, `tailwind-merge`, `tailwindcss-animate`), `lucide-react`, `@capacitor/cli`, `playwright` (dev).
   Rows added to §4.4, each with its actual use read from the imports; audit row added to
   `TOOLING-AUDIT.md`. Also recorded the reverse drift: `zod` is listed but never adopted, `wouter` was
   not chosen (`react-router-dom` + `HashRouter`, which the row permits), `vite-plugin-pwa` is 1.x not 0.20.x.
3. **A DELETE policy against rule 5.** `containers_delete_admin` (migration `0011`) is authorised by the
   locked **D32** and was logged as decision 44 — so the *process* was followed — but `AGENTS.md` rule 5
   and `SPEC.md` §3.8 still said "never / no DELETE on any table". Both now state the single recorded
   exception and why the FK still protects fill history. No other DELETE policy exists anywhere under
   `supabase/`; `audit_log` has none.
4. **Stale counts and state.** `HANDOVER.md` said §8 has 31 criteria (the validator counts 58); `AGENTS.md`
   §0 said "built: the SPEC, nothing else yet" with 46 migrations and two decks in the tree; `AGENTS.md`
   rule 2 pointed at SPEC §4.1 for the package list (it is §4.4). Corrected.

**Why.** The user reported that some sessions built on this repo without understanding the TINS
methodology. *The following is inferred from the git history and the files, not from any session record:*
the pattern in what was missed is consistent — "spec first" was followed for
**schema and RPCs** (D-numbers, migrations, decisions — the migrations and RPCs I sampled each cite a locked
decision or a log entry; I did not check all 46) and skipped it for **front-end and tooling** (a component layer, an icon set, a search library
added with the feature, not with a spec row). The rule they broke is rule 2's *timing*, and rule 1's scope
("edit SPEC.md and regenerate") for UI work.

**What was deliberately NOT done, and why.**
- **No decision was added to `SPEC.md` §0.2 for the Phase A UI redesign.** That is a locked-decision
  change, which `AGENTS.md` §4 puts under *Ask first*, and the content (the 12 client-locked visuals, the
  tile-grid home, the shadcn layer as the app's component base) is the client's and the user's to confirm,
  not mine to infer from commit messages. It is the **one real open item** this reconciliation leaves:
  commits `3cd0bd5` and `be38941` (RepDashboard, Layout, NotificationBell) changed the shipped UI with no
  SPEC section behind them. D63–D76 are reserved/proposed by the v3/v4 amendments, so the next free
  number is **D77**; propose it, do not take it silently. Tracked as `HANDOVER.md` W11.
- **`@capacitor/cli` was not moved to `devDependencies`**, and `package.json`/the lockfile were not
  touched — a docs reconciliation should not change what installs. Noted in §4.4 for the next real edit.
- ~~**The #67–#89 gap in this log was not back-filled.**~~ **Corrected later the same day (see decision 98):
  there is no such gap.** Every heading #1–#98 exists, contiguous. What was skipped *in the moment* was the
  write-up of the video-sprint work, which decision #90 then back-filled retroactively; the claim above conflated
  the two. It was copied into `AGENTS.md`, `NEXT-AGENT-ONBOARDING.md` and two kit-growth drafts before a reviewer
  checked it against the file; all four are corrected.
- **`scripts/.env` holds a live `sb_secret_…` key.** It is gitignored and untracked, so it is not a rule-12
  breach, but AGENTS.md's own rule is that a key saved to a shared file is burned. Whether this Windows
  desktop path counts as shared is the owner's call — **rotate it if in doubt**; not touched here.

**Impact on downstream.** `npm run validate`, `npm run selftest` and the tooling gate are all green. A
future session that adds a package now finds the rule and the table agree on the section number and on the
timing. A future session that wants another DELETE policy finds that rule 5 requires a locked decision first.

**Kit-growth candidates (`AGENTS.md` §6):** (a) the kit's selftest's `cwd` dependence, above; (b) the kit's
`templates/TOOLING-AUDIT.md` lists the three verdict values but does not say the cell must contain *only*
the bare word, which `tooling-audit.mjs` enforces — one sentence would have prevented the red gate; (c) a validator check that diffs
`package.json` against the §4.4 table would have caught item 2 mechanically, at the commit that introduced
each package (the project's `validate.mjs` could add it now; not done here because a new check needs a
matching self-test case, D24, and that is its own W).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 93 — Reconciling work done by sessions that did not know the TINS methodology
