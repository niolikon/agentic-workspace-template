import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

// Only the OpenCode schema/registration adapter is replaced. The actual tool
// execute bodies and Node filesystem/Git operations run without mocks.
const source = process.env.NON_REGRESSION_BASELINE || path.resolve('template')
const adapter = `const schema = { describe() { return this }, optional() { return this } };
const tool = Object.assign(value => value, { schema: { string: () => schema } });`

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-contract-'))
  const modules = await mkdtemp(path.join(os.tmpdir(), 'legacy-tools-'))
  try {
    const put = async (name, content) => {
      const destination = path.join(root, name)
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, content)
    }
    const load = async name => {
      const original = await readFile(path.join(source, '.opencode/tools', `${name}.ts`), 'utf8')
      assert.ok(original.includes('import { tool } from "@opencode-ai/plugin"'))
      const destination = path.join(modules, `${name}.ts`)
      await writeFile(destination, original.replace('import { tool } from "@opencode-ai/plugin"', adapter))
      const { default: registered } = await import(pathToFileURL(destination).href)
      return async args => JSON.parse(await registered.execute(args, { directory: root }))
    }
    await run({ root, put, load })
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(modules, { recursive: true, force: true })
  }
}

test('legacy evidence search preserves source scope, snippets and missing-scope boundaries', async () => {
  await fixture(async ({ put, load }) => {
    await put('documents/policy.md', '# Batch policy\nApproved batch limit is 100.\n')
    await put('notes/proposal.md', '# Batch proposal\nUnapproved batch limit is 120.\n')
    const search = await load('workspace_evidence_search')
    const result = await search({ scope: 'documents', query: 'batch limit' })
    assert.ok(result.hits.some(hit => hit.path === 'documents/policy.md' && hit.snippets.some(s => s.includes('100'))))
    assert.ok(result.hits.every(hit => hit.path.startsWith('documents/')))
    const missing = await search({ scope: 'trainings', query: 'batch limit' })
    assert.equal(missing.hitCount, 0)
    assert.ok(missing.warnings.some(w => w.includes('does not exist')))
    await assert.rejects(search({ scope: '../notes', query: 'batch' }), /Unsupported evidence scope/)
  })
})

test('legacy repository inventory discovers independent repositories and retains manifest evidence', async () => {
  await fixture(async ({ root, put, load }) => {
    for (const name of ['Demo.Service', 'Demo.Other']) {
      await put(`repositories/${name}/package.json`, '{"private":true}\n')
      execFileSync('git', ['init', '--quiet', path.join(root, 'repositories', name)])
    }
    const inventory = await load('repository_inventory')
    const result = await inventory({})
    assert.equal(result.repositoryCount, 2)
    assert.deepEqual(result.repositories.map(r => r.name).sort(), ['Demo.Other', 'Demo.Service'])
    assert.ok(result.repositories.every(r => r.manifests.some(m => m.endsWith('package.json'))))
    await assert.rejects(inventory({ root: '..' }), /stay inside/)
  })
})

test('legacy knowledge inventory distinguishes persisted artifacts from missing repository knowledge', async () => {
  await fixture(async ({ put, load }) => {
    await put('knowledge-base/repositories/Demo.Service/build.md', '# Build\nDeclared command only.\n')
    const inventory = await load('knowledge_inventory')
    const result = await inventory({ repository: 'Demo.Service' })
    assert.equal(result.repositories[0].artifactCount, 1)
    assert.equal(result.repositories[0].artifacts[0].path, 'knowledge-base/repositories/Demo.Service/build.md')
    const missing = await inventory({ repository: 'Demo.Other' })
    assert.equal(missing.repositories[0].exists, false)
    await assert.rejects(inventory({ repository: '../escape' }))
  })
})

test('legacy canonical artifact writes require the exact revision and remain confined to knowledge', async () => {
  await fixture(async ({ root, put, load }) => {
    const target = 'knowledge-base/repositories/Demo.Service/overview.md'
    await put(target, '# Overview\r\n\r\nOld observed declaration.\r\n')
    await put('repositories/Demo.Service/source.md', '# Primary source\n')
    const refresh = await load('knowledge_artifact_refresh')
    const inspected = await refresh({ action: 'inspect', artifactPath: target })
    await assert.rejects(refresh({ action: 'replace', artifactPath: target, expectedRevision: 'stale', content: '# Changed\n' }), /Stale/)
    assert.equal(await readFile(path.join(root, target), 'utf8'), inspected.content)
    await assert.rejects(refresh({ action: 'replace', artifactPath: 'repositories/Demo.Service/src.mjs', expectedRevision: inspected.revision, content: 'bad' }))
    await assert.rejects(refresh({ action: 'replace', artifactPath: '../repositories/Demo.Service/source.md', expectedRevision: inspected.revision, content: 'bad' }), /must be a Markdown repository artifact/)
    assert.equal(await readFile(path.join(root, 'repositories/Demo.Service/source.md'), 'utf8'), '# Primary source\n')
    await assert.rejects(refresh({ action: 'replace', artifactPath: target, expectedRevision: inspected.revision, content: '# Same\n# Same\n' }), /duplicate/)
    const result = await refresh({ action: 'replace', artifactPath: target, expectedRevision: inspected.revision, content: '# Overview\n\nNew observed declaration.\n' })
    assert.deepEqual(result.verification, { exactContentPersisted: true, wholeFileReplacement: true, revisionMatched: true })
    assert.equal(await readFile(path.join(root, target), 'utf8'), '# Overview\r\n\r\nNew observed declaration.\r\n')
  })
})
