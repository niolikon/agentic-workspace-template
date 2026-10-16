import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { acquireEvidence } from '../template/.opencode/skills/review-evidence-acquisition/acquire.ts'
import { resolveBackend } from '../template/.opencode/skills/review-backend-resolution/resolve.ts'

const fixture = JSON.parse(await readFile(new URL('./fixtures/review-providers/evidence.json', import.meta.url)))
const registry = JSON.parse(await readFile(new URL('./fixtures/review-providers/review-backends.json', import.meta.url)))
const work = {family:'workItemBackends', backendId:'fixture-work', externalId:'WI-58'}
const change = {family:'changeBackends', backendId:'fixture-change', externalId:'PR-7'}
async function workspace(run, modify = () => {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'review-fixtures-'))
  const catalog = structuredClone(fixture), config = structuredClone(registry)
  modify(catalog, config)
  try {
    await mkdir(path.join(root,'tests/fixtures/review-providers'),{recursive:true})
    await writeFile(path.join(root,'review-backends.json'),JSON.stringify(config))
    await writeFile(path.join(root,'tests/fixtures/review-providers/evidence.json'),JSON.stringify(catalog))
    await run(root,catalog)
  } finally { await rm(root,{recursive:true,force:true}) }
}

test('given normal fixture backends then independent family defaults resolve', () => {
  assert.equal(resolveBackend(registry,{family:work.family}).backend.id,work.backendId)
  assert.equal(resolveBackend(registry,{family:change.family}).backend.id,change.backendId)
})
test('given multiple resources then each acquisition returns unchanged canonical evidence', async () => {
  await workspace(async(root,catalog) => {
    for (const [request,entries] of [[work,catalog.workItems],[change,catalog.changeRequests]]) {
      for (const entry of entries) {
        assert.deepEqual(await acquireEvidence(root,{...request,externalId:entry.externalId}),{status:'acquired',evidence:entry})
      }
    }
  })
})
test('given boundaries and threads then repeated reads preserve every field deterministically', async () => {
  await workspace(async root => {
    const first=await acquireEvidence(root,work)
    assert.deepEqual(await acquireEvidence(root,work),first)
    assert.equal(first.evidence.comments.reason,'pagination-incomplete')
    assert.deepEqual(first.evidence.comments.value[1].parent.value,{kind:'comment',externalId:'c1'})
    assert.equal(first.evidence.comments.value[2].parent.value.externalId,'outside-page')
    assert.equal(first.evidence.comments.value[0].thread.value.externalId,'thread-7')
    assert.equal(first.evidence.acceptanceCriteria.state,'ambiguous')
    assert.equal((await acquireEvidence(root,change)).evidence.diff.state,'partial')
  })
})
for (const [name,modify] of [
  ['missing field',c=>delete c.workItems[0].title],
  ['missing backend',c=>delete c.workItems[0].title.provenance[0].backend],
  ['wrong backend',c=>c.workItems[0].title.provenance[0].backend='other'],
  ['provider mismatch',c=>c.workItems[0].provider='jira'],
  ['wrong source identity',c=>c.workItems[0].sourceReference.stableExternalId='other'],
  ['invented unavailable value',c=>c.workItems[0].comments.value[0].updatedAt.value='invented'],
  ['malformed candidate',c=>c.workItems[0].acceptanceCriteria.candidates=[123]],
  ['duplicate resource',c=>c.workItems.push(c.workItems[0])],
  ['duplicate comment',c=>c.workItems[0].comments.value.push(c.workItems[0].comments.value[0])],
  ['self parent',c=>c.workItems[0].comments.value[0].parent.value={kind:'comment',externalId:'c1'}],
  ['parent cycle',c=>c.workItems[0].comments.value[0].parent.value={kind:'comment',externalId:'c2'}],
  ['wrong relationship shape',c=>c.workItems[0].comments.value[1].parent.value={commentId:'c1'}],
  ['conclusion in catalog',c=>c.expectedFindings=[]],
  ['conclusion in resource',c=>c.workItems[0].violations=[]],
  ['live relabeling',c=>c.workItems[0].retrieval.mode='live'],
]) test(`given ${name} then fixture acquisition fails closed`, async () => {
  await workspace(async root => assert.equal((await acquireEvidence(root,work)).status,'invalid-evidence'),modify)
})
for (const [name,modify] of [
  ['missing repository',c=>delete c.changeRequests[0].repository],
  ['malformed ref',c=>c.changeRequests[0].sourceRef.value={}],
  ['malformed diff',c=>c.changeRequests[0].diff.value=15],
  ['malformed files',c=>c.changeRequests[0].changedFiles.value=[{}]],
  ['duplicate change',c=>c.changeRequests.push(c.changeRequests[0])],
]) test(`given ${name} then change acquisition fails closed`, async () => {
  await workspace(async root => assert.equal((await acquireEvidence(root,change)).status,'invalid-evidence'),modify)
})
test('given missing file or resource then return unavailable without evidence', async () => {
  await workspace(async root => {
    assert.deepEqual(await acquireEvidence(root,{...work,externalId:'absent'}),{status:'unavailable',reason:'Fixture resource not found.'})
    await rm(path.join(root,'tests/fixtures/review-providers/evidence.json'))
    assert.equal((await acquireEvidence(root,work)).status,'unavailable')
  })
})
test('given malformed JSON then failure does not echo the payload', async () => {
  await workspace(async root => {
    await writeFile(path.join(root,'tests/fixtures/review-providers/evidence.json'),'SYNTHETIC-DO-NOT-ECHO')
    assert.deepEqual(await acquireEvidence(root,work),{status:'invalid-evidence',reason:'Fixture could not be read or parsed.'})
  })
})
test('given unknown family backend or empty ID then return controlled invalid request', async () => {
  await workspace(async root => {
    for (const patch of [{family:'bad'},{backendId:'absent'},{backendId:'fixture-change'},{externalId:''}]) assert.equal((await acquireEvidence(root,{...work,...patch})).status,'invalid-request')
  })
})
test('given service backend without adapter then no live retrieval occurs', async () => {
  await workspace(async root=>assert.equal((await acquireEvidence(root,work)).status,'unavailable'),(c,r)=>{delete r.workItemBackends[0].adapter;delete r.workItemBackends[0].fixturePath})
})
test('given invalid fixture paths or credentials then registry fails closed', () => {
  for (const fixturePath of ['../outside.json','/outside.json','C:/outside.json','a\\b.json','a/../b','./a','a//b']) {
    const c=structuredClone(registry);c.workItemBackends[0].fixturePath=fixturePath
    assert.equal(resolveBackend(c,work).status,'invalid-config')
  }
  const c=structuredClone(registry);c.workItemBackends[0].credentialEnv='SYNTHETIC_TOKEN'
  assert.equal(resolveBackend(c,work).status,'invalid-config')
})
test('given escaping junction then local acquisition refuses external evidence', async () => {
  const outside=await mkdtemp(path.join(os.tmpdir(),'outside-evidence-'))
  try { await workspace(async root=>{
    const dir=path.join(root,'tests/fixtures/review-providers')
    await rm(dir,{recursive:true,force:true})
    await writeFile(path.join(outside,'evidence.json'),JSON.stringify(fixture))
    await symlink(outside,dir,process.platform==='win32'?'junction':'dir')
    assert.equal((await acquireEvidence(root,work)).status,'invalid-config')
  }) } finally { await rm(outside,{recursive:true,force:true}) }
})
test('given explicit empty or unavailable comments then both remain distinct',async()=>{
  for (const state of ['available','unavailable']) await workspace(async root=>{
    const result=await acquireEvidence(root,work)
    assert.equal(result.status,'acquired');assert.equal(result.evidence.comments.state,state)
  },c=>{const f=c.workItems[0].comments;f.state=state;delete f.reason;if(state==='available')f.value=[];else{delete f.value;f.reason='unsupported'}})
})
test('given repository conflict then request is rejected',async()=>{
  await workspace(async root=>assert.equal((await acquireEvidence(root,{...change,repository:'other/repo'})).status,'invalid-request'))
})

test('given configured repository conflicts with fixture then reject even without request scope',async()=>{
  await workspace(async root=>assert.equal((await acquireEvidence(root,change)).status,'invalid-request'),(c,r)=>r.changeBackends[0].repository='other/repo')
})
test('given unknown threading then preserve unavailable relationships without inference',async()=>{
  await workspace(async root=>{
    const result=await acquireEvidence(root,work)
    assert.equal(result.status,'acquired')
    assert.deepEqual(result.evidence.comments.value[1].parent,fixture.workItems[0].comments.value[1].updatedAt)
    assert.equal(result.evidence.comments.value[1].thread.value.externalId,'thread-7')
  },c=>c.workItems[0].comments.value[1].parent=structuredClone(c.workItems[0].comments.value[1].updatedAt))
})


test('given comment fields without attributable comment origin then reject normalized evidence',async()=>{
  await workspace(async root=>assert.equal((await acquireEvidence(root,work)).status,'invalid-evidence'),c=>c.workItems[0].comments.value[0].content.provenance[0].sourceReference=c.workItems[0].sourceReference)
})
test('given comment provenance through a specific owning-item locator then preserve it',async()=>{
  await workspace(async root=>assert.equal((await acquireEvidence(root,work)).status,'acquired'),c=>{
    const p=c.workItems[0].comments.value[0].content.provenance[0]
    p.sourceReference=c.workItems[0].sourceReference;p.sourceLocator='comments/c1/content'
  })
})
