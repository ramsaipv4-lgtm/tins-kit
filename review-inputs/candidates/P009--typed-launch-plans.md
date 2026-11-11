---
id: typed-launch-plans
solves: Guessed CLI flags and shell interpolation can turn a facilitator into arbitrary command execution
triggers: launcher,windows,cli,command-preview
not_when: Treating injected runner tests as proof of native window behavior or verified account readiness
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@fd2faad0a6574717aa5eabbf2ac93017c5fb67ac
---
# Separate previewed launch plans from native execution

Build a pure plan from registered file identity, existing working directory, explicit environment and adapter-specific bounded arguments. Reject shell metacharacters and option-like model values; never invent folder flags or send a task prompt. Revalidate an expiring single-use preview before a separate injected runner. Tests establish plan/origin contracts; native behavior requires operational evidence.

## Evidence

- test/manual-launch.test.mjs#AC-20
