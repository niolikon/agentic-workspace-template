import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { acquireEvidence } from '../template/.opencode/skills/review-evidence-acquisition/acquire.ts'

const fixtures = new URL('./fixtures/change-evidence/', import.meta.url)
const catalog = JSON.parse(await readFile(new URL('evidence.json', fixtures)))
const change = {family: 'changeBackends', backendId: 'fixture-change', externalId: 'PR-7'}
async function workspace(run, modify = () => {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'change-evidence-'))
  try {
    await cp(fixtures, path.join(root, 'tests/fixtures/change-evidence'), {recursive: true})
    await cp(new URL('review-backends.json', fixtures), path.join(root, 'review-backends.json'))
    const input = structuredClone(catalog)
    modify(input)
    await writeFile(path.join(root, 'tests/fixtures/change-evidence/evidence.json'), JSON.stringify(input))
    await run(root, input)
  } finally { await rm(root, {recursive: true, force: true}) }
}

test('given multiple repository changes when acquired repeatedly then preserve independent canonical evidence and input bytes', async () => {
  await workspace(async (root, input) => {
    const file = path.join(root, 'tests/fixtures/change-evidence/evidence.json')
    const before = await readFile(file)
    const results = []
    for (const entry of input.changeRequests) {
      const request = {...change, externalId: entry.externalId, repository: entry.repository.stableId}
      const first = await acquireEvidence(root, request)
      assert.deepEqual(first, {status: 'acquired', evidence: entry})
      assert.deepEqual(await acquireEvidence(root, request), first)
      results.push(first)
    }
    assert.notEqual(results[0].evidence.repository.stableId, results[1].evidence.repository.stableId)
    assert.deepEqual(await readFile(file), before)
  })
})

test('given checks and partial discussions when acquired then preserve coverage and attributable fields independently', async () => {
  await workspace(async root => {
    const result = await acquireEvidence(root, change)
    assert.deepEqual(result, {status: 'acquired', evidence: catalog.changeRequests[0]})
    assert.equal(result.evidence.checks.value[0].conclusion.value, 'success')
    assert.equal(result.evidence.reviewDiscussions.reason, 'pagination-incomplete')
    assert.equal(result.evidence.diff.state, 'partial')
  })
})

for (const state of ['available', 'partial', 'ambiguous', 'unavailable']) {
  test(`given ${state} optional metadata when acquired then preserve boundaries without inference`, async () => {
    await workspace(async (root, input) => {
      assert.deepEqual(await acquireEvidence(root, change), {status: 'acquired', evidence: input.changeRequests[0]})
    }, input => {
      for (const key of ['checks', 'reviewDiscussions']) {
        const field = input.changeRequests[0][key]
        field.state = state
        if (state === 'available') { field.value = []; delete field.reason }
        if (state === 'partial') field.reason = 'pagination-incomplete'
        if (state === 'ambiguous') { field.candidates = [field.value]; delete field.value; field.reason = 'conflicting-observations' }
        if (state === 'unavailable') { delete field.value; field.reason = 'unsupported' }
      }
    })
  })
}

test('given multiple backend families and providers when composed then canonical review input retains each origin', async () => {
  await workspace(async root => {
    const item = await acquireEvidence(root, {family: 'workItemBackends', backendId: 'fixture-work', externalId: 'WI-59'})
    const first = await acquireEvidence(root, change)
    const second = await acquireEvidence(root, {...change, backendId: 'fixture-change-other', externalId: 'PR-8'})
    assert.equal(item.status, 'acquired'); assert.equal(first.status, 'acquired'); assert.equal(second.status, 'acquired')
    const review = {schemaVersion: 'review-evidence/v1', workItem: item.evidence, changeRequests: [first.evidence, second.evidence]}
    assert.deepEqual(review.workItem, catalog.workItems[1])
    assert.deepEqual(review.changeRequests[0], catalog.changeRequests[0])
    const other = JSON.parse(await readFile(new URL('other.json', fixtures)))
    assert.deepEqual(review.changeRequests[1], other.changeRequests[0])
    assert.equal(review.changeRequests[1].title.provenance[0].backend, 'fixture-change-other')
  })
})

for (const [name, modify] of [
  ['null checks', c => c.checks = null],
  ['raw checks', c => c.checks = {jobs: []}],
  ['unexpected check value', c => c.checks.value = [17]],
  ['unattributed check', c => c.checks.value[0].status.provenance[0].sourceReference = c.sourceReference],
  ['missing check backend', c => delete c.checks.value[0].name.provenance[0].backend],
  ['duplicate check', c => c.checks.value.push(c.checks.value[0])],
  ['invented unavailable conclusion', c => c.checks.value[0].conclusion = {...c.checks.value[0].conclusion, state: 'unavailable', reason: 'unsupported'}],
  ['raw discussion nesting', c => c.reviewDiscussions.value = [{notes: []}]],
  ['duplicate discussion', c => c.reviewDiscussions.value.push(c.reviewDiscussions.value[0])],
  ['discussion self parent', c => c.reviewDiscussions.value[0].parent.value = {kind: 'comment', externalId: c.reviewDiscussions.value[0].externalId}],
]) test(`given ${name} when acquired then fail in a controlled way and keep other domains and backends usable`, async () => {
  await workspace(async root => {
    assert.deepEqual(await acquireEvidence(root, change), {status: 'invalid-evidence', reason: 'Malformed or duplicate normalized fixture evidence.'})
    assert.equal((await acquireEvidence(root, {...change, backendId: 'fixture-change-other', externalId: 'PR-8'})).status, 'acquired')
    assert.equal((await acquireEvidence(root, {family: 'workItemBackends', backendId: 'fixture-work', externalId: 'WI-59'})).status, 'acquired')
  }, input => modify(input.changeRequests[0]))
})

test('given missing change followed by a valid change when acquired then preserve the healthy result', async () => {
  await workspace(async root => {
    assert.equal((await acquireEvidence(root, {...change, externalId: 'ABSENT-60'})).status, 'unavailable')
    assert.deepEqual(await acquireEvidence(root, change), {status: 'acquired', evidence: catalog.changeRequests[0]})
  })
})
