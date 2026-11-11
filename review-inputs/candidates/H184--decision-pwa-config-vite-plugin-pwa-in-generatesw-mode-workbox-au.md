---
id: decision-pwa-config-vite-plugin-pwa-in-generatesw-mode-workbox-au
solves: PWA config: vite-plugin-pwa in `generateSW` mode, Workbox auto-handles the rest
triggers: PWA config: vite-plugin-pwa in `generateSW` mode, Workbox auto-handles the rest
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# PWA config: vite-plugin-pwa in `generateSW` mode, Workbox auto-handles the rest

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 26 — PWA config: vite-plugin-pwa in `generateSW` mode, Workbox auto-handles the rest

**What changed.** W5 ships `vite-plugin-pwa@^1.3.0` wired in
`vite.config.ts`. Configuration:
- `registerType: 'autoUpdate'` — new builds auto-replace the old SW on next
  page load. No "new version available, refresh" prompt.
- `devOptions.enabled: true` — the SW is registered in dev too, so we can
  test offline behaviour locally (otherwise the offline banner code is
  unreachable without a production build).
- `includeAssets: ['favicon.svg', 'icon.svg']` — the SVG icons are precached
  alongside the JS/CSS/HTML.
- `manifest` is inline: name, short_name, theme_color `#4f46e5`,
  background_color `#f8fafc`, display `standalone`, start_url `/`,
  scope `/`, 1 icon entry (the fish SVG, sizes `any`, purpose `any maskable`).
- `workbox.globPatterns: ['**/*.{js,css,html,svg,woff2}']` — precaches the
  built app shell.
- `workbox.navigateFallback: '/index.html'` — hash-router URLs (e.g.
  `/#/admin/audit-log`) fall back to the cached `index.html` so deep links
  work offline.
- `workbox.runtimeCaching` — one rule for `*.supabase.co`:
  `NetworkFirst` with `networkTimeoutSeconds: 5` and a 24h `maxAgeSeconds`
  expiry. The in-memory React Query cache is the primary cache; the SW is
  the safety net for the app shell + cross-restart reads.

**Why `generateSW`, not `injectManifest`.** `generateSW` lets Workbox
auto-generate the service worker from the config object — no need to write
our own SW file. `injectManifest` is for projects that need full control
of the SW (e.g. custom message handling, push notifications). We don't
need either, so the simpler mode wins.

**Why NetworkFirst, not CacheFirst, for the Supabase API.** CacheFirst
would serve stale data even when the network is up. The 5s `networkTimeoutSeconds`
means: "try the network, fall back to cache if it takes >5s." When online,
the user always sees fresh data; when offline, they see the last good read.
This is what SPEC §2.14 means by "the most recent read snapshot."

**Why 24h `maxAgeSeconds`.** Long enough to span a workday (the demo
session is ~6 hours; the wholesaler's day is ~10). Short enough that a
demo on day-old cached data doesn't surprise anyone. Mode B will tune
this per-resource (e.g. 5 minutes for the audit log, 1 hour for batches).

**Why `autoUpdate`, not `prompt`.** The demo audience is the gatekeeper
client. They tap the app, it should "just work" — no "new version
available" interruption. `autoUpdate` activates the new SW in the
background and swaps it in on the next navigation. Pilot will revisit
this if the upgrade has breaking changes (e.g. schema migration on the
client).

**What this DOES NOT do.** No push notifications. No background sync.
No offline write-queue. All three are explicit V1-out-of-scope per
SPEC §9; the upgrade paths are documented in §9 and `docs/OFFLINE-WRITE-QUEUE.md`
(to be written in Mode B).

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 26 — PWA config: vite-plugin-pwa in `generateSW` mode, Workbox auto-handles the rest
