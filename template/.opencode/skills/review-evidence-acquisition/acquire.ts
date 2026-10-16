import { readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"
import { resolveFromWorkspace } from "../review-backend-resolution/resolve.ts"

export type EvidenceRequest = {
  family: "workItemBackends" | "changeBackends"
  backendId: string
  externalId: string
  repository?: string
}
type FailureStatus = "unavailable" | "invalid-request" | "invalid-config" | "invalid-evidence"
export type EvidenceResult =
  | { status: "acquired"; evidence: Record<string, unknown> }
  | { status: FailureStatus; reason: string }

type Obj = Record<string, any>
const object = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0
const only = (v: Obj, keys: string[]) => Object.keys(v).every(k => keys.includes(k))
const array = (v: unknown, check: (x: any) => boolean): boolean => Array.isArray(v) && v.every(check)
const inside = (root: string, file: string) => { const rel = path.relative(root, file); return rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel) }
function source(v: unknown, provider: string): boolean {
  if (!object(v) || v.provider !== provider || !text(v.stableExternalId)) return false
  if (v.url !== undefined) {
    try { const u = new URL(v.url); if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash) return false } catch { return false }
  }
  return true
}
const retrieval = (v: unknown): boolean => object(v) && text(v.capability) && text(v.mode)

function field(v: unknown, check: (x: any) => boolean, provider: string, backend: string): boolean {
  if (!object(v) || !array(v.provenance, p => object(p) && p.provider === provider && text(p.backend) && source(p.sourceReference, provider) && retrieval(p.retrieval)) || !v.provenance.length) return false
  if (!v.provenance.some((p: Obj) => p.backend === backend && p.retrieval.mode === "fixture")) return false
  if (v.state === "available") return only(v, ["state", "value", "provenance"]) && check(v.value)
  if (v.state === "partial") return only(v, ["state", "value", "reason", "provenance"]) && text(v.reason) && check(v.value)
  if (v.state === "ambiguous") return only(v, ["state", "candidates", "reason", "provenance"]) && text(v.reason) && (v.candidates === undefined || array(v.candidates, check))
  return v.state === "unavailable" && only(v, ["state", "reason", "provenance"]) && text(v.reason)
}
const relationship = (v: unknown, kind: string) => object(v) && ((v.kind === "none" && only(v, ["kind"])) || (v.kind === kind && text(v.externalId) && only(v, ["kind", "externalId"])))

export function validEvidence(v: unknown, family: EvidenceRequest["family"], provider: string, backend: string): v is Obj {
  if (!object(v) || v.provider !== provider || !text(v.externalId) || !source(v.sourceReference, provider) || v.sourceReference.stableExternalId !== v.externalId || !retrieval(v.retrieval) || v.retrieval.mode !== "fixture") return false
  if (v.providerExtensions !== undefined && !object(v.providerExtensions)) return false
  const f = (x: unknown, check: (x: any) => boolean) => field(x, check, provider, backend)
  const string = (x: unknown) => typeof x === "string"
  if (!f(v.title, string) || !f(v.description, string)) return false
  if (family === "workItemBackends") {
    if (!only(v, ["provider", "externalId", "title", "description", "comments", "acceptanceCriteria", "labels", "type", "status", "sourceReference", "retrieval", "providerExtensions"])) return false
    if (!f(v.acceptanceCriteria, x => array(x, string)) || !f(v.labels, x => array(x, string)) || !f(v.type, string) || !f(v.status, string)) return false
    const comment = (c: unknown) => {
      if (!object(c) || !only(c, ["externalId", "content", "author", "createdAt", "updatedAt", "parent", "thread", "sourceReference", "retrieval"]) || !text(c.externalId) || !source(c.sourceReference, provider) || c.sourceReference.stableExternalId !== c.externalId || !retrieval(c.retrieval) || c.retrieval.mode !== "fixture") return false
      const commentField = (key: string, check: (x: any) => boolean) => f(c[key], check) && c[key].provenance.some((p: Obj) => p.sourceReference.stableExternalId === c.externalId || (p.sourceReference.stableExternalId === v.externalId && text(p.sourceLocator) && p.sourceLocator.includes(c.externalId)))
      return commentField("content", string) && commentField("author", a => object(a) && only(a, ["externalId", "displayName"]) && (text(a.externalId) || text(a.displayName))) && commentField("createdAt", text) && commentField("updatedAt", text) && commentField("parent", r => relationship(r, "comment")) && commentField("thread", r => relationship(r, "thread"))
    }
    if (!f(v.comments, x => array(x, comment))) return false
    const collections = v.comments.state === "ambiguous" ? v.comments.candidates ?? [] : [v.comments.value ?? []]
    for (const comments of collections) {
      const parents = new Map<string, string>()
      const ids = new Set<string>()
      for (const c of comments) {
        if (ids.has(c.externalId)) return false
        ids.add(c.externalId)
        if (["available", "partial"].includes(c.parent.state) && c.parent.value.kind === "comment") parents.set(c.externalId, c.parent.value.externalId)
      }
      for (const id of ids) {
        const seen = new Set<string>([id])
        let parent = parents.get(id)
        while (parent !== undefined) { if (seen.has(parent)) return false; seen.add(parent); parent = parents.get(parent) }
      }
    }
    return true
  }
  if (!only(v, ["provider", "externalId", "repository", "title", "description", "sourceRef", "targetRef", "commits", "changedFiles", "diff", "reviewState", "sourceReference", "retrieval", "providerExtensions"])) return false
  const repo = v.repository
  if (!object(repo) || repo.provider !== provider || !text(repo.stableId) || !text(repo.name) || !source(repo.sourceReference, provider)) return false
  const ref = (r: unknown) => object(r) && text(r.name) && (r.commitId === undefined || text(r.commitId))
  return f(v.sourceRef, ref) && f(v.targetRef, ref) && f(v.commits, x => array(x, text)) && f(v.changedFiles, x => array(x, c => object(c) && text(c.path) && (c.previousPath === undefined || text(c.previousPath)) && (c.changeKind === undefined || text(c.changeKind)))) && f(v.diff, string) && f(v.reviewState, string)
}

export async function acquireEvidence(workspace: string, request: EvidenceRequest): Promise<EvidenceResult> {
  if (!request || !["workItemBackends", "changeBackends"].includes(request.family) || !text(request.backendId) || !text(request.externalId)) return { status: "invalid-request", reason: "Family, backend ID and stable resource ID are required." }
  const selected = await resolveFromWorkspace(workspace, { family: request.family, backendId: request.backendId, repository: request.repository })
  if (selected.status !== "resolved" || !selected.backend) return { status: selected.status === "ambiguous" ? "invalid-request" : selected.status as FailureStatus, reason: "Evidence backend resolution failed." }
  const backend = selected.backend
  if (backend.adapter !== "fixture") return { status: "unavailable", reason: "No acquisition adapter is installed for this backend." }
  try {
    const root = await realpath(workspace)
    const file = await realpath(path.join(root, backend.fixturePath!))
    if (!inside(root, file)) return { status: "invalid-config", reason: "Fixture path must remain inside the workspace." }
    if (!(await stat(file)).isFile()) return { status: "invalid-evidence", reason: "Fixture must be a JSON file." }
    const catalog: unknown = JSON.parse(await readFile(file, "utf8"))
    if (!object(catalog) || !only(catalog, ["schemaVersion", "workItems", "changeRequests"]) || catalog.schemaVersion !== "review-fixtures/v1" || !Array.isArray(catalog.workItems) || !Array.isArray(catalog.changeRequests)) return { status: "invalid-evidence", reason: "Invalid fixture catalog." }
    const entries = request.family === "workItemBackends" ? catalog.workItems : catalog.changeRequests
    const ids = new Set<string>()
    for (const entry of entries) {
      if (!validEvidence(entry, request.family, backend.provider, backend.id) || ids.has(entry.externalId)) return { status: "invalid-evidence", reason: "Malformed or duplicate normalized fixture evidence." }
      ids.add(entry.externalId)
    }
    const evidence = entries.find((entry: Obj) => entry.externalId === request.externalId)
    if (!evidence) return { status: "unavailable", reason: "Fixture resource not found." }
    const repository = request.repository ?? backend.repository
    if (repository && evidence.repository && ![evidence.repository.stableId, evidence.repository.fullName].includes(repository)) return { status: "invalid-request", reason: "Fixture repository does not match the requested scope." }
    return { status: "acquired", evidence }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { status: "unavailable", reason: "Fixture file not found." }
    return { status: "invalid-evidence", reason: "Fixture could not be read or parsed." }
  }
}
