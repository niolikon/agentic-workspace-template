import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { reviewWorkflow } from '../template/.opencode/skills/review-request-resolution/workflow.ts'

const base = new URL('./review-agent/', import.meta.url)
const references = [
  ...['WI-2', 'WI-7'].map(externalId => ({ family: 'workItemBackends', externalId, backendId: 'work-fixture' })),
  { family: 'changeBackends', externalId: 'CH-7', backendId: 'change-fixture', repository: 'team/api' },
  ...['CH-3', 'CH-8'].map(externalId => ({ family: 'changeBackends', externalId, backendId: 'change-fixture-other', repository: 'team/client' })),
]

async function workspace(overlay, run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'review-agent-'))
  try {
    await cp(new URL(`${overlay}/`, base), root, { recursive: true })
    await run(action => reviewWorkflow(root, 'fixture-session', action), root)
  } finally { await rm(root, { recursive: true, force: true }) }
}

test('given the multi-item fixture when handed off then retain independent repositories and reject stale consent', async () => {
  await workspace('overlay', async call => {
    const first = await call({ action: 'resolve', references })
    assert.equal(first.nextAction, 'request-confirmation')
    assert.equal((await call({ action: 'begin', digest: first.digest })).status, 'invalid-transition')
    await call({ action: 'confirm', digest: first.digest })
    const corrected = await call({ action: 'resolve', references: references.slice(0, 4) })
    assert.equal((await call({ action: 'begin', digest: first.digest })).status, 'invalid-transition')
    await call({ action: 'confirm', digest: corrected.digest })
    const result = await call({ action: 'begin', digest: corrected.digest })
    assert.equal(result.status, 'reviewing')
    assert.equal(result.reviewAllowed, true)
    assert.deepEqual(result.reviewInput, corrected.candidate)
    assert.deepEqual(result.reviewInput.workItems.map(w => w.externalId), ['WI-2', 'WI-7'])
    assert.deepEqual(result.reviewInput.changeRequests.map(c => [c.externalId, c.repository.fullName, c.diff.provenance[0].backend]), [
      ['CH-7', 'team/api', 'change-fixture'], ['CH-3', 'team/client', 'change-fixture-other'],
    ])
  })
})

test('given input-only patches when executed then demonstrate composed cursor behavior and independent count and slice defects', async () => {
  const load = async name => JSON.parse(await readFile(new URL(`overlay/tests/fixtures/review-agent/${name}.json`, base)))
  const api = (await load('change-fixture')).changeRequests[0]
  const client = (await load('change-fixture-other')).changeRequests
  const modules = async change => {
    const additions = change.diff.value.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++')).map(line => line.slice(1)).join('\n')
    return import(`data:text/javascript;base64,${Buffer.from(additions).toString('base64')}`)
  }
  const producer = await modules(api)
  const cursor = await modules(client.find(c => c.externalId === 'CH-3'))
  const count = await modules(client.find(c => c.externalId === 'CH-8'))
  const response = producer.page([{ id: 'last-row' }], 3)
  assert.deepEqual(cursor.nextPage(response, request => request), { cursor: 'last-row' })
  const element = {}
  count.renderPage(response, { getElementById: id => { assert.equal(id, 'count'); return element } })
  assert.equal(element.textContent, '2')
  assert.deepEqual(producer.take([1, 2, 3], 2), [1])
  assert.deepEqual(producer.take([1, 2, 3], 0), [1, 2])
})

test('given unavailable implementation when released then preserve its boundary and all provider input bytes', async () => {
  await workspace('unavailable-overlay', async (call, root) => {
    const file = path.join(root, 'tests/fixtures/review-agent/unavailable-change.json')
    const before = await readFile(file)
    const resolved = await call({ action: 'resolve', references: [
      { family: 'workItemBackends', externalId: 'WI-1', backendId: 'work-fixture' },
      { family: 'changeBackends', externalId: 'CH-1', backendId: 'change-fixture', repository: 'team/api' },
    ] })
    assert.equal(resolved.confirmationAllowed, true)
    await call({ action: 'confirm', digest: resolved.digest })
    const result = await call({ action: 'begin', digest: resolved.digest })
    assert.equal(result.status, 'reviewing')
    const diff = result.reviewInput.changeRequests[0].diff
    assert.equal(diff.state, 'unavailable')
    assert.equal(diff.reason, 'fixture diff not supplied')
    assert.equal('value' in diff, false)
    assert.deepEqual(await readFile(file), before)
  })
})
