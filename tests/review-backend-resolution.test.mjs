import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { resolveBackend, resolveFromWorkspace } from "../template/.opencode/skills/review-backend-resolution/resolve.ts"

const config = () => ({
  schemaVersion: "review-backends/v1",
  workItemBackends: [
    { id: "jira-main", provider: "jira", baseUrl: "https://issues.example.test", credentialEnv: "SYNTHETIC_REVIEW_TOKEN" },
    { id: "jira-alt", provider: "jira", baseUrl: "https://other.example.test/jira" },
  ],
  changeBackends: [
    { id: "gitlab-main", provider: "gitlab", baseUrl: "https://git.example.test/api/v4", repository: "team/service" },
    { id: "gitlab-alt", provider: "gitlab", baseUrl: "https://git.example.test/api/v4", repository: "other/service" },
  ],
})
const work = { family: "workItemBackends" }
const change = { family: "changeBackends" }

test("given independent family defaults then exact stable IDs resolve", () => {
  const c = { ...config(), defaults: { workItemBackend: "jira-main", changeBackend: "gitlab-main" } }
  assert.equal(resolveBackend(c, work).backend.id, "jira-main")
  assert.equal(resolveBackend(c, change).backend.id, "gitlab-main")
})
test("given explicit ID then request overrides defaults and hints", () => {
  const c = { ...config(), defaults: { workItemBackend: "jira-main" }, repositoryHints: { repo: { workItemBackend: "jira-main" } } }
  assert.equal(resolveBackend(c, { ...work, backendId: "jira-alt", backendHint: "jira-main", repository: "repo" }).source, "request")
  assert.equal(resolveBackend(c, { ...work, backendId: "jira-alt" }).backend.id, "jira-alt")
})
test("given project default then repository metadata cannot override it", () => {
  const result = resolveBackend({ ...config(), defaults: { workItemBackend: "jira-main" } }, { ...work, backendHint: "jira-alt" })
  assert.equal(result.source, "project")
  assert.equal(result.backend.id, "jira-main")
})
test("given repository hint then it resolves before singleton inference", () => {
  const c = { ...config(), repositoryHints: { repo: { workItemBackend: "jira-alt" } } }
  assert.equal(resolveBackend(c, { ...work, repository: "repo" }).backend.id, "jira-alt")
  assert.equal(resolveBackend(c, { ...work, backendHint: "jira-main" }).source, "repository")
})
test("given conflicting repository hints then neither is selected", () => {
  const c = { ...config(), repositoryHints: { repo: { workItemBackend: "jira-alt" } } }
  assert.deepEqual(resolveBackend(c, { ...work, repository: "repo", backendHint: "jira-main" }), { status: "ambiguous", source: "repository", candidates: ["jira-alt", "jira-main"] })
})
test("given same-provider candidates then ambiguity is stable across array ordering", () => {
  const c = config()
  const first = resolveBackend(c, work)
  c.workItemBackends.reverse()
  assert.deepEqual(resolveBackend(c, work), first)
  assert.deepEqual(first.candidates, ["jira-alt", "jira-main"])
  assert.equal(first.backend, undefined)
})
test("given exact self-hosted URL or repository then only matching backend is inferred", () => {
  assert.equal(resolveBackend(config(), { ...work, resourceUrl: "https://other.example.test/jira/TEAM-1" }).backend.id, "jira-alt")
  assert.equal(resolveBackend(config(), { ...change, repository: "team/service" }).backend.id, "gitlab-main")
})
test("given path or host lookalike then inference does not match", () => {
  for (const resourceUrl of ["https://other.example.test/jira2/1", "https://other.example.test.evil.test/jira/1"]) {
    assert.equal(resolveBackend(config(), { ...work, resourceUrl }).status, "unavailable")
  }
})
test("given invalid explicit ID then valid default is not a fallback", () => {
  for (const backendId of ["unknown", "gitlab-main", ""]) {
    assert.equal(resolveBackend({ ...config(), defaults: { workItemBackend: "jira-main" } }, { ...work, backendId }).status, "invalid-request")
  }
})
test("given selected resource conflict then lower levels are not tried", () => {
  assert.equal(resolveBackend(config(), { ...change, backendId: "gitlab-main", repository: "other/service" }).status, "invalid-request")
  assert.equal(resolveBackend({ ...config(), defaults: { workItemBackend: "jira-main" } }, { ...work, resourceUrl: "https://other.example.test/jira/1" }).status, "invalid-request")
})
test("given no candidates then family remains unavailable independently", () => {
  const c = { ...config(), workItemBackends: [] }
  assert.equal(resolveBackend(c, work).status, "unavailable")
  assert.equal(resolveBackend(c, { ...change, backendId: "gitlab-main" }).status, "resolved")
})
test("given bad configuration then reject without echoing values", () => {
  const variants = [
    c => { c.workItemBackends[0].token = "SYNTHETIC-DO-NOT-ECHO" },
    c => { c.workItemBackends[0].baseUrl = "https://user:SYNTHETIC-DO-NOT-ECHO@example.test" },
    c => { c.workItemBackends[0].baseUrl += "?token=SYNTHETIC-DO-NOT-ECHO" },
    c => { c.workItemBackends[0].baseUrl = "http://example.test" },
    c => { c.workItemBackends[0].credentialEnv = "{env:SYNTHETIC-DO-NOT-ECHO}" },
    c => { c.changeBackends[0].id = c.workItemBackends[0].id },
    c => { c.defaults = { workItemBackend: "gitlab-main" } },
    c => { c.repositoryHints = { repo: { changeBackend: "missing" } } },
    c => { delete c.workItemBackends },
    c => { c.schemaVersion = "wrong" },
  ]
  for (const mutate of variants) {
    const c = config(); mutate(c)
    const result = resolveBackend(c, work)
    assert.equal(result.status, "invalid-config")
    assert.ok(!JSON.stringify(result).includes("SYNTHETIC-DO-NOT-ECHO"))
  }
})
test("given credential reference then resolution never reads the referenced credential", () => {
  const originalEnv = process.env
  process.env = new Proxy(originalEnv, { get(target, key) {
    if (key === "SYNTHETIC_REVIEW_TOKEN") throw new Error("Credential read attempted")
    return Reflect.get(target, key)
  } })
  try {
    const result = resolveBackend(config(), { ...work, backendId: "jira-main" })
    assert.deepEqual(result.backend, { id: "jira-main", provider: "jira", baseUrl: "https://issues.example.test" })
    assert.ok(!JSON.stringify(result).includes("SYNTHETIC"))
  } finally { process.env = originalEnv }
})
test("given mixed-case environment reference then selection accepts the name without returning it", () => {
  const c = config()
  c.workItemBackends[0].credentialEnv = "Review_Token"
  const result = resolveBackend(c, { ...work, backendId: "jira-main" })
  assert.equal(result.status, "resolved")
  assert.ok(!JSON.stringify(result).includes("Review_Token"))
})
test("given unknown or wrong-family metadata hint then inference is not used", () => {
  for (const backendHint of ["missing", "gitlab-main"]) {
    assert.equal(resolveBackend(config(), { ...work, backendHint }).status, "invalid-request")
  }
})
test("given unsafe source URL then reject without echo", () => {
  for (const resourceUrl of ["https://user:secret@example.test", "https://example.test?secret=x", "https://example.test#secret", "invalid"]) {
    assert.equal(resolveBackend(config(), { ...work, resourceUrl }).status, "invalid-request")
  }
})
test("given missing malformed or valid root file then discovery reports distinct states", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "review-resolve-"))
  try {
    assert.equal((await resolveFromWorkspace(root, work)).status, "unavailable")
    await mkdir(path.join(root, "repositories"))
    await writeFile(path.join(root, "repositories", "review-backends.json"), JSON.stringify(config()))
    assert.equal((await resolveFromWorkspace(root, work)).status, "unavailable")
    await writeFile(path.join(root, "review-backends.json"), "invalid SYNTHETIC-DO-NOT-ECHO")
    assert.equal((await resolveFromWorkspace(root, work)).status, "invalid-config")
    await writeFile(path.join(root, "review-backends.json"), JSON.stringify(config()))
    assert.equal((await resolveFromWorkspace(root, { ...work, backendId: "jira-main" })).backend.id, "jira-main")
  } finally { await rm(root, { recursive: true, force: true }) }
})
