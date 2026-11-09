// AC-1: SPEC.md exists and has at least one decision and one acceptance row.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('AC-1: SPEC.md has decision and acceptance rows', () => {
  const spec = readFileSync(new URL('../SPEC.md', import.meta.url), 'utf8');
  assert.match(spec, /^\|\s*D-\d+\s*\|/m);
  assert.match(spec, /^\|\s*AC-\d+\s*\|/m);
});
