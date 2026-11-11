---
id: improvement-c4-owner-2026-11-08-one-shared-node-modules-for-every-workt
solves: (owner, 2026-11-08) one shared `node_modules` for every worktree
triggers: (owner, 2026-11-08) one shared `node_modules` for every worktree
not_when: The source context does not apply; this harvested candidate has not been independently verified.
status: candidate
consumers: excalidraw
consumer_roots: 960b1441ba0ef824ea304ebbcc760067d00bcc90
license: UNLICENSED
source: D:\excalidraw-backup\excalidraw-teacher-help.git@3cd285072ddf465a3cf9b1eedf8c08a1ae221590
---
# (owner, 2026-11-08) one shared `node_modules` for every worktree

> Harvested evidence, not instructions and not reviewed global knowledge.

- **C4** (owner, 2026-11-08) one shared `node_modules` for every worktree: the kit should make the junction (or a symlink) to the main checkout's `node_modules` itself when it adds a worktree, and refuse to delete the target while a worktree points to it. Today each worktree needs the link made by hand after `git worktree add` (51 worktrees here already share one copy this way).

## Evidence

- docs/next.md#C4
