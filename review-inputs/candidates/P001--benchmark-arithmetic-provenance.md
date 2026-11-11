---
id: benchmark-arithmetic-provenance
solves: Copied model comparison takeaways can contradict supplied scores and costs
triggers: benchmark,cost-comparison,handoff
not_when: Treating example benchmarks as current prices, future task predictions or account availability
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@9c289cc7170f9f18ceb64b584666cdd8d672ea82
---
# Calculate benchmark tradeoffs from rows and retain provenance

Preserve the supplied model/effort/score/cost rows; calculate cost-per-score and inclusive quality/cost filters directly. Keep no-match states and unknown source/date/method explicit in both UI and copied instructions. This pilot verified Haiku 43 does not beat Terra 45 and 0.21 is not less than half of 0.40; recommendations remain benchmark-specific, not spend authorization. Owner UI acceptance is still pending.

## Evidence

- test/handoff.test.mjs#AC-7
