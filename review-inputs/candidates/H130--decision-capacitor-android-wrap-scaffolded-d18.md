---
id: decision-capacitor-android-wrap-scaffolded-d18
solves: Capacitor Android wrap scaffolded (D18)
triggers: Capacitor Android wrap scaffolded (D18)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# Capacitor Android wrap scaffolded (D18)

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 45 — Capacitor Android wrap scaffolded (D18)

**What changed.** `@capacitor/core`/`@capacitor/cli`/`@capacitor/android` installed;
`capacitor.config.ts` added (`appId: 'com.jayshankar.fishwholesale'` — a real but not-yet-locked
placeholder, changeable freely until the first actual Play Store submission, after which
changing it means shipping as a new listing rather than an update; `appName: 'Jayshankar'`,
matching the existing PWA manifest's `short_name` rather than inventing a separate label);
`npx cap add android` scaffolded the native `android/` project (confirmed `applicationId`/
`versionCode`/`versionName` match the config, not just that the command exited 0); a
`cap:sync` npm script (`vite build && npx cap sync android`) added and confirmed working —
every future web-code change flows into the native project with one command, no manual asset
copying.

**Environment split, consistent with this project's whole WSL2/Windows pattern.** No
Java/Android SDK/Gradle exist in this WSL2 environment — checked directly before starting, not
assumed. Everything done here (dependency install, config, `cap add android`, `cap sync`) is
pure file generation/copying and needed none of that toolchain. Actually compiling, running on
an emulator/device, or producing a signed release build needs a real Android toolchain — matches
how every other build step this session has worked (WSL2 plans/audits, Windows-native tools
build), so that's Windows-side work (Android Studio, which bundles its own JDK/SDK/Gradle
management far more smoothly than a hand-rolled WSL2 CLI install), not something stood up fresh
in WSL2 for this one task. The project folder is already shared between WSL2 and Windows, so the
`android/` directory this decision created is immediately visible and usable from
`C:\Users\user\Desktop\Jayshankar\android` with no extra step.

**Not yet done, flagged rather than silently skipped:** real app icons (Android needs rasterized
PNGs at several densities plus an adaptive-icon XML, not the existing `public/icon.svg` directly
— no `convert`/`rsvg-convert`/`inkscape` available in this environment to generate them; Android
Studio's own Image Asset Studio does this correctly from a source image and is the right tool for
it, not something worth hand-rolling blind here); the first actual debug/release build; and
confirming the `appId` placeholder with the user before any real Play Store submission.

**Cross-reference:** `capacitor.config.ts`, `android/`, SPEC.md D18.

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 45 — Capacitor Android wrap scaffolded (D18)
