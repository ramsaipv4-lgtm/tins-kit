---
id: decision-netlify-deploy-netlify-toml-node-20-hash-router-spa-fall
solves: Netlify deploy: `netlify.toml` + Node 20 + hash-router SPA fallback
triggers: Netlify deploy: `netlify.toml` + Node 20 + hash-router SPA fallback
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Netlify deploy: `netlify.toml` + Node 20 + hash-router SPA fallback

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 29 — Netlify deploy: `netlify.toml` + Node 20 + hash-router SPA fallback

**What changed.** W6 ships:
1. `package.json` build script: `tsc -b && vite build` → `vite build`.
   The `tsc -b` was referencing a `tsconfig.node.json` project file that
   was dropped in W4 (single `tsconfig.json` now). The `-b` flag is
   silent — exit 0 if there's nothing to build — but it left a confusing
   "no project" warning. Netlify's build log would have been clean but
   noisy. Adding a separate `typecheck` script (`tsc --noEmit`) for
   whoever wants it; the deploy doesn't run it.
2. New `netlify.toml` at the repo root, pinned:
   - `command = "npm run build"`
   - `publish = "dist"`
   - `NODE_VERSION = "20"` (the kit's standing rule; Supabase SDK and
     Vite 5 both want Node 20+)
   - SPA fallback: every URL → `/index.html` (defence-in-depth for
     hash-router links that get stripped by link-previewers — HashRouter
     itself means the server only ever sees `/` and `/index.html`, but
     the redirect is cheap insurance)
3. New `docs/DEPLOY-NETLIFY.md` — the operator doc (mirrors
   `docs/SUPABASE-SETUP.md`'s tone: pre-flight, UI walkthrough, smoke
   tests, troubleshooting, what's NOT in scope).

**Why `netlify.toml` and not the Netlify UI alone.** The UI lets you
set the build command + publish dir, but the env vars and the SPA
redirect are easier to track in `netlify.toml` (and to commit so a
teammate can see what the deploy does). The kit's standing rule is
"every change is in a file you can read."

**Why Node 20, not 18 or 22.** The kit's standing rule from
exam-forge. Node 18 is end-of-life in April 2025; Node 22 is fine but
Vite 5's docs are pinned to 20. The Netlify default is 18 (legacy) —
the `NODE_VERSION` env var forces 20.

**Why no `_redirects` file.** A `_redirects` file (Netlify's
file-based redirects) is an alternative to the `[[redirects]]` block in
`netlify.toml`. We picked `netlify.toml` because it's already being
edited for build config — one file, not two.

**Why no custom server / SSR.** SPEC §4.1: the V1 deploy is static
hosting. The Supabase JS client talks directly to the Supabase REST
API; the only thing the static host does is serve `index.html` + the
JS/CSS/SW bundle. No Node functions, no edge functions, no Deno, no
Workers. Free tier is enough for the demo; Pro is $12/mo if the
wholesaler needs more.

**What the user does next.** Push to a Git remote (GitHub / GitLab /
Bitbucket), then in the Netlify UI: Add new site → Import project →
pick the repo → the UI auto-detects the build settings from
`netlify.toml` → add the 2 env vars (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`) → Deploy. ~30 minutes from a clean laptop to
a live URL. Operator doc has the full click-by-click.

**When this changes.** Pilot/Production: add a custom domain
(`demo.jayshankar.in`), Supabase's daily backup confirmation in
deploy logs, a `npm run typecheck` gate in CI. Not blocking for V1.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 29 — Netlify deploy: `netlify.toml` + Node 20 + hash-router SPA fallback
