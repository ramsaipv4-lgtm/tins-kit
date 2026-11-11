---
id: catalogue-lifecycle-access
solves: Avoid Auto choosing listed models unavailable to new accounts or silently redirected to another billed model
triggers: provider-catalogue,model-selection,deprecation,404
not_when: No verified lifecycle restriction; do not blanket-block fresh manual BYOK models or infer account access from a replacement name
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@d03623925f1a9f09246eaf97c26a8d120a90ead0
---
# Catalogue capability can survive model deprecation

Keep identity discovery, reviewed lifecycle policy and account acceptance separate. Fresh models.list can still advertise generateContent after access becomes prior-user-only. Exclude restricted aliases from Auto and label their source; retain exact existing-user choices until any model-changing redirect begins. Verify with an authorized account and never retry on another provider or paid model automatically.

## Evidence

- docs/evidence/completion-review.md#Live-404
- test/completion.test.mjs#AC-29
