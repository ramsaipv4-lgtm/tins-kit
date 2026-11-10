# Harvesting lessons from existing TINS projects

`kit harvest` extracts structured evidence from an existing project into the canonical kit's local review inbox. It does not modify the source project and does not make anything globally recallable.

## 1. Dry run first

Run from the canonical kit repository (`D:\tins-kit\tins-kit-next`):

```powershell
node bin/kit.mjs harvest D:\tins-kit\Jayshankar
node bin/kit.mjs harvest D:\tins-kit\Jayshankar --json
```

The dry run writes nothing. It reports candidates, secret-scanned skips, and narrative documents inventoried for later human extraction.

Automatic extraction covers:

- `BUILDER-DECISIONS-REVIEW.md` and `REVIEWER-DECISIONS-REVIEW.md` sections named `Decision N`, `Finding N`, `D-n`, or numbered review entries.
- `docs/build-journal/integration.md` entries named `I-n`.
- Excalidraw's explicit `C1`–`C5` improvement bullets in `docs/next.md`.
- Markdown patterns under `lib/patterns/` and `tins-kit/lib/patterns/`.

`HANDOVER.md`, `CONTINUE.md`, `docs/next.md`, `docs/build-journal/`, `docs/kit-growth/`, and `course/` are inventoried with hashes but are not automatically reinterpreted. A script cannot reliably decide which narrative statements are reusable lessons.

## 2. Create the review bundle

```powershell
node bin/kit.mjs harvest D:\tins-kit\Jayshankar --write
```

This creates `inbox/harvest-<project>-<version>/` in the canonical kit only:

- `candidates/*.md`: full source excerpts with stable IDs and provenance.
- `manifest.json`: source repository, current version, consumer root, candidate hashes, and narrative document hashes.
- `REVIEW.md`: the human review queue.
- `HARVEST-REPORT.json`: secret-scan findings without secret values.

`inbox/` is gitignored and excluded from recall. Re-running the same harvest refuses to overwrite an existing bundle.

## 3. Review and promote explicitly

Open `REVIEW.md` or the inbox folder in Obsidian. For each candidate, check the surrounding source context, applicability, licence, privacy, and whether the lesson actually worked.

```powershell
node bin/kit.mjs knowledge promote <inbox-folder> <id> --reviewed-by <your-name> --license MIT
```

- The first Git-backed consumer makes the lesson `tested` after your review.
- A second independent Git-backed consumer allows `--activate`, making it `active`.
- Unversioned sources can be reviewed as `tested`, but cannot satisfy the `active` two-consumer rule.
- `UNLICENSED` candidates require you to choose an explicit reusable licence during promotion.
- Secret scanning is not a privacy or licence review. Client data, student data, credentials, and proprietary material still need human judgement.

After promotion, run:

```powershell
node bin/kit.mjs version --write
node --test test/*.test.mjs
node bin/kit.mjs lint-kit
git add knowledge KIT-VERSION
git commit -m "knowledge: promote <id>"
```

Projects receive the lesson only when a later kit is vendored with `kit new` or `kit upgrade --from D:\tins-kit\tins-kit-next --apply`.

## Provenance and conflicts

Candidates from different projects initially retain separate IDs and sources. Do not merge lessons merely because their titles are similar. When they are genuinely the same lesson, promoting the same ID from another inbox merges its consumers and evidence.

The harvester deliberately preserves conflicting advice. For example, the older kit's Decimal-money guidance and the compact kit's integer-minor-unit guidance require a human decision, not automatic reconciliation.
