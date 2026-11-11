---
id: model-use-restrictions
solves: Basic chat Auto can select a zero-priced harness-only endpoint and receive 403
triggers: model-selection,free-api,chat,403
not_when: Treating documented incompatibility as proof of an unobserved upstream response or spoofing an approved harness
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@c00347ead9d50a9b3fba368cf5dc942dfe8175d8
---
# Model price and context do not establish permitted use

Keep use restrictions separate from pricing and endpoint identity. Truncated model APIs can omit notices present on official model pages. Exclude reviewed harness-only endpoints from basic chat in both normalization and execution guards, including manual selection. Prefer a reviewed eligible general-text model without relaxing fresh price/context checks. Preserve account uncertainty and do not change privacy settings, accept terms or impersonate a harness to bypass restrictions.

## Evidence

- test/openrouter-restrictions.test.mjs#AC-25
