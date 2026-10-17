import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { readRest } from "../template/.opencode/skills/review-evidence-acquisition/rest.ts"

const token = 'SYNTHETIC-only:/token+65'
const request = { family: "workItemBackends", backendId: "one" }
const operation = { path: "items", auth: "bearer", decode(payload) {
  if (!payload || !Array.isArray(payload.values)) throw Error("Invalid collection")
  const items = payload.values.filter(v => v && typeof v.id === "string").map(v => ({ id: v.id, title: typeof v.title === "string" ? v.title : null }))
  return { items, partial: items.length !== payload.values.length, next: payload.next }
} }
async function setup(fn, mutate = c => c) {
  const root = await mkdtemp(path.join(os.tmpdir(), "rest-65-"))
  const old = process.env.SYNTHETIC_REST_65
  process.env.SYNTHETIC_REST_65 = token
  await writeFile(path.join(root, "review-backends.json"), JSON.stringify(mutate({ schemaVersion: "review-backends/v1", workItemBackends: [{ id: "one", provider: "synthetic", baseUrl: "https://provider.example.test/api/v1", credentialEnv: "SYNTHETIC_REST_65" }], changeBackends: [] })))
  try { await fn(root) } finally { if (old === undefined) delete process.env.SYNTHETIC_REST_65; else process.env.SYNTHETIC_REST_65 = old; await rm(root, { recursive: true, force: true }) }
}
const response = payload => Response.json(payload)

test("S01 exact backend scope and authentication are transport-only across pages", () => setup(async root => {
  const calls = []
  const result = await readRest(root, request, operation, { transport: async (url, init) => {
    calls.push([url.href, init.method, init.redirect, init.headers.Authorization])
    return response(calls.length === 1 ? { values: [{ id: "1" }], next: "items?page=2" } : { values: [{ id: "2", title: "second" }] })
  } })
  assert.deepEqual(result, { state: "available", pages: 2, items: [{ id: "1", title: null }, { id: "2", title: "second" }] })
  assert.deepEqual(calls, [["https://provider.example.test/api/v1/items", "GET", "manual", `Bearer ${token}`], ["https://provider.example.test/api/v1/items?page=2", "GET", "manual", `Bearer ${token}`]])
}))

test("S02 reflected credential forms are redacted in values and keys", () => setup(async root => {
  const result = await readRest(root, request, { ...operation, decode: p => ({ items: [p] }) }, { transport: async () => response({ [token]: token, encoded: encodeURIComponent(token), basic: Buffer.from(token).toString("base64"), authorization: `Bearer ${token}` }) })
  assert.deepEqual(result.items, [{ '[REDACTED]': '[REDACTED]', encoded: '[REDACTED]', basic: '[REDACTED]', authorization: '[REDACTED]' }])
}))

test("S03 missing credential stops before transport", () => setup(async root => {
  delete process.env.SYNTHETIC_REST_65
  const result = await readRest(root, request, operation, { transport: () => { assert.fail("must not send") } })
  assert.equal(result.failure, "credentials-unavailable")
}))

test("S03 HTTP failures have fixed semantics and no raw diagnostics", () => setup(async root => {
  for (const [status, failure] of [[401,"unauthorized"],[403,"unauthorized"],[404,"not-found"],[429,"rate-limited"],[500,"http-error"],[302,"http-error"]]) {
    const result = await readRest(root, request, operation, { transport: async () => new Response(token, { status, headers: { Location: "https://evil.example.test" } }) })
    assert.deepEqual(result, { state: "unavailable", items: [], pages: 0, failure })
  }
  assert.equal((await readRest(root, request, operation, { transport: async () => { throw Error(token) } })).failure, "network-error")
}))

test("S03 timeout covers stalled transport and response body", () => setup(async root => {
  for (const transport of [() => new Promise(() => {}), async () => new Response(new ReadableStream({ start() {} }))]) {
    assert.equal((await readRest(root, request, operation, { timeoutMs: 15, transport })).failure, "timeout")
  }
}))

test("S04 malformed optional fields do not crash and invalid entries mean partial", () => setup(async root => {
  const result = await readRest(root, request, operation, { transport: async () => response({ values: [null, { id: "1", title: { unexpected: true } }], unknown: { arbitrary: [] } }) })
  assert.deepEqual(result, { state: "partial", pages: 1, items: [{ id: "1", title: null }], failure: "invalid-response" })
}))

test("S04 malformed later page preserves prior evidence", () => setup(async root => {
  let n = 0
  const result = await readRest(root, request, operation, { transport: async () => ++n === 1 ? response({ values: [{ id: "1" }], next: "items?page=2" }) : new Response("{bad") })
  assert.deepEqual(result, { state: "partial", items: [{ id: "1", title: null }], pages: 1, failure: "invalid-response" })
}))

test("S04 pagination cycles and limits retain only completed pages", () => setup(async root => {
  for (const maxPages of [1, 3]) {
    const result = await readRest(root, request, operation, { maxPages, transport: async () => response({ values: [{ id: "1" }], next: "items" }) })
    assert.equal(result.state, "partial")
    assert.equal(result.failure, "pagination-limit")
    assert.equal(result.pages, 1)
  }
}))

test("S04 invalid JSON, decoder exceptions, malformed envelopes and oversized bodies are controlled", () => setup(async root => {
  for (const transport of [async () => new Response("garbage"), async () => response(null), async () => response({ values: null })]) {
    assert.equal((await readRest(root, request, operation, { transport })).failure, "invalid-response")
  }
  assert.equal((await readRest(root, request, operation, { maxBytes: 2, transport: async () => response({ values: [] }) })).failure, "invalid-response")
  for (const decoded of [null, { items: null }, { items: [], partial: "yes" }, { items: [1n] }]) {
    assert.equal((await readRest(root, request, { ...operation, decode: () => decoded }, { transport: async () => response({}) })).failure, "invalid-response")
  }
}))

test("S05 paths cannot escape configured root before authentication", () => setup(async root => {
  for (const endpoint of ["https://evil.example.test/api/v1/items", "/api/v10/items", "../write", "%2e%2e/write", "%252e%252e/write", "//evil.example.test", "items#fragment", "https://u:p@provider.example.test/api/v1/items", "items\\escape"]) {
    assert.equal((await readRest(root, request, { ...operation, path: endpoint }, { transport: () => assert.fail("must not send") })).failure, "invalid-request", endpoint)
  }
}))

test("S05 unsafe next page is partial without a second request", () => setup(async root => {
  let calls = 0
  const result = await readRest(root, request, operation, { transport: async () => { calls++; return response({ values: [{ id: "1" }], next: "https://evil.example.test/steal" }) } })
  assert.equal(calls, 1)
  assert.equal(result.state, "partial")
  assert.equal(result.failure, "invalid-response")
}))

test("S01 auth schemes remain internal and anonymous operations do not read credentials", () => setup(async root => {
  for (const [auth, expected] of [["none", undefined], ["basic", `Basic ${Buffer.from(token).toString("base64")}`], ["private-token", token]]) {
    const result = await readRest(root, request, { ...operation, auth }, { transport: async (_, init) => {
      assert.equal(auth === "private-token" ? init.headers['PRIVATE-TOKEN'] : init.headers.Authorization, expected)
      return response({ values: [] })
    } })
    assert.equal(result.state, "available")
  }
}))

test("S03 invalid config, fixture backend and wrong-family selections fail closed", async () => {
  for (const mutate of [c => ({ ...c, secret: token }), c => { c.workItemBackends[0] = { id: 'one', provider: 'synthetic', baseUrl: 'https://provider.example.test', adapter: 'fixture', fixturePath: 'inputs.json' }; return c }]) {
    await setup(async root => assert.equal((await readRest(root, request, operation)).failure, 'invalid-config'), mutate)
  }
  await setup(async root => assert.equal((await readRest(root, { ...request, family: 'changeBackends' }, operation)).failure, 'invalid-request'))
})

test("S04 increasing pagination is bounded and failed later HTTP remains partial", () => setup(async root => {
  let calls = 0
  const result = await readRest(root, request, operation, { maxPages: 2, transport: async () => response({ values: [{ id: String(++calls) }], next: `items?page=${calls + 1}` }) })
  assert.equal(calls, 2)
  assert.deepEqual(result, { state: 'partial', pages: 2, items: [{ id: '1', title: null }, { id: '2', title: null }], failure: 'pagination-limit' })
  calls = 0
  const failed = await readRest(root, request, operation, { transport: async () => ++calls === 1 ? response({ values: [{ id: '1' }], next: 'items?page=2' }) : new Response(null, { status: 429 }) })
  assert.equal(failed.state, 'partial')
  assert.equal(failed.failure, 'rate-limited')
  assert.deepEqual(failed.items, [{ id: '1', title: null }])
}))

test("S02 transport errors never reach console or evidence", () => setup(async root => {
  const observed = []
  const original = Object.fromEntries(['log','warn','error','info','debug'].map(k => [k, console[k]]))
  let result
  try {
    for (const k of Object.keys(original)) console[k] = (...args) => observed.push(args)
    result = await readRest(root, request, operation, { transport: async () => { throw Error(`Bearer ${token}`) } })
  } finally { Object.assign(console, original) }
  assert.deepEqual(observed, [])
  assert.deepEqual(result, { state: 'unavailable', pages: 0, items: [], failure: 'network-error' })
}))

test("S02 Basic components are redacted independently", () => setup(async root => {
  process.env.SYNTHETIC_REST_65 = 'SYNTHETIC-user:SYNTHETIC-password'
  const result = await readRest(root, request, { ...operation, auth: 'basic', decode: p => ({ items: [p] }) }, { transport: async () => response({ user: 'SYNTHETIC-user', password: 'SYNTHETIC-password' }) })
  assert.deepEqual(result.items, [{ user: '[REDACTED]', password: '[REDACTED]' }])
}))

test("S05 encoded path separators are blocked", () => setup(async root => {
  for (const endpoint of ['items%2fadmin', 'items%5cadmin']) {
    assert.equal((await readRest(root, request, { ...operation, path: endpoint }, { transport: () => assert.fail('must not send') })).failure, 'invalid-request')
  }
}))
