---
id: decision-first-real-device-findings-a-table-clipping-bug-a-missin
solves: First real-device findings: a table-clipping bug, a missing back link, and the Android hardware back button was never wired
triggers: First real-device findings: a table-clipping bug, a missing back link, and the Android hardware back button was never wired
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# First real-device findings: a table-clipping bug, a missing back link, and the Android hardware back button was never wired

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 47 — First real-device findings: a table-clipping bug, a missing back link, and the Android hardware back button was never wired

**What changed.** Three fixes from the user's first real-device test (Poco X6 Pro, via Android
Studio) — the kind of bug class that's invisible in web/PWA testing but immediate the moment an
app is actually wrapped natively, so worth reading past "three small fixes" to why each one only
showed up now.

1. **`StockBySku.tsx` clipped its "By location" column on a phone-width screen.** The table sat
   in a `div` with plain `overflow-hidden` and no scroll container — content that didn't fit was
   silently cut off, not scrolled. Fixed with a nested `overflow-x-auto` wrapper around just the
   `<table>`, keeping the outer div's `overflow-hidden` for its original purpose (rounded-corner
   clipping, harmless to combine with an inner scroll container) plus `whitespace-nowrap` on the
   location-breakdown cell so it triggers real horizontal scroll instead of wrapping.

2. **`AuditLog.tsx` (`/admin/audit-log`) had no back link at all** — the one page in the app
   missing the `<FormFooter backHref=... />` pattern every mutation form already uses. Directly
   matches what the user reported ("no visible back button to get out of subdirectories") —
   confirmed by checking every page, not guessed: all 5 mutation forms already had it,
   `AuditLog` was the sole gap.

3. **The Android hardware/gesture back button was never wired to the app's navigation at all** —
   `@capacitor/app` wasn't even a dependency. This is the deeper, compounding cause behind the
   same symptom: a web/PWA build relies entirely on the browser's own back button/gesture, which
   a Capacitor-wrapped native app has none of — without explicitly listening for Capacitor's
   `backButton` event and calling `window.history.back()`, pressing the phone's back
   button/gesture on ANY page (not just `AuditLog`) does nothing useful, or exits the app
   outright. Installed `@capacitor/app`, wired a listener in `App.tsx` using the documented
   `canGoBack` pattern (step back through real history if there's history to step back through,
   exit the app only once there truly isn't) — guarded behind `Capacitor.isNativePlatform()` so
   it's a complete no-op on web/PWA, where the browser's own back handling must be left alone.
   `npx cap sync android` confirmed the plugin registered correctly in the native project
   (`capacitor.plugins.json` shows `com.capacitorjs.plugins.app.AppPlugin`) — no manual
   `AndroidManifest.xml`/`MainActivity.java` edit needed for this plugin.

**Why fixed directly rather than delegated.** Small, well-understood, single-component/file
changes (fix 1, fix 2) not worth a delegation round-trip's overhead mid-live-device-test — the
user was actively iterating on their phone and wanted to keep moving. Fix 3 is genuinely new
territory (first native-plugin integration in this project since the Capacitor scaffolding
itself, decision #45) but small in code footprint and, like the scaffolding, can only be
functionally verified on a real device — the same reasoning that kept Capacitor's own setup with
the auditor rather than delegated.

**Not verified live by the auditor** — cannot be: none of this is testable from WSL2 (no
browser, no emulator, no device). `npm run typecheck`/`validate`/`cap:sync` all confirmed clean,
and the plugin's correct native registration was confirmed directly, but whether the back button
actually behaves correctly and whether the table now scrolls instead of clipping is the user's
own device to confirm next, the same handoff shape as the whole Capacitor thread.

**Cross-reference:** `src/components/StockBySku.tsx`, `src/pages/AuditLog.tsx`, `src/App.tsx`,
decision #45.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 47 — First real-device findings: a table-clipping bug, a missing back link, and the Android hardware back button was never wired
