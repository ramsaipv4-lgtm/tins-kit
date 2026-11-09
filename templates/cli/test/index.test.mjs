import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greet } from '../src/index.mjs';

test('greet: names the person and refuses an empty name', () => {
  assert.equal(greet('ada'), 'hello, ada');
  assert.throws(() => greet(''));
});
