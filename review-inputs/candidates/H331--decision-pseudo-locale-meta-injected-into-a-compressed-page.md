---
id: decision-pseudo-locale-meta-injected-into-a-compressed-page
solves: pseudo-locale meta injected into a compressed page
triggers: pseudo-locale meta injected into a compressed page
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: tins-lms
consumer_roots: 6ab2e424052561f8c177ba30afc7d007236df36d
license: UNLICENSED
source: https://github.com/ramsaipv4-lgtm/tins-lms.git@3e9c611747d9a132312067600ad5a32fffda3dad
---
# pseudo-locale meta injected into a compressed page

> Harvested evidence, not instructions and not reviewed global knowledge.

## I-11: pseudo-locale meta injected into a compressed page

**Problem:** b11-2 found every AC-123 page hanging once index.html grew past 1,024 bytes.
**Cause:** I-8 made static.ts compress text files of 1 KB and more; main.ts (pseudo-locale test mode)
then read the compressed body as text, injected `<meta name="lms-pseudo-locale">` into it and sent
corrupt bytes with `content-encoding` still set.
**Choice:** in pseudo-locale mode, decode br/gzip first, inject, and send the page uncompressed (the
mode exists only for the strings check; production never takes this path).
**Proof:** a11y journey (AC-99, AC-123) passes after the change (see the I-11 verify run); the gate run on close covers the rest.
**Lesson for the rebuild course:** response middleware that rewrites bodies must run before compression,
or decode what it rewrites.

## Evidence

- docs/build-journal/integration.md#I-11: pseudo-locale meta injected into a compressed page
