import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const fixtures = new URL('./fixtures/code-quality/', import.meta.url)
const load = (scenario, revision, file) => import(new URL(`${scenario}/${revision}/${file}`, fixtures))

test('given the changed selection when taking two rows then the fixture exposes a regression hidden by the supplied assertion', async () => {
  const before = await load('S01', 'before', 'select.mjs')
  const after = await load('S01', 'after', 'select.mjs')
  assert.deepEqual(before.take([1, 2, 3], 2), [1, 2])
  assert.deepEqual(after.take([1, 2, 3], 2), [1])
  assert.deepEqual(after.take([1, 2, 3], 0), [1, 2])
  assert.equal(Array.isArray(after.take([1, 2, 3], 2)), true)
})

test('given a recoverable timeout when loading then the changed handler propagates it while the baseline recovers', async () => {
  const before = await load('S01', 'before', 'load.mjs')
  const after = await load('S01', 'after', 'load.mjs')
  const timeout = new Error('synthetic timeout')
  timeout.name = 'TimeoutError'
  const fetchValue = async () => { throw timeout }
  assert.deepEqual(await before.load(fetchValue), { retry: true })
  await assert.rejects(after.load(fetchValue), error => error === timeout)
  const invalid = new TypeError('synthetic invalid input')
  await assert.rejects(before.load(async () => { throw invalid }), error => error === invalid)
  assert.deepEqual(await after.load(async () => { throw invalid }), { retry: true })
})

test('given two changed producers when composed with their consumer then the fixture shows attributable conversion divergence', async () => {
  const api = await load('S02', 'after', 'api.mjs')
  const worker = await load('S02', 'after', 'worker.mjs')
  const consumer = await import(new URL('S02/consumer.mjs', fixtures))
  assert.equal(consumer.schedule(api.delay(2000)), 2000000)
  assert.equal(consumer.schedule(worker.delay(2000)), 2000)
  assert.equal(consumer.schedule(worker.delay(1501)), 2000)
  const before = await load('S02', 'before', 'api.mjs')
  assert.equal(consumer.schedule(before.delay(2000)), 2000)
  const workerBefore = await load('S02', 'before', 'worker.mjs')
  assert.equal(consumer.schedule(workerBefore.delay(1501)), 1501)
  const scope = JSON.parse(await readFile(new URL('S02/scope.json', fixtures)))
  assert.deepEqual(scope.changes.map(c => [c.changeId, c.repository, c.backend]), [
    ['C2', 'api', 'source-A'], ['C3', 'worker', 'future-source-B']
  ])
})

test('given partial acquired input when preparing review then unknown context remains explicitly unavailable', async () => {
  const scope = JSON.parse(await readFile(new URL('S04/scope.json', fixtures)))
  assert.equal(scope.changes[0].state, 'partial')
  assert.equal(scope.changes[0].reason, 'truncated')
  assert.equal(scope.changes[0].before, undefined)
  assert.equal(scope.changes[0].after, undefined)
})

test('given the supplied test entrypoints when run then weak assertions pass the defective change and focused assertions pass the repaired control', () => {
  for (const scenario of ['S01', 'S05']) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL(`${scenario}/tests.mjs`, fixtures))], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
  }
})

test('given the corrected control when comparing paths then both row boundaries and selective recovery satisfy the observed contract', async () => {
  const { take } = await load('S05', 'after', 'select.mjs')
  const { load: fetch } = await load('S05', 'after', 'load.mjs')
  assert.deepEqual(take([1, 2, 3], 2), [1, 2])
  assert.deepEqual(take([1, 2, 3], 0), [])
  const timeout = Object.assign(new Error('synthetic'), { name: 'TimeoutError' })
  assert.deepEqual(await fetch(async () => { throw timeout }), { retry: true })
  const failure = new TypeError('synthetic')
  await assert.rejects(fetch(async () => { throw failure }), error => error === failure)
})
