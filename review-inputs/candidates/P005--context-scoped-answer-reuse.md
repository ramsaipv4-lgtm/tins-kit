---
id: context-scoped-answer-reuse
solves: Identical follow-up text can mean different things in different conversations
triggers: chat,history,cache,follow-up
not_when: Independent context-free lookups or using cache as a substitute for authorization
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@933bcbbd189d5f6da171af69a9c199a6aa6d326d
---
# Scope saved chat answers to preceding context

Preserve exact question text and hash the bounded role/content context before looking up saved answers. Equal follow-up text with different preceding context must not reuse an answer. Keep context validation, price and account gates independent from reuse; test both same-context reuse and changed-context misses.

## Evidence

- test/conversations.test.mjs#AC-14
