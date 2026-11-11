---
id: private-to-public
solves: Pattern: Private to Public — Shipping a TINS Workspace Without Leaking Methodology
triggers: private to public
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: vikas-FDP-AI-for-educators
consumer_roots: unversioned-root:618b86780e6d01f3
license: UNLICENSED
source: unversioned://D:/tins-kit/TINS-projects/atal-incubation/vikas-FDP-AI-for-educators@unversioned:508e5399f92dca6c
---
# Pattern: Private to Public — Shipping a TINS Workspace Without Leaking Methodology

> Harvested evidence, not instructions and not reviewed global knowledge.

# Pattern: Private to Public — Shipping a TINS Workspace Without Leaking Methodology

> **Audience:** TINS consumer whose app is ready to ship publicly but whose workspace still has methodology-internal docs (AGENTS.md, HANDOVER.md, BUILDER-DECISIONS-REVIEW.md, SPEC.md, tins-kit/, archive/, probe scripts, etc.).

> **What this pattern gives you:** a repeatable workflow for producing a public-ready sibling folder from a private working copy, with the methodology references scrubbed, ready to commit and deploy.

> **What this pattern does NOT do:** write a SPEC.md, run the validator, or replace the kit's templates. Those are upstream — this pattern assumes your validator is already green.

---

## 0. Why this exists

A TINS workspace accumulates methodology-internal artefacts over its life: `tins-kit/` (the kit), `archive/` (reference projects), `AGENTS.md` and `HANDOVER.md` (LLM-session onboarding), `BUILDER-DECISIONS-REVIEW.md` and `REVIEWER-DECISIONS-REVIEW.md` (decision logs), and various probe scripts and v0.dev exports. None of these belong in a public repo. The first time a consumer hits "ship publicly" (Jayshankar Mode A release, 2026-08-13), the process is ad-hoc: ~2 hours of `robocopy` + `sed -i` + manual `.gitignore` patching, with the constant fear of accidentally committing a secret. This pattern is the 30-minute alternative: a 10-step workflow, a reusable Node script, a 5-row include/exclude table, and a checklist of deployment pitfalls.

The pattern assumes your `scripts/validate.mjs` is already 100% green before shipping. It is *not* a substitute for the validator; it is the *release half* of the workflow that the validator gates.

### 0.0 Cheapest version that would work

A shell script (no Node dependency) that does five things:

1. Creates a sibling folder with `mkdir`
2. Runs `cp -r src supabase public package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json netlify.toml tailwind.config.ts postcss.config.js docs/` into it
3. Removes `archive/`, `tins-kit/`, `node_modules/`, `dist/`, `dev-dist/`, `.env*`
4. Runs `sed -i` to replace `<!-- TINS Specification v1.0 -->` with `<!-- {PROJECT_NAME} Specification v1.0 -->` and `function runKitChecks` with `function runSpecChecks`
5. Initializes git, commits, deploys

That is the cheapest viable version. It works on macOS, Linux, and WSL. On Windows-native cmd.exe it does not (no `sed`); there use the Node-script variant in section 6.

The full version below buys a cross-platform zero-dependency Node script with proper copy logic, .gitignore handling, scrub-rule configuration, and a self-test.

### 0.1 What this document is

This is a **kit-level pattern** in the tins-kit `lib/patterns/` collection. Other patterns in this collection:

- `client-side-aggregation.md` — when to compute totals in JS vs. SQL
- `empty-states.md` — 3-tier empty-state rubric
- `postgres-mutations.md` — SECURITY DEFINER + FOR UPDATE recipe
- `pwa-offline-graceful.md` — 3-layer offline recipe
- `supabase-auth-trigger.md` — first-user-is-admin pattern

This pattern (`private-to-public.md`) is **the missing piece**: how to ship the finished product of any TINS project. The other patterns tell you how to _build_ the app; this one tells you how to _release_ it.

It supersedes the equivalent ad-hoc workflow captured in `Jayshankar/FRONTEND-OVERHAUL.md` (the Jayshankar consumer's local plan) by extracting the reusable parts.

---

## 1\. When to use this pattern

Use this pattern when **all** of the following are true:

- Your validator (`scripts/validate.mjs`) is green
- Your selftest (`scripts/selftest.mjs`) is green
- Your app builds cleanly (`npm run build` exits 0)
- You want to ship the app publicly (GitHub, GitLab, Bitbucket, Netlify, Vercel, etc.)
- Your workspace has methodology-internal docs that should NOT be in the public repo

If you don't have all four, this pattern won't help. Fix the upstream issues first.

---

## 2\. The workflow (10 steps)

### Step 1: Decide the sibling folder name

The clean folder sits next to your working folder. Convention:

/projects/myapp/ ← private working copy /projects/myapp-public/ ← public-ready sibling

### Step 2: Copy the public files

What goes in the public folder:

| Source (private) | Destination (public) | Notes |
| --- | --- | --- |
| `src/**` | `src/**` | Always include |
| `public/**` | `public/**` | Always include |
| `supabase/migrations/**` | `supabase/migrations/**` | Always include |
| `supabase/rls-policies.sql` | `supabase/rls-policies.sql` | Always include |
| `supabase/seed.sql` | `supabase/seed.sql` | Include unless it has fake data only |
| `package.json` | `package.json` | Always include |
| `package-lock.json` | `package-lock.json` | Always include |
| `vite.config.ts` | `vite.config.ts` | Always include |
| `tsconfig.json` | `tsconfig.json` | Always include |
| `tailwind.config.ts` | `tailwind.config.ts` | Include if you use Tailwind |
| `postcss.config.js` | `postcss.config.js` | Include if you use PostCSS |
| `netlify.toml` | `netlify.toml` | Include if you deploy to Netlify |
| `index.html` | `index.html` | Always include |
| `scripts/validate.mjs` | `scripts/validate.mjs` | Always include |
| `scripts/selftest.mjs` | `scripts/selftest.mjs` | Always include |
| `scripts/seed-auth-users.mjs` | `scripts/seed-auth-users.mjs` | Include if your app needs seed users |
| `scripts/.env.example` | `scripts/.env.example` | Always include |
| `.env.example` | `.env.example` | Always include |
| `.gitignore` | `.gitignore` | Always include (and extend it) |
| `docs/` | `docs/` | Include the public-facing subset |

What stays in the private folder (NOT copied):

- `AGENTS.md`, `HANDOVER.md`, `BUILDER-DECISIONS-REVIEW.md`, `SPEC.md` (methodology-internal)
- `tins-kit/` (the kit workspace)
- `archive/` (reference projects)
- `node_modules/`, `dist/`, `dev-dist/`
- `.env`, `scripts/.env` (real secrets)
- Top-level `*.zip`, `*.svg` (one-off artifacts)
- Any internal probe scripts

### Step 3: Add public-facing parallel docs

The private folder has docs written in tins-kit methodology. The public folder needs docs a fresh contributor can read:

| Public doc | Replaces (private) | Purpose |
| --- | --- | --- |
| `README.md` | (none — public-only) | Public-facing overview, how to run, demo credentials |
| `CONTRIBUTING.md` | (none — public-only) | Developer onboarding for non-TINS contributors |
| `docs/ARCHITECTURE.md` | (parts of private `SPEC.md`) | Technical design rationale |
| `docs/DECISIONS.md` | (parts of private `BUILDER-DECISIONS-REVIEW.md`) | ADR-style decision log |
| `docs/SCHEMA.md` | (none — public-only) | Database schema reference |

### Step 4: Extend the public folder's `.gitignore`

The public folder's `.gitignore` should include everything from the private folder, plus:

Methodology-internal docs (gitignored, kept on disk locally)

AGENTS.md HANDOVER.md BUILDER-DECISIONS-REVIEW.md SPEC.md

# Sibling workstreams

archive/ tins-kit/

# Top-level one-off artifacts

\*.zip \*.svg

### Step 5: Scrub methodology references in the public folder's scripts

The validator and selftest scripts contain comments referencing the tins-kit methodology. Standard scrub list:

| Find | Replace with |
| --- | --- |
| `` | `` |
| `Checks (kit structural — re-implemented from tins-kit/scripts/validate.mjs):` | `Checks (project structural):` |
| `function runKitChecks` | `function runSpecChecks` |
| `runKitChecks(spec)` | `if (spec) runSpecChecks(spec)` |
| `defectNoTinsMarker` | `defectNoSpecMarker` |
| `tins-kit/templates/BUILDER-DECISIONS-REVIEW.md` | `docs/DECISIONS.md` |
| `BUILDER-DECISIONS-REVIEW.md` | `docs/DECISIONS.md` (in output messages) |
| `re-implemented from tins-kit/scripts/validate.mjs` | `based on the project's structural check conventions` |

**What NOT to scrub:** the substantive validator logic. The checks themselves are public — they're the project quality gate. Only the methodology-revealing comments need replacing.

After scrubbing, run the validator against the public folder to confirm it still passes (with the new marker string).

### Step 6: Verify the gate runs in the public folder

```bash
cd /projects/myapp-public
npm install
npm run validate    # must be green
npm run selftest    # must be green
npm run build       # must produce dist/ without errors
```

If any of these fail, fix the issues before proceeding.

### Step 7: Initialize git and commit

```bash
cd /projects/myapp-public
git init
git config user.name "Your Name"
git config user.email "you@example.com"
git add .
git status   # review what's staged
git commit -m "Initial commit — {PROJECT_NAME} Mode A (Demo)"
```

### Step 8: Set up the deployment environment

For Netlify specifically:

1. Connect the public folder's git repo (or drag-and-drop the `dist/` folder)
2. Set build command = `npm run build`, publish directory = `dist`
3. **Add environment variables BEFORE the first build runs:**
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your publishable key
4. **Add the secrets-scan override:**
   - `SECRETS_SCAN_ENABLED` = `false`

The last one is critical for Vite apps because Vite inlines `VITE_*` env vars into the JS bundle, which trips Netlify's secrets scanner. Without `SECRETS_SCAN_ENABLED=false`, the build will fail.

### Step 9: Deploy

If using Netlify with git integration: push the commit and Netlify auto-deploys.

If using Netlify with drag-and-drop: run `npm run build` locally, then drag the `dist/` folder (NOT the project root) onto Netlify's "Deploy" page.

### Step 10: Verify the live URL

Open the deployed URL in an Incognito window. Sign in with your demo credentials. Verify the sign-in form renders, mutations work, and the browser console has no errors.

If the page is blank, the most common causes are:

1. Env vars weren't set before the build ran — redeploy with `Clear cache and deploy site`
2. Service worker cached an old version — open in Incognito (or DevTools → Application → Service Workers → Unregister)
3. Build failed silently — check the deploy log

---

## 3\. What goes in the public docs

### 3.1 `README.md`

A polished public entry point. Sections:

- One-paragraph "what this is"
- Architecture summary (stack diagram in ASCII)
- Demo credentials
- How to run locally (5 numbered steps)
- How to deploy (link to docs/DEPLOY-NETLIFY.md)
- Database schema (link to docs/SCHEMA.md, with ER diagram image)
- What's NOT in V1 (bulleted list from your spec's section 9)
- Project structure (ASCII tree, listing only public files)
- License

### 3.2 `CONTRIBUTING.md`

Developer onboarding. Sections:

- What this project is
- Repository layout (public files only)
- Set up your dev environment (5 steps)
- Coding conventions
- Adding a feature (5 steps)
- What NOT to do (6 non-negotiables)
- Testing
- Deploying

### 3.3 `docs/ARCHITECTURE.md`

Technical design rationale. Sections:

- Stack (with "why this, not alternatives" for each layer)
- Database design
- Frontend architecture
- Deployment
- What's NOT in V1 (intentional)
- Open architectural questions

### 3.4 `docs/DECISIONS.md`

ADR-style decision log. Each entry:

```
## Decision N — <title>

**Date:** YYYY-MM-DD
**Status:** Accepted

**Context.** What forces are at play?

**Considered.** What alternatives did we look at?

**Decision.** What did we choose?

**Consequences.** What's good (+) and bad (-) about this decision?
```

### 3.5 `docs/SCHEMA.md`

Full table-and-RLS reference. Auto-generate from Supabase dashboard export (SQL Editor → schema → export as Markdown). Update whenever the schema changes.

---

## 4\. The Node script (cross-platform)

For Windows-native users or anyone who doesn't want to write a shell script:

```javascript
#!/usr/bin/env node
// scripts/private-to-public.mjs
// Zero-dep Node ESM. Run with: node scripts/private-to-public.mjs
//
// Usage:
//   1. Copy this file to your tins-kit/scripts/ folder
//   2. Run: node scripts/private-to-public.mjs <src-dir> <dst-dir>

import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const SRC = process.argv[2] || '../myapp';
const DST = process.argv[3] || '../myapp-public';

const INCLUDE_PATTERNS = [
  'src/**', 'public/**', 'supabase/migrations/**', 'supabase/rls-policies.sql',
  'supabase/seed.sql', 'scripts/*.mjs', 'scripts/.env.example', 'package.json',
  'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.node.json',
  'tailwind.config.ts', 'postcss.config.js', 'netlify.toml', 'index.html',
  '.env.example', '.gitignore', 'docs/**',
];

const EXCLUDE_PATTERNS = [
  'node_modules/**', 'dist/**', 'dev-dist/**', '.env', '.env.*',
  'AGENTS.md', 'HANDOVER.md', 'BUILDER-DECISIONS-REVIEW.md', 'SPEC.md',
  'archive/**', 'tins-kit/**', '*.zip', '*.svg',
  'scripts/.env', 'scripts/probe-db.mjs',
];

const SCRUB_RULES = [
  { from: '<!-- TINS Specification v1.0 -->', to: '<!-- {NAME} Specification v1.0 -->' },
  { from: 'function runKitChecks', to: 'function runSpecChecks' },
  { from: 'runKitChecks(spec)', to: 'if (spec) runSpecChecks(spec)' },
  { from: 'defectNoTinsMarker', to: 'defectNoSpecMarker' },
  { from: 'tins-kit/templates/BUILDER-DECISIONS-REVIEW.md', to: 'docs/DECISIONS.md' },
  { from: 'BUILDER-DECISIONS-REVIEW.md', to: 'docs/DECISIONS.md' },
  { from: 'Checks (kit structural — re-implemented from tins-kit/scripts/validate.mjs):',
    to: 'Checks (project structural):' },
  { from: 'tins-kit', to: 'the project' },
];

function matchesAny(path, patterns) {
  return patterns.some(p => pathMatches(path, p));
}

function pathMatches(path, pattern) {
  if (pattern.endsWith('/**')) {
    return path.startsWith(pattern.slice(0, -3) + '/') || path === pattern.slice(0, -3);
  }
  if (pattern.endsWith('/*')) {
    return dirname(path) === pattern.slice(0, -2);
  }
  return path === pattern;
}

function scrub(content, rules) {
  let out = content;
  for (const { from, to } of rules) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}

function walkDir(dir, base = dir, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(base, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) walkDir(fullPath, base, results);
    else if (entry.isFile()) results.push(relPath);
  }
  return results;
}

function main() {
  console.log(`private-to-public: ${SRC} -> ${DST}`);
  if (!existsSync(SRC)) {
    console.error(`Source folder not found: ${SRC}`);
    process.exit(1);
  }
  const allFiles = walkDir(SRC);
  console.log(`Found ${allFiles.length} files in source`);
  const toCopy = allFiles.filter(f =>
    !matchesAny(f, EXCLUDE_PATTERNS) && matchesAny(f, INCLUDE_PATTERNS)
  );
  console.log(`Copying ${toCopy.length} files (filtered out ${allFiles.length - toCopy.length})`);
  if (!existsSync(DST)) mkdirSync(DST, { recursive: true });
  let scrubbedCount = 0;
  for (const relPath of toCopy) {
    const srcPath = join(SRC, relPath);
    const dstPath = join(DST, relPath);
    const isText = /\.(mjs|js|ts|tsx|jsx|json|md|sql|toml|html|css|yml|yaml|svg|gitignore)$/.test(relPath);
    if (isText) {
      const content = readFileSync(srcPath, 'utf8');
      const scrubbed = scrub(content, SCRUB_RULES);
      if (scrubbed !== content) scrubbedCount++;
      writeFileSync(dstPath, scrubbed);
    } else {
      copyFileSync(srcPath, dstPath);
    }
  }
  console.log(`Done. ${toCopy.length} files copied, ${scrubbedCount} scrubbed.`);
  console.log('');
  console.log('Next steps:');
  console.log(`  cd ${DST}`);
  console.log('  npm install && npm run validate && npm run selftest && npm run build');
  console.log('  git init && git add . && git commit -m "Initial commit"');
}

main();
```

**Self-test** (also part of the pattern): add a test to `tins-kit/scripts/selftest.mjs` that verifies the script copies a fixture set of files correctly, the scrub rules apply as expected, and excluded files don't get copied.

---

## 5\. Variations

### 5.1 SPA to static host (the case this pattern covers)

The default. Output is a `dist/` folder ready for Netlify, Vercel, GitHub Pages, Cloudflare Pages.

### 5.2 CLI tool to npm package

Different output: a single `dist/index.js` + `package.json` for npm publishing. Additional steps: add `bin` field to package.json, generate README from doc files, build with `tsup` or `esbuild` instead of Vite, publish to npm via `npm publish`.

### 5.3 Library to npm package

Different output: `dist/index.js` + `dist/index.d.ts` for typed consumers. Additional steps: add `exports` field with `import`/`require`/`types` conditions, generate type declarations, mark the package as `private: false` in package.json.

### 5.4 Backend service to container

Different output: a Dockerfile + production compose file. Additional steps: multi-stage build, health check endpoint, non-root user, proper secret management (not in env vars).

---

## 6\. Cross-platform notes

### 6.1 macOS / Linux / WSL

The shell script in section 0.0 works as-is. Use `cp`, `sed`, `mkdir`.

### 6.2 Windows native (cmd.exe / PowerShell)

The shell script does NOT work (no `sed`). Use either:

- The Node script in section 4 (zero-dependency, runs anywhere Node 18+ runs)
- PowerShell with `Copy-Item`, `Get-Content`, `Set-Content`, and `Replace` operations
- WSL (run the shell script inside WSL even if your main shell is PowerShell)

### 6.3 CI environments

Both scripts can run in CI. Add a step like:

```yaml
- name: Private to public
  run: node scripts/private-to-public.mjs ./myapp ./myapp-public
```

---

## 7\. Worked example: Jayshankar

The Jayshankar consumer followed this pattern on 2026-08-13:

- Source: `/c/Users/user/Desktop/Jayshankar/`
- Destination: `/c/Users/user/Desktop/Jayshankar-clean/`
- Method: `robocopy` for the file copy, then Node-script-style regex replaces for scrubbing
- Time: ~2 hours of human-driven work
- Outcome: 56 files committed, validator 62/62 green, selftest 7/7 green, deployed live to Netlify

The full decision log lives in `Jayshankar/FRONTEND-OVERHAUL.md` (the consumer's local plan). The reusable parts of that workflow are what this pattern captures.

---

## 8\. Common pitfalls

### 8.1 Forgetting to extend `.gitignore`

Symptom: accidentally commit `archive/`, `tins-kit/`, `.env*`. Fix: always extend the public folder's `.gitignore` with the methodology-internal section BEFORE the first `git add`.

### 8.2 Env vars set AFTER the build

Symptom: blank page on the deployed URL. The JS bundle has empty Supabase values baked in. Fix: in Netlify, set the env vars BEFORE the first deploy (or use `Clear cache and deploy site` after adding them).

### 8.3 Vite publishable keys trip Netlify's secrets scanner

Symptom: build fails with `Secret env var "VITE_SUPABASE_URL"'s value detected`. Fix: set `SECRETS_SCAN_ENABLED=false` in Netlify's env vars.

### 8.4 Service worker caching old bundle

Symptom: blank page even after fixing everything, but works in Incognito. Fix: unregister the service worker (`DevTools → Application → Service Workers → Unregister`), then hard-refresh.

### 8.5 Scrubbing the wrong files

Symptom: methodology leaks (e.g. "tins-kit" still appears in comments). Fix: run the validation checks at step 6 — if the validator passes with the new marker, you scrubbed enough.

---

## 9. References

- The kit's other patterns: `client-side-aggregation.md`, `empty-states.md`, `postgres-mutations.md`, `pwa-offline-graceful.md`, `supabase-auth-trigger.md`
- The Jayshankar consumer's local plan: `Jayshankar/FRONTEND-OVERHAUL.md`
- The kit's BUILDER-DECISIONS-REVIEW template: `tins-kit/templates/BUILDER-DECISIONS-REVIEW.md`

---

## When this changes

- **If the consumer adds a new artefact type** (e.g. a Python script in `scripts/` that
  should not be public): add a row to the include/exclude table in §3.
- **If the kit's `<!-- TINS Specification v1.0 -->` marker changes**: update the
  `markerReplacements` in the Node script (§4).
- **If the consumer switches to a new hosting target** (e.g. Vercel instead of Netlify):
  re-do §6 (the Node script) with the new platform's secrets scanner + env-var names.
- **If the kit's template structure changes** (e.g. a new file is added to the
  consumer's required-handover set): update the `SCRUB_RULES` in the Node script.

---

_Last updated: 2026-08-14._

---

*— End of `private-to-public` pattern. See also: `pinned-deps.md` (the
manifest-in-lockstep discipline), `observability-first.md` (the deployment
runbook pattern).*



## Evidence

- tins-kit/lib/patterns/private-to-public.md#Pattern: Private to Public — Shipping a TINS Workspace Without Leaking Methodology
