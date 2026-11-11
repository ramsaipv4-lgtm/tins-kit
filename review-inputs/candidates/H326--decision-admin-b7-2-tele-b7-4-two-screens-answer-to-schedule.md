---
id: decision-admin-b7-2-tele-b7-4-two-screens-answer-to-schedule
solves: admin (b7-2) + tele (b7-4): two screens answer to "schedule"
triggers: admin (b7-2) + tele (b7-4): two screens answer to "schedule"
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# admin (b7-2) + tele (b7-4): two screens answer to "schedule"

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-2: admin (b7-2) + tele (b7-4): two screens answer to "schedule"

**Problem:** b7-2 passed alone, but `kit merge` refused on the merged tree. Failing: AC-169 desktop
and phone, `after step "switches on": timed out waiting for calendar sync and Google Forms controls
shown once on`. The Google Forms button appeared; "Sync to calendar" never did.
**Cause:** a browser probe on the merged tree showed the journey's schedule link resolved to
`<a href="/teach/substitute">Class schedule</a>` (tele, nav order 20), not b7-2's "Schedule"
(`/teach/schedule`, order 30). The calendar button lives on b7-2's page, so it was never seen. The
API was fine: `PUT /api/admin/switches` then `GET /api/switches?classId=class:c1` returned
`calendarSync: true`.
**Options considered:** rename tele's link (then the substitute journey, which also looks for a
"schedule" screen, would land on b7-2's page and miss "I can't take day 1"); move the calendar
button into tele's page (puts admin-group logic in tele); compose the two on one screen.
**Choice:** compose, as in I-1. The trainer's "Schedule" screen (admin `TrainerSchedule`) embeds
tele's substitute panel (`Substitute embedded`, which renders an h2 titled "Substitute cover");
`/teach/substitute` stays reachable by URL but leaves the nav.
**Why:** one nav entry for one idea ("the class schedule"), each group keeps its own logic and tests,
no journey or SPEC change.
**Proof:** on the merged tree, `node --test` on google-optin, substitute and admin-setup journeys:
8/8 pass (AC-169, AC-150, AC-151, AC-80; desktop and phone).
**Lesson for the rebuild course:** the same as I-1. Registry rule: one owner per screen idea; other
groups contribute panels. The collision was by meaning ("schedule"), not by path, so a path-only
uniqueness check would not have caught it.
**Orchestrator mistake:** the first attempt ran in a session with the task's default scope, so
`kit merge` refused at its check step ("packages/web/src/features/tele/index.tsx is outside task
b7-2's paths"). The unpushed task branch was reset to before that session and the fix redone in a
session started with `--paths` widened to the exact tele files (as I-1 did). Scope is recorded per
session, so an integration fix must declare the files it touches in other groups up front.

## Evidence

- docs/build-journal/integration.md#I-2: admin (b7-2) + tele (b7-4): two screens answer to "schedule"
