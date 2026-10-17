import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, writeFile, rm, readdir, symlink, mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { reviewWorkflow } from '../template/.opencode/skills/review-request-resolution/workflow.ts'

const fixtures = new URL('./fixtures/change-evidence/', import.meta.url)
const catalog = JSON.parse(await readFile(new URL('evidence.json', fixtures)))
const other = JSON.parse(await readFile(new URL('other.json', fixtures)))
const references = [
  { family: 'workItemBackends', externalId: 'WI-58', backendId: 'fixture-work' },
  { family: 'workItemBackends', externalId: 'WI-59', backendId: 'fixture-work' },
  { family: 'changeBackends', externalId: 'PR-7', backendId: 'fixture-change', repository: 'team/service' },
  { family: 'changeBackends', externalId: 'PR-8', backendId: 'fixture-change-other', repository: 'team/client' },
]
async function workspace(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'review-resolution-'))
  try {
    await cp(fixtures, path.join(root, 'tests/fixtures/change-evidence'), { recursive: true })
    await cp(new URL('review-backends.json', fixtures), path.join(root, 'review-backends.json'))
    await run((action, session = 'user-session') => reviewWorkflow(root, session, action), root)
  } finally { await rm(root, { recursive: true, force: true }) }
}

test('given multiple items and cross-backend changes when resolved then preserve independent canonical evidence and await confirmation', async () => {
  await workspace(async call => {
    const result = await call({ action: 'resolve', references })
    assert.equal(result.state, 'AWAITING_CONFIRMATION')
    assert.equal(result.revision, 1)
    assert.deepEqual(result.unresolved, [])
    assert.equal(result.confirmationAllowed, true)
    assert.equal(result.reviewAllowed, false)
    assert.equal(result.nextAction, 'request-confirmation')
    assert.deepEqual(result.candidate, { schemaVersion: 'review-evidence/v2', workItems: catalog.workItems, changeRequests: [catalog.changeRequests[0], other.changeRequests[0]] })
    assert.deepEqual(result.resolutions.map(r => r.backendId), references.map(r => r.backendId))
    assert.equal('reviewInput' in result, false)
  })
})

for (const [items, changes] of [[1, 2], [2, 1]]) {
  test(`given ${items} items and ${changes} changes when confirmed then require no positional or equal-length mapping`, async () => {
    await workspace(async call => {
      const result = await call({ action: 'resolve', references: [...references.slice(0, items), ...references.slice(2, 2 + changes)] })
      assert.deepEqual(result.unresolved, [])
      assert.equal((await call({ action: 'confirm', digest: result.digest })).state, 'CONFIRMED')
      const begun = await call({ action: 'begin', digest: result.digest })
      assert.equal(begun.reviewInput.workItems.length, items)
      assert.equal(begun.reviewInput.changeRequests.length, changes)
      assert.equal('relationships' in begun.reviewInput, false)
    })
  })
}

test('given resolved evidence when begin is called before confirmation then block implementation handoff', async () => {
  await workspace(async call => {
    const result = await call({ action: 'resolve', references })
    assert.equal((await call({ action: 'begin', digest: result.digest })).status, 'invalid-transition')
    assert.equal((await call({ action: 'status' })).state, 'AWAITING_CONFIRMATION')
  })
})

test('given acquired implementation evidence when presented then preview only scope metadata and explicit evidence limits', async () => {
  await workspace(async call => {
    const result = await call({ action: 'resolve', references })
    assert.deepEqual(result.scopePreview.workItems.map(item => item.externalId), ['WI-58', 'WI-59'])
    assert.deepEqual(result.scopePreview.changeRequests.map(item => item.backends), [['fixture-change'], ['fixture-change-other']])
    assert.deepEqual(result.scopePreview.changeRequests[0].title, { state: 'available', value: 'Add audit capture' })
    assert.ok(result.scopePreview.changeRequests[0].limits.some(field => field.field === 'diff' && field.state === 'partial' && field.reason === 'truncated'))
    assert.equal(JSON.stringify(result.scopePreview).includes('audit(item.id)'), false)
    assert.equal('comments' in result.scopePreview.workItems[0], false)
    assert.deepEqual(result.candidate.changeRequests[0], catalog.changeRequests[0])
  })
})

test('given an ambiguous backend when resolved then expose candidates and preserve healthy acquisitions', async () => {
  await workspace(async (call, root) => {
    const config = JSON.parse(await readFile(path.join(root, 'review-backends.json')))
    delete config.defaults
    await writeFile(path.join(root, 'review-backends.json'), JSON.stringify(config))
    const result = await call({ action: 'resolve', references: [references[0], { family: 'changeBackends', externalId: 'PR-7' }] })
    assert.deepEqual(result.resolutions[1].candidates, ['fixture-change', 'fixture-change-other'])
    assert.deepEqual(result.candidate.workItems, [catalog.workItems[0]])
    assert.equal((await call({ action: 'confirm', digest: result.digest })).status, 'invalid-transition')
  })
})

test('given an explicit backend conflicting with the project default when resolved then honor the request', async () => {
  await workspace(async call => {
    const result = await call({ action: 'resolve', references: [references[0], references[3]] })
    assert.equal(result.resolutions[1].backendId, 'fixture-change-other')
    assert.deepEqual(result.candidate.changeRequests, other.changeRequests)
  })
})

test('given a backend supplied as an unsupported hint when resolved then reject it instead of silently using the default', async () => {
  await workspace(async call => {
    const { backendId, ...change } = references[3]
    const result = await call({ action: 'resolve', references: [references[0], { ...change, backendHint: backendId }] })
    assert.deepEqual(result.candidate.changeRequests, [])
    assert.ok(result.unresolved.some(reason => reason.includes('Reference 1')))
    assert.equal((await call({ action: 'confirm', digest: result.digest })).status, 'invalid-transition')
  })
})

test('given a missing requested resource when resolved then retain the failure instead of narrowing scope', async () => {
  await workspace(async call => {
    const result = await call({ action: 'resolve', references: [...references, { ...references[0], externalId: 'MISSING' }] })
    assert.equal(result.resolutions.at(-1).status, 'unavailable')
    assert.equal(result.candidate.workItems.length, 2)
    assert.equal((await call({ action: 'confirm', digest: result.digest })).status, 'invalid-transition')
  })
})

test('given an unidentified natural-language reference when resolved then block confirmation despite acquired objects', async () => {
  await workspace(async call => {
    const result = await call({ action: 'resolve', references, unresolved: ['Which deployment ticket?'] })
    assert.deepEqual(result.unresolved, ['Which deployment ticket?'])
    assert.equal(result.confirmationAllowed, false)
    assert.equal(result.reviewAllowed, false)
    assert.equal(result.nextAction, 'clarify-scope')
    assert.equal((await call({ action: 'confirm', digest: result.digest })).status, 'invalid-transition')
  })
})

for (const scope of [[], references.slice(0, 2), references.slice(2), [null], [{ family: 'workItemBackends', externalId: '' }]]) {
  test(`given incomplete scope ${JSON.stringify(scope)} when resolved then prevent confirmation`, async () => {
    await workspace(async call => {
      const result = await call({ action: 'resolve', references: scope })
      assert.ok(result.unresolved.length)
      assert.equal((await call({ action: 'confirm', digest: result.digest })).status, 'invalid-transition')
    })
  })
}

test('given confirmed scope when corrected then invalidate previous confirmation and require the new digest', async () => {
  await workspace(async call => {
    const original = await call({ action: 'resolve', references })
    await call({ action: 'confirm', digest: original.digest })
    const correction = await call({ action: 'resolve', references: [references[1], references[3]] })
    assert.equal(correction.revision, 2)
    assert.notEqual(correction.digest, original.digest)
    assert.equal((await call({ action: 'begin', digest: original.digest })).status, 'invalid-transition')
    assert.equal((await call({ action: 'confirm', digest: original.digest })).status, 'invalid-transition')
    assert.equal((await call({ action: 'begin', digest: correction.digest })).status, 'invalid-transition')
    assert.equal((await call({ action: 'confirm', digest: correction.digest })).state, 'CONFIRMED')
    assert.deepEqual((await call({ action: 'begin', digest: correction.digest })).reviewInput, correction.candidate)
  })
})

test('given unchanged references when resolved again then still require fresh confirmation', async () => {
  await workspace(async call => {
    const first = await call({ action: 'resolve', references })
    const second = await call({ action: 'resolve', references })
    assert.deepEqual(first.candidate, second.candidate)
    assert.notEqual(first.digest, second.digest)
    assert.equal((await call({ action: 'confirm', digest: first.digest })).status, 'invalid-transition')
  })
})

test('given a confirmed snapshot when fixture contents change then downstream receives the exact frozen evidence', async () => {
  await workspace(async (call, root) => {
    const result = await call({ action: 'resolve', references })
    await call({ action: 'confirm', digest: result.digest })
    await writeFile(path.join(root, 'tests/fixtures/change-evidence/evidence.json'), '{}')
    const handoff = await call({ action: 'begin', digest: result.digest })
    assert.equal(handoff.reviewAllowed, true)
    assert.equal(handoff.confirmationAllowed, false)
    assert.equal(handoff.nextAction, 'review')
    assert.deepEqual(handoff.reviewInput, result.candidate)
    assert.equal(handoff.reviewInput.changeRequests[0].diff.state, 'partial')
    assert.deepEqual((await call({ action: 'status' })).candidate, result.candidate)
    assert.equal((await call({ action: 'begin', digest: result.digest })).status, 'invalid-transition')
  })
})

test('given another session when confirming then isolate state and prevent cross-session authorization', async () => {
  await workspace(async call => {
    const result = await call({ action: 'resolve', references })
    assert.equal((await call({ action: 'status' }, 'other-session')).status, 'not-requested')
    assert.equal((await call({ action: 'confirm', digest: result.digest }, 'other-session')).status, 'invalid-transition')
  })
})

test('given duplicate references when resolved then deduplicate canonical identities without losing requested reference results', async () => {
  await workspace(async call => {
    const result = await call({ action: 'resolve', references: [...references, references[0], references[3]] })
    assert.equal(result.resolutions.length, 6)
    assert.deepEqual(result.candidate.workItems, catalog.workItems)
    assert.deepEqual(result.candidate.changeRequests, [catalog.changeRequests[0], other.changeRequests[0]])
  })
})

test('given concurrent corrections when resolved then serialize revisions without stale overwrites', async () => {
  await workspace(async call => {
    const results = await Promise.all([call({ action: 'resolve', references }), call({ action: 'resolve', references: [references[1], references[3]] })])
    assert.deepEqual(results.map(r => r.revision), [1, 2])
    assert.deepEqual((await call({ action: 'status' })).candidate, results[1].candidate)
  })
})

test('given corrupt persisted state when resumed then block handoff with a controlled failure', async () => {
  await workspace(async (call, root) => {
    await call({ action: 'resolve', references })
    const directory = path.join(root, '.opencode/.tmp/reviews')
    const [file] = await readdir(directory)
    await writeFile(path.join(directory, file), 'not json')
    assert.equal((await call({ action: 'begin', digest: 'anything' })).status, 'invalid-state')
  })
})

test('given provider failures when resolved then leave registry and fixture bytes unchanged', async () => {
  await workspace(async (call, root) => {
    const names = ['review-backends.json', 'tests/fixtures/change-evidence/evidence.json', 'tests/fixtures/change-evidence/other.json']
    const before = await Promise.all(names.map(file => readFile(path.join(root, file))))
    await call({ action: 'resolve', references: [...references, { ...references[3], repository: 'wrong/repository' }] })
    assert.deepEqual(await Promise.all(names.map(file => readFile(path.join(root, file)))), before)
  })
})

test('given the same external ID on independent backends when resolved then keep both source identities', async () => {
  await workspace(async (call, root) => {
    const config = JSON.parse(await readFile(path.join(root, 'review-backends.json')))
    config.workItemBackends.push({ ...config.workItemBackends[0], id: 'another-work', fixturePath: 'another.json' })
    await writeFile(path.join(root, 'review-backends.json'), JSON.stringify(config))
    await writeFile(path.join(root, 'another.json'), JSON.stringify(catalog).replaceAll('fixture-work', 'another-work'))
    const result = await call({ action: 'resolve', references: [references[0], { ...references[0], backendId: 'another-work' }, references[2]] })
    assert.deepEqual(result.unresolved, [])
    assert.equal(result.candidate.workItems.length, 2)
    assert.deepEqual(result.candidate.workItems.map(item => item.title.provenance[0].backend), ['fixture-work', 'another-work'])
  })
})

test('given malformed canonical evidence when resolved then block confirmation while retaining healthy references', async () => {
  await workspace(async (call, root) => {
    const invalid = structuredClone(catalog)
    delete invalid.workItems[0].title.provenance[0].backend
    await writeFile(path.join(root, 'tests/fixtures/change-evidence/evidence.json'), JSON.stringify(invalid))
    const result = await call({ action: 'resolve', references })
    assert.equal(result.resolutions[0].status, 'invalid-evidence')
    assert.deepEqual(result.candidate.changeRequests, [catalog.changeRequests[0], other.changeRequests[0]])
    assert.equal((await call({ action: 'confirm', digest: result.digest })).status, 'invalid-transition')
  })
})

test('given modified persisted evidence when resumed then detect digest mismatch and refuse handoff', async () => {
  await workspace(async (call, root) => {
    const resolved = await call({ action: 'resolve', references })
    await call({ action: 'confirm', digest: resolved.digest })
    const directory = path.join(root, '.opencode/.tmp/reviews')
    const [file] = await readdir(directory)
    const saved = JSON.parse(await readFile(path.join(directory, file)))
    saved.candidate.workItems[0].title.value = 'tampered'
    await writeFile(path.join(directory, file), JSON.stringify(saved))
    assert.equal((await call({ action: 'begin', digest: resolved.digest })).status, 'invalid-state')
  })
})

test('given a state directory pointing outside the workspace when resolved then reject it before storing evidence', async () => {
  await workspace(async (call, root) => {
    const outside = await mkdtemp(path.join(os.tmpdir(), 'review-state-outside-'))
    try {
      await mkdir(path.join(root, '.opencode'))
      await symlink(outside, path.join(root, '.opencode/.tmp'), process.platform === 'win32' ? 'junction' : 'dir')
      assert.equal((await call({ action: 'resolve', references })).status, 'invalid-state')
      assert.deepEqual(await readdir(outside), [])
    } finally {
      await rm(path.join(root, '.opencode/.tmp'), { recursive: true, force: true })
      await rm(outside, { recursive: true, force: true })
    }
  })
})
