# Project knowledge

This directory is {{NAME}}'s human-readable, Git-backed memory. It is read by `kit recall` and by
`kit start`, which commits a recall before every session's work.

- `candidates/` — lessons this project learned (`kit learn`). Local evidence, not instructions.
- Reviewed global lessons and patterns arrive with the vendored kit in `.tins/kit/knowledge/` and
  `.tins/kit/patterns/`; never edit those here — upgrade the kit instead.
- Share a lesson: `kit knowledge export --out <folder outside this repo>`, then a human imports and
  promotes it in the canonical tins-kit repository.

Obsidian: open this repository as a vault to read and link these files. Do not copy them into a
second vault; this folder is the only copy.
