import test from 'node:test';
import assert from 'node:assert/strict';
import { cap } from '../src/cap.mjs';
test('caps high requests while preserving smaller requests', () => {
  assert.equal(cap(150), 80);
  assert.equal(cap(30), 30);
});
