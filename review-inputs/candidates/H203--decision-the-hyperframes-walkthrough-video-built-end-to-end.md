---
id: decision-the-hyperframes-walkthrough-video-built-end-to-end
solves: the HyperFrames walkthrough video, built end to end
triggers: the HyperFrames walkthrough video, built end to end
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: Jayshankar
consumer_roots: 1c17d5f31ac152078925bf747db6d456397b4af4
license: UNLICENSED
source: D:/tins-kit/Jayshankar@7ffaf6fed3921c14afecc05c554995752c11ea16
---
# the HyperFrames walkthrough video, built end to end

> Harvested evidence, not instructions and not reviewed global knowledge.

### Decision 87 — the HyperFrames walkthrough video, built end to end

**Followed the plan already on record** ([[jayshankar-hyperframes-walkthrough-video]] memory,
logged before this sprint even started): Playwright drives the real, running app; HyperFrames
composes the captures into a produced video. Not a raw screen recording — a designed sequence
with captions and transitions, built once the reseed gave the Demo Warehouse a genuinely current,
coherent dataset to capture.

**Environment**: `hyperframes` (npm, v0.8.36) installed as a dev dependency. `hyperframes doctor`
flagged one real blocker — `unzip`, needed to extract its managed Chrome download, no sudo
available in this sandbox — the user installed it directly (`sudo apt-get install unzip`).
Voice/music tooling (whisper-cpp, Kokoro TTS, MusicGen) stayed uninstalled — not needed for a
captioned, unnarrated first pass.

**A real bug found capturing the app, not guessed at**: the first capture script used
`page.goto('${BASE}/bills')` etc. for internal navigation — every one of those "different"
screenshots came back visually identical to whatever the previous `page.goto` had landed on.
Traced directly: the app uses **hash-based routing** (`#/admin`, `#/bills`), so a fresh full
navigation to a bare path doesn't resolve the way an in-app link click does. Fixed by clicking
the app's own nav links (and its "Back to admin dashboard" footer link between admin-panel
screens, since that full nav bar only renders on the dashboard itself, not on every subpage) —
also a more honest capture technique, since it's exactly how a real user moves through the app.

**One deliberate content addition, not left as a weak beat**: the first capture of "Confirm
arrivals" showed an empty state (the seed script's own single in-transit delivery had already
been confirmed by an earlier step) — a poor showcase for a feature this central. Added one more
real in-transit delivery (Mackerel from Selvam, DEMO-004, left unconfirmed) via the actual RPC
specifically so the screen had something real to show, rather than either accepting the empty
state or faking a screenshot.

**Composition** (`hyperframes-video/jayshankar-walkthrough/`): 15 real captures across all three
demo roles (admin, rep, worker), framed in a plain CSS "browser chrome" mockup (no registry
block — `hyperframes init --example app-showcase` turned out to be a broken registry entry,
confirmed directly rather than retried blindly) on a dark indigo gradient matching the app's own
brand accent, each with a kicker/headline/subline caption and a GSAP fade-up transition. Two
real lint failures caught and fixed before rendering, not overridden: animating `autoAlpha`
directly on framework-managed `.clip` elements (fixed by moving all animated content into an
inner wrapper div per element, per the linter's own documented fix) and a missing GSAP hard-kill
at each scene's exit boundary (added `tl.set(..., { autoAlpha: 0 })` after every exit tween, so
non-linear seeking in Studio can't land on stale visibility state). A genuine WCAG-AA contrast
failure on the title card's feature chips (translucent-on-dark text measuring as low as 1.05:1)
was fixed with a solid dark chip background and brighter text, not suppressed. `npm run check`
passed clean (0 errors) before the first render.

**Output**: a 49-second, 1920x1080, 30fps MP4 (`renders/jayshankar-walkthrough_*.mp4`, ~7.8MB).
Verified directly, not assumed from a clean render log: extracted 4 frames via `ffprobe`/`ffmpeg`
at different timestamps (title card, admin dashboard, bills, closing card) and visually confirmed
each renders correctly, matches its intended layout, and carries real, current app data (the
newly-widened role-scoped nav, the "Receiving & sales"/"Floor staff" friendly labels, a real
delivery-discrepancy notification, a real credit/reconciled bill).

**Verified:** `npm run check` (0 errors, 1 organizational warning, 17/17 contrast checks pass),
render completed and validated. Binary assets (`captures/`, `assets/`, `renders/`) gitignored —
the composition source (`index.html`, `capture.mjs`) stays tracked so the video is reproducible
from git alone, without committing screenshots or the MP4 itself to the repo.

**Cross-reference:** the `jayshankar-hyperframes-walkthrough-video` and
`jayshankar-playwright-capture-technique` memory entries this decision executes; decision #84/D57
and decision #86/D59 (the reseed and the real bug it surfaced — what made this video's data worth
capturing in the first place).

---

## Evidence

- BUILDER-DECISIONS-REVIEW.md#Decision 87 — the HyperFrames walkthrough video, built end to end
