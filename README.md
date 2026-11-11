# Next TINS iteration — specification workspace

Start with [SPEC.md](SPEC.md), then [the 369-candidate review bundle](review-inputs/INDEX.md).

This folder is a specification and review-input package, not an implemented kit. The folder name v3 is a working label, not a release number. Agent Control is an optional fresh-build specification only; no product code is included.

This is the `main` branch of https://github.com/ramsaipv4-lgtm/tins-kit-next . It is a specification baseline, not a runnable kit release. Historical planning documents under docs retain their original source paths as context.

## Previous iterations

- `archive/document-kit-fork`: committed document-based kit and its history.
- `archive/compact-cli-kit`: standalone snapshot of Excalidraw's compact CLI kit; application code excluded.
- `archive/tins-kit-next-pilot`: tested pilot kit with its history, before this specification iteration.

The current main commit descends from the pilot baseline, so history is preserved without force-pushing. Archives exclude local uncommitted edits and ignored inboxes. The local prior implementation remains at `D:\tins-kit\tins-kit-next`; this new iteration is at `D:\tins-kit\tins-kit-v3`.

Verify this portable bundle:

```powershell
node D:\tins-kit\tins-kit-v3\review-inputs\verify.mjs
```

The one-time build-review-bundle utility requires the original workspace sources and refuses to overwrite this bundle. Normal reading, review and verification need no original inbox. Original code/test citations in candidate text may require source repositories; missing evidence must remain unverified.
