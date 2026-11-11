---
id: decision-a-settings-checkbox-reverted-by-its-own-first-load-ac-16
solves: a settings checkbox reverted by its own first load (AC-161, phone)
triggers: a settings checkbox reverted by its own first load (AC-161, phone)
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# a settings checkbox reverted by its own first load (AC-161, phone)

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-12: a settings checkbox reverted by its own first load (AC-161, phone)

**Problem:** with the gate's timeout raised so the whole suite finally ran (29.5 min), AC-161 [phone]
failed: `locator.check: Clicking the checkbox did not change its state` (trainer's pair-programming switch).
**Cause:** the checkbox rendered as "off" before the class settings had loaded. On the throttled phone the
click landed first; the first poll answer (still off) then reset the box. The same shape as I-10.
**Choice:** render the switch only after the settings load, and ignore poll answers while a save is in flight.
**Proof:** peer journey (AC-161) passes desktop and phone; the gate on close runs the full suite.
**Lesson for the rebuild course:** never render an interactive control in a placeholder state; show
"Loading" until the real value is known, then let a save win over stale reads.

## Evidence

- docs/build-journal/integration.md#I-12: a settings checkbox reverted by its own first load (AC-161, phone)
