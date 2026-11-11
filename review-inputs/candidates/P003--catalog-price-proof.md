---
id: catalog-price-proof
solves: Automatic routing can mistake model listing or cached zero pricing for permission to spend
triggers: model-catalog,free-only,routing
not_when: Using model metadata as account entitlement or a measured intelligence ranking
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@deefe0d08b455607723d2bc72d159c24c9ad303c
---
# Fresh model identity is not free inference proof

Normalize catalogue identity, text capabilities and pricing separately. Require fresh data and numeric zero prices for explicit free-only calls; null fields, paid additions and reserved routers fail closed. Keep provider account eligibility unknown when the model list omits it. Deterministic context then ID ordering is a selection rule, not a quality claim. Fixture tests verify rejection/no fallback; no live inference readiness established.

## Evidence

- test/adviser.test.mjs#AC-10
