import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add } from '../src/index.mjs';

test('add: sums finite numbers and refuses others', () => {
  assert.equal(add(2, 3), 5);
  assert.throws(() => add(1, Number.NaN), TypeError);
});
