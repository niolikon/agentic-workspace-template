import assert from 'node:assert/strict';
import { take } from './after/select.mjs';
import { load } from './after/load.mjs';
assert.ok(Array.isArray(take([1, 2, 3], 2)));
assert.deepEqual(await load(async () => ({ value: 7 })), { value: 7 });
