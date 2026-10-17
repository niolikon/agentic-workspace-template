import assert from 'node:assert/strict';
import { take } from './after/select.mjs';
import { load } from './after/load.mjs';
assert.deepEqual(take([1, 2, 3], 2), [1, 2]);
assert.deepEqual(take([1], 0), []);
assert.deepEqual(await load(async () => { const error = new Error('timeout'); error.name = 'TimeoutError'; throw error; }), { retry: true });
const failure = new TypeError('invalid input');
await assert.rejects(load(async () => { throw failure; }), error => error === failure);
