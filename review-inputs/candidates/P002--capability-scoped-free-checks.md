---
id: capability-scoped-free-checks
solves: Unverified or failed catalogue models keep appearing as usable free choices
triggers: provider-checks,free-tier,model-selection,capability
not_when: Metadata inventory without inference authorization; a smoke pass is not a quality benchmark or a guarantee after billing or account changes
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@476539fc1da3e8067eaf981a23cdfdea91af6612
---
# Bind model readiness to account key and capability

Separate catalogue refresh from explicit bounded probes. Require fresh free evidence and no-billing account confirmation where necessary. Scope successes to a non-replayable key fingerprint, capability and expiry; text success does not authorize search or images. Retain safe failures diagnostically but keep failed or untested choices out of normal selectors. Revoke access/quota/protocol failures, preserve content-specific distinctions, and never retry or switch to a paid fallback automatically.

## Evidence

- test/free-checks.test.mjs#AC-36
- docs/evidence/free-provider-review.md#Actual batch
