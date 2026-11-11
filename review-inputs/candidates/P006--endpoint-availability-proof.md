---
id: endpoint-availability-proof
solves: API identity lists and cached snippets retain deprecated free endpoints
triggers: provider,catalogue,free-endpoint,trial
not_when: Treating a free label as account entitlement, ignoring unknown outcomes or routing to paid partner endpoints
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@c9a10dda7a62e43f9cd5b7001a67e6b47f0665be
---
# Check current free endpoint status beyond model identity

Separate identity discovery from executable capability. For explicitly reviewed contracts, fetch the official model page freshly without credentials and require positive current free availability; reject deprecated or ambiguous labels and stale proof. Fixed inference origins and bounded payloads remain independent. Poll an accepted job only through a documented fixed status route; never resubmit generation or forward bearer tokens to result downloads. Fixture tests do not establish live account success.

## Evidence

- test/nvidia.test.mjs#AC-22
