---
id: decision-8-6-performance-checking-automated-with-playwright-rathe
solves: §8.6 performance checking, automated with Playwright rather than a custom VM
triggers: §8.6 performance checking, automated with Playwright rather than a custom VM
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# §8.6 performance checking, automated with Playwright rather than a custom VM

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 69 — §8.6 performance checking, automated with Playwright rather than a custom VM

**Why not a VM.** The user proposed replicating a 2021 Android phone's specs in a custom VM to
check §8.6's performance targets. Proposed the cheaper alternative instead: the thing that
actually determines a web app's perceived performance is CPU cycles and network conditions, not
the underlying silicon — which is exactly what Chrome DevTools' own "CPU throttling" + "Slow 4G"
presets emulate, the same technique Lighthouse itself uses to score mobile performance from a
desktop. A VM replicating real ARM hardware buys little a throttled headless browser doesn't
already give you, for meaningfully more setup cost. The user ran the DevTools version manually
first (10.3x CPU / Slow 4G, getting 764ms-1.76s / 1668ms readings) and asked for this to be
automated going forward.

**What was built.** `playwright` added as a devDependency (Chromium binary downloaded and
smoke-tested live — confirmed it actually launches in this environment, not assumed).
`scripts/perf-check.mjs` — a real, working tool, not just installed and left untested: launches
headless Chromium, applies the exact same CPU-throttle-rate/network-conditions via the Chrome
DevTools Protocol (`Emulation.setCPUThrottlingRate`, `Network.emulateNetworkConditions` — Slow
4G's 400Kb/s down/up, 400ms latency, matching DevTools' own preset), navigates to a given URL,
and reports full-load time, DOM-content-loaded, first-paint, first-contentful-paint, and
largest-contentful-paint from the browser's own Performance API (the same numbers DevTools'
Performance panel and Lighthouse report, not a reimplementation).

**One real thing found while testing this against a live local build, not assumed to just
work:** the very first run came back with every paint metric `null` — a genuine headless-Chrome
quirk (`Navigation` 'load' fires once the HTML/JS shell is fetched, but this is a client-
rendered SPA; React's own render and the paint entries that come with it land a beat later,
especially under CPU throttling). Fixed with a short settle wait after `goto()`. Largest-
contentful-paint still comes back `null` in headless runs (a separate known Chromium quirk — LCP
often needs a real visibility-change event to finalize, which a foregrounded headless run never
gets) — documented honestly in the script's own output rather than silently reported as zero;
first-contentful-paint is the reliable number to read in a headless run.

**Deliberately NOT part of `npm run validate`** — this is a developer tool for repeatable perf
measurement, not a release gate; `scripts/`'s zero-dependency house rule stays scoped to the
validator/migration-runner, per its own long-standing gotcha note, not every future script.

**Cross-reference:** SPEC.md §8.6 (the targets this checks against); the "§8.6 never actually
measured on a real device" finding from the direct-audit conversation this session that led to
D26/D20/D27's own gap-closing.

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 69 — §8.6 performance checking, automated with Playwright rather than a custom VM
