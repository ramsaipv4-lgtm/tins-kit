---
id: tier-hints-not-entitlement
solves: A provider-wide block or false free label can result from treating model metadata as account-tier proof
triggers: byok,free-tier,model-ordering,billing
not_when: Bypassing a no-paid-calls requirement without an explicit owner-directed BYOK scope change
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@c849c09e40fcd3a70de761e3e939314ee58c8005
---
# Separate free-tier ordering from account billing and invocation policy

Preserve independent fields for transport capability, verified zero price and account-dependent free-tier candidate hints. Fetch official public tier sources without keys; failed parsing means unknown, not free or permanently blocked. Share a pure free-first ordering across selectors. When the owner explicitly enables BYOK text, preserve exact model selection and show account billing rather than claiming tier hints establish entitlement. Do not generalize this policy change to guarded providers or automatic fallback.

## Evidence

- test/free-tier-order.test.mjs#AC-28
