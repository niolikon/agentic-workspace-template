import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, rm, readdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { acquireEvidence } from '../template/.opencode/skills/review-evidence-acquisition/acquire.ts'
import { reviewWorkflow } from '../template/.opencode/skills/review-request-resolution/workflow.ts'

const fixtures = new URL('./fixtures/requirement-assessment/', import.meta.url)
async function withCase(id, run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'requirement-assessment-'))
  try {
    await cp(new URL(id + '/', fixtures), path.join(root, 'tests/fixtures/requirement-assessment', id), { recursive: true })
    await cp(new URL(id + '/review-backends.json', fixtures), path.join(root, 'review-backends.json'))
    const load = async name => JSON.parse(await readFile(new URL(`${id}/${name}.json`, fixtures)))
    await run(root, await load('references'), await load('evidence'))
  } finally { await rm(root, { recursive: true, force: true }) }
}

for (const id of ['S01','S02','S03','S04','S05','S06','S07','S09']) {
  test(`given ${id} evidence when acquired and handed off then preserve every field and originating source`, async () => {
    await withCase(id, async (root, references, catalog) => {
      const before = await readFile(path.join(root, 'review-backends.json'))
      const results = []
      for (const reference of references) {
        const result = await acquireEvidence(root, reference)
        assert.equal(result.status, 'acquired', JSON.stringify(result))
        results.push(result.evidence)
      }
      assert.deepEqual(results, [...catalog.workItems, ...catalog.changeRequests])
      const resolved = await reviewWorkflow(root, 'assessment-test', { action: 'resolve', references })
      assert.deepEqual(resolved.unresolved, [])
      assert.equal(resolved.reviewAllowed, false)
      assert.equal((await reviewWorkflow(root, 'assessment-test', { action: 'begin', digest: resolved.digest })).status, 'invalid-transition')
      await reviewWorkflow(root, 'assessment-test', { action: 'confirm', digest: resolved.digest })
      const begun = await reviewWorkflow(root, 'assessment-test', { action: 'begin', digest: resolved.digest })
      assert.deepEqual(begun.reviewInput, { schemaVersion: 'review-evidence/v2', workItems: catalog.workItems, changeRequests: catalog.changeRequests })
      assert.deepEqual(await readFile(path.join(root, 'review-backends.json')), before)
      for (const b of ['workItemBackends','changeBackends']) {
        const config = JSON.parse(before)
        for (const backend of config[b]) {
          assert.deepEqual(await readFile(path.join(root, backend.fixturePath)), await readFile(new URL(id + '/' + path.basename(backend.fixturePath), fixtures)))
        }
      }
    })
  })
}

test('given provider renamed evidence when acquired then behavior-bearing fields retain the same values and states', async () => {
  const load = async id => JSON.parse(await readFile(new URL(id + '/evidence.json', fixtures)))
  const semanticFields = catalog => [...catalog.workItems, ...catalog.changeRequests].map(entry => Object.fromEntries(Object.entries(entry).filter(([,v]) => v && typeof v === 'object' && 'state' in v).map(([k,v]) => [k, { state:v.state, value:v.value, reason:v.reason }])))
  assert.deepEqual(semanticFields(await load('S01')), semanticFields(await load('S09')))
})

test('given assessment fixtures when inspected then provider catalogs contain inputs only and preserve chronology and truncation', async () => {
  const load = async id => JSON.parse(await readFile(new URL(id + '/evidence.json', fixtures)))
  const chronological = (await load('S05')).workItems[0]
  assert.equal(chronological.description.value, (await load('S01')).workItems[0].description.value)
  assert.equal(chronological.comments.value.length, 2)
  assert.equal(chronological.comments.value[0].updatedAt.state, 'unavailable')
  assert.equal((await load('S06')).changeRequests[0].diff.state, 'partial')
  assert.equal((await load('S06')).workItems[0].acceptanceCriteria.state, 'ambiguous')
  assert.equal((await load('S07')).workItems.length, 2)
  assert.equal((await load('S07')).changeRequests.length, 3)
  for (const id of ['S01','S02','S03','S04','S05','S06','S07','S09']) {
    for (const file of await readdir(new URL(id + '/', fixtures))) {
      if (!file.endsWith('.json')) continue
      const data = JSON.parse(await readFile(new URL(`${id}/${file}`, fixtures)))
      const visit = value => {
        if (Array.isArray(value)) return value.forEach(visit)
        if (!value || typeof value !== 'object') return
        for (const [key, child] of Object.entries(value)) {
          assert.equal(['verdict','findings','expected','assessment','violations'].includes(key), false, `${id}/${file}: ${key}`)
          visit(child)
        }
      }
      visit(data)
    }
  }
})
