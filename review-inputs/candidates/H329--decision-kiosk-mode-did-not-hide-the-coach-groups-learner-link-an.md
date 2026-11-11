---
id: decision-kiosk-mode-did-not-hide-the-coach-groups-learner-link-an
solves: kiosk mode did not hide the coach group's learner link (and a test that ate the machine)
triggers: kiosk mode did not hide the coach group's learner link (and a test that ate the machine)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# kiosk mode did not hide the coach group's learner link (and a test that ate the machine)

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-9: kiosk mode did not hide the coach group's learner link (and a test that ate the machine)

**Problem:** after b7-5 and b7-8 merged, every gate running AC-167 (robustness journey) hung while its
node process grew to ~13.6 GB, twice nearly exhausting the 16 GB machine.
**Cause:** two parts. App: kiosk mode (files group, net.ts) hid only links starting with `/coach`, but
the coach group (b7-8) added a learner-nav link `/learn/coach`, so Coach stayed visible in kiosk mode.
Test: the journey asserted `assert.equal(<Playwright Locator>, null)`; the failing diff deep-inspected
the Locator's object graph at ~340 MB/s (measured: 250 MB at 5 s, 3.5 GB at 15 s).
**Options considered:** hide coach links by label (breaks with translations); move kiosk into the shell
(b11-2 will); fix the selector and redirect to cover both paths now.
**Choice:** net.ts hides `a[href^="/coach"]` and `a[href^="/learn/coach"]` and redirects either path
away while kiosk is on. Tests repo (e986a1a): boolean assertion, a worker-thread memory watchdog in
the journey harness (kills the journey above 3 GB), bounded server-log buffers.
**Proof:** robustness journey 6/6 on main + this fix; with the fix reverted the kiosk test now fails
cleanly in 22 s instead of eating memory.
**Lesson for the rebuild course:** a feature that hides another feature's links must use that
feature's declared routes (a shell hook), not a guessed URL prefix; and never put a live browser object
inside an assertion that may need to print it.

## Evidence

- docs/build-journal/integration.md#I-9: kiosk mode did not hide the coach group's learner link (and a test that ate the machine)
