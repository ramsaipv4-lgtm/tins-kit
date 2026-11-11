---
id: decision-frontend-scaffold-hand-written-not-npm-create-vite-lates
solves: Frontend scaffold: hand-written, not `npm create vite@latest`
triggers: Frontend scaffold: hand-written, not `npm create vite@latest`
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Frontend scaffold: hand-written, not `npm create vite@latest`

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 14 — Frontend scaffold: hand-written, not `npm create vite@latest`

**What changed.** W2 ships 12 hand-written files: `package.json`, `tsconfig.json`,
`vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `index.html`,
`.env.example`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, plus the lib/
components/pages/. `npm create vite@latest` was NOT used.

**Why.** `npm create vite@latest` produces a project that:
1. Ships `@types/node` (we don't need it; Vite handles the runtime).
2. Ships a 2-tsconfig setup (`tsconfig.json` + `tsconfig.node.json` with project
   references) that's correct for big apps but over-engineered for V1.
3. Doesn't ship Tailwind, so we'd add it on top anyway.
4. Ships the React + TS logos and counter demo, which we'd delete.

The hand-written scaffold:
1. Uses the exact dependency set in SPEC §4.1 (Vite 5, React 18, TS 5, Tailwind 3,
   Supabase JS 2, react-router-dom 6, react-query 5). No `lodash`, no `dotenv`,
   no `moment`, no `axios` (per SPEC §3.5 forbidden list).
2. Uses HashRouter (per SPEC §0.2 / §4.1) — `npm create vite@latest` doesn't
   pick a router, so we'd add it either way.
3. Has the role-based router baked in from the start (no "add react-router later"
   refactor).
4. Total file count: 12 (vs ~15 from the scaffolder, before the unnecessary
   ones are deleted).

**Trade-off accepted.** We lose the "official Vite template is the default"
boilerplate. We gain: zero `npm create` output to clean up, no leftover
counter-demo to delete, no logo to remove, the locked stack enforced by
the package.json we wrote (not the one the scaffolder picked).

**Impact on downstream.** The repo is clean. `npm install` + `npm run dev` works
out of the box. New contributors see a focused repo, not "Vite + our customisations
on top." If the user wants a different default (e.g. switch to wouter, switch
to Bun), one file changes (`package.json` + `src/main.tsx`).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 14 — Frontend scaffold: hand-written, not `npm create vite@latest`
