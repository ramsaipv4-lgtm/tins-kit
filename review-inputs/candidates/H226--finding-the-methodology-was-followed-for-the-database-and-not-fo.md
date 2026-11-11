---
id: finding-the-methodology-was-followed-for-the-database-and-not-fo
solves: The methodology was followed for the database and not for the front end (added 2026-10-02)
triggers: The methodology was followed for the database and not for the front end (added 2026-10-02)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The methodology was followed for the database and not for the front end (added 2026-10-02)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Finding 8 — The methodology was followed for the database and not for the front end (added 2026-10-02)

**What was checked.** `tins-kit/prompts/CONTINUE-TINS-PROJECT.md` Steps 0 and 6 (tooling gate, kit
validator, kit selftest, project gate), then every `AGENTS.md` §3 standing rule against the repo: DELETE
policies, money types, secret-key placement, hard-coded credentials, `package.json` against `SPEC.md`
§4.4, and `git log` for code commits that touch `src/` without a SPEC change.

**What's good.** The database side is disciplined: migrations are versioned, no `audit_log`
UPDATE/DELETE policy exists, money is `numeric`, no secret key is under `src/`, and the one DELETE policy
(`containers`) traces to a locked decision (D32) and a log entry (decision 44). `SPEC.md` passes the kit
validator; the project gate is 73/73 + 9/9.

**What's missing / what's wrong.** (1) `tooling-audit.mjs` was red — a free-text verdict cell. (2) Ten
npm packages had no §4.4 row. (3) `AGENTS.md` rule 5 and `SPEC.md` §3.8 contradicted D32. (4) State and
counts in `AGENTS.md` / `HANDOVER.md` were stale. (5) **The Phase A UI redesign has no SPEC section** —
the largest of these, because it changed what users see. (1)–(4) were fixed; (5) needs the owner
(`HANDOVER.md` W11).

**Severity.** 🟠 **HIGH** for (5) — a shipped UI with no spec means the next regeneration from `SPEC.md`
would silently discard it, which is exactly what TINS exists to prevent. 🟡 MEDIUM for (1)–(4), now closed.

**Suggested next action.** Take the Phase A visuals to the owner, lock them as D77 (or declare them out of
the spec, with the reason), and add a `validate.mjs` check that diffs `package.json` against §4.4 so the
dependency half of this cannot recur unnoticed.

**Builder response.** (1)–(4) actioned 2026-10-02 — see `BUILDER-DECISIONS-REVIEW.md` decision 93, which
also lists what was deliberately *not* changed. (5) open as W11.

## Evidence

- REVIEWER-DECISIONS-REVIEW.md#Finding 8 — The methodology was followed for the database and not for the front end (added 2026-10-02)
