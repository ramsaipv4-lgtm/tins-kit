import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/server.mjs';

test('server: home page, health check and 404', () => {
  assert.equal(handle('GET', '/').status, 200);
  assert.equal(JSON.parse(handle('GET', '/health').body).ok, true);
  assert.equal(handle('GET', '/missing').status, 404);
});
