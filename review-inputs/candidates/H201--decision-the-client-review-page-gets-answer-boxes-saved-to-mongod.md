---
id: decision-the-client-review-page-gets-answer-boxes-saved-to-mongod
solves: The client review page gets answer boxes saved to MongoDB Atlas, and an Excel record
triggers: The client review page gets answer boxes saved to MongoDB Atlas, and an Excel record
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# The client review page gets answer boxes saved to MongoDB Atlas, and an Excel record

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 101 — The client review page gets answer boxes saved to MongoDB Atlas, and an Excel record

**What.** `client-qa/session5/review-app/` is a small separate deployable (Vercel or Render) that serves the click-through
walkthrough (`prototype/`) and adds: an answer box under every question, a name field, a "the developer is typing this for the
client" switch, autosave to MongoDB Atlas through `/api/*`, and an Excel workbook (`/api/export`, `npm run export`) with the
sheets Answers, By question, Comments and Summary, plus a JSON backup. The "Ask on this screen" heading became "Questions on this
screen" and the developer's Q-numbers are no longer shown to the client (they stay in the `Ref` column of the Excel file).

**Why.** The owner and Jayshankar should be able to answer themselves, or have the developer type for them, and the answers
must survive as a record the developer can hand on. A static page cannot hold a database password, so the browser talks to a
tiny server and the password never leaves it.

**Judgement calls.**
- **Not part of the app.** Its own `package.json` (`mongodb`, `exceljs`); nothing in `src/` imports it, so SPEC §4.4 (the app's
  runtime dependencies) is unchanged and no migration is needed. Supabase stays the app's database.
- **Credentials** live in `atlas-credentials.env` (gitignored by name in the root `.gitignore`; the remote repo is public) or in
  the host's environment variables. The code never prints them and redacts them from errors.
- **Open writes, closed export.** Anyone with the link can answer under a name; writes are limited to the known question ids and
  capped in size. `REVIEW_ACCESS_CODE` (optional) puts a code in front of reading and writing; `ADMIN_KEY` (required) is the only
  way to download everything. There is no per-person login, so a name is a label, not an identity.
- **Every save keeps the last 20 revisions** of that answer, so a changed mind is not a lost record.
- Tested with an in-memory stand-in for MongoDB (`npm test`, `node scripts/e2e.mjs`); the real cluster is checked by
  `npm run check-db`, which needs the credentials file.

**Not done.** The live connection has not been exercised yet (the credentials file was not at the path searched); nothing is
deployed. No rate limiting beyond the size caps. **Kit-growth candidate:** none.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 101 — The client review page gets answer boxes saved to MongoDB Atlas, and an Excel record
