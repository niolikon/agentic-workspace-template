import { createHash, randomUUID } from "node:crypto"
import { mkdir, readFile, realpath, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { resolveFromWorkspace, type Request } from "../review-backend-resolution/resolve.ts"
import { acquireEvidence } from "../review-evidence-acquisition/acquire.ts"

export type Reference = Omit<Request, "backendHint"> & { externalId: string }
export type ReviewInput = {
  schemaVersion: "review-evidence/v2"
  workItems: Record<string, unknown>[]
  changeRequests: Record<string, unknown>[]
}
type Resolution = {
  index: number
  family: Request["family"]
  status: string
  backendId?: string
  externalId?: string
  candidates?: string[]
  reason?: string
}
type ReviewState = {
  state: "REQUESTED" | "RESOLVING" | "AWAITING_CONFIRMATION" | "CONFIRMED" | "REVIEWING"
  revision: number
  candidate: ReviewInput
  resolutions: Resolution[]
  unresolved: string[]
  digest: string
}
export type Action =
  | { action: "resolve"; references: Reference[]; unresolved?: string[] }
  | { action: "confirm" | "begin"; digest: string }
  | { action: "status" }

const hash = (value: string) => createHash("sha256").update(value).digest("hex")
const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value)
const scopeDigest = (state: ReviewState) => hash(JSON.stringify({ revision: state.revision, candidate: state.candidate, resolutions: state.resolutions, unresolved: state.unresolved }))
function controls(state: ReviewState) {
  return {
    confirmationAllowed: state.state === "AWAITING_CONFIRMATION" && state.unresolved.length === 0,
    reviewAllowed: state.state === "REVIEWING",
    nextAction: state.state === "AWAITING_CONFIRMATION" ? (state.unresolved.length ? "clarify-scope" : "request-confirmation") : state.state === "CONFIRMED" ? "begin" : state.state === "REVIEWING" ? "review" : "resolve",
  }
}
function scopePreview(input: ReviewInput) {
  const summarize = (item: Record<string, unknown>) => {
    const field = (value: unknown) => {
      const evidence = value as { state: string; value?: unknown; reason?: string }
      return { state: evidence.state, ...(evidence.state === "available" || evidence.state === "partial" ? { value: evidence.value } : { reason: evidence.reason }) }
    }
    const title = item.title as { provenance: { backend: string }[] }
    return {
      externalId: item.externalId, provider: item.provider,
      backends: [...new Set(title.provenance.map(p => p.backend))],
      title: field(item.title), sourceReference: item.sourceReference,
      ...(item.repository ? { repository: item.repository, sourceRef: field(item.sourceRef), targetRef: field(item.targetRef) } : {}),
      limits: Object.entries(item).filter(([, value]) => object(value) && typeof value.state === "string" && value.state !== "available").map(([name, value]) => ({ field: name, state: (value as Record<string, unknown>).state, reason: (value as Record<string, unknown>).reason })),
    }
  }
  return { workItems: input.workItems.map(summarize), changeRequests: input.changeRequests.map(summarize) }
}
const confined = (root: string, file: string) => {
  const rel = path.relative(root, file)
  return rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel)
}

// Serialize tools for a session, including asynchronous acquisition and persistence.
const pending = new Map<string, Promise<unknown>>()
export async function reviewWorkflow(workspace: string, session: string, action: Action) {
  if (!nonempty(session)) return { status: "invalid-request", reason: "A session identity is required." }
  const key = hash(path.resolve(workspace) + "\0" + session)
  const previous = pending.get(key) ?? Promise.resolve()
  const current = previous.then(() => execute(workspace, key, action))
  pending.set(key, current)
  try { return await current } finally { if (pending.get(key) === current) pending.delete(key) }
}

async function execute(workspace: string, key: string, action: Action) {
  try {
    const root = await realpath(workspace)
    let directory = root
    for (const part of [".opencode", ".tmp", "reviews"]) {
      directory = path.join(directory, part)
      await mkdir(directory, { recursive: true })
      if (!confined(root, await realpath(directory))) return { status: "invalid-state", reason: "Review state must remain inside the workspace." }
    }
    const file = path.join(directory, key + ".json")
    let state: ReviewState | undefined
    try {
      if (!confined(directory, await realpath(file))) return { status: "invalid-state", reason: "Review state must remain inside its session directory." }
      state = JSON.parse(await readFile(file, "utf8"))
      if (!state || !Number.isInteger(state.revision) || state.revision < 1 || !["REQUESTED", "RESOLVING", "AWAITING_CONFIRMATION", "CONFIRMED", "REVIEWING"].includes(state.state) || !Array.isArray(state.unresolved) || !Array.isArray(state.resolutions) || state.candidate?.schemaVersion !== "review-evidence/v2" || !Array.isArray(state.candidate.workItems) || !Array.isArray(state.candidate.changeRequests) || (state.digest === "pending" ? !["REQUESTED", "RESOLVING"].includes(state.state) : state.digest !== scopeDigest(state))) return { status: "invalid-state", reason: "Invalid saved review state; use a new session to resolve afresh." }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") return { status: "invalid-state", reason: "Review state could not be read." }
    }
    const save = async (next: ReviewState) => {
      const temporary = path.join(directory, key + "-" + randomUUID() + ".json")
      await writeFile(temporary, JSON.stringify(next, null, 2), { flag: "wx" })
      await rename(temporary, file)
      state = next
    }
    if (action?.action === "resolve") {
      if (!Array.isArray(action.references) || (action.unresolved !== undefined && (!Array.isArray(action.unresolved) || !action.unresolved.every(nonempty)))) return { status: "invalid-request", reason: "References and explicit unresolved questions are required." }
      const next: ReviewState = {
        state: "REQUESTED", revision: (state?.revision ?? 0) + 1,
        candidate: { schemaVersion: "review-evidence/v2", workItems: [], changeRequests: [] },
        resolutions: [], unresolved: [...(action.unresolved ?? [])], digest: "pending",
      }
      await save(next)
      next.state = "RESOLVING"
      await save(next)
      const identities = new Set<string>()
      for (const [index, reference] of action.references.entries()) {
        const family = reference?.family
        if (!object(reference) || !["workItemBackends", "changeBackends"].includes(family) || !nonempty(reference.externalId) || !Object.keys(reference).every(k => ["family", "externalId", "backendId", "repository", "resourceUrl"].includes(k))) {
          next.unresolved.push(`Reference ${index}: provide a stable identity and evidence family.`)
          continue
        }
        const { externalId, ...selection } = reference
        const selected = await resolveFromWorkspace(root, selection)
        if (selected.status !== "resolved" || !selected.backend) {
          next.resolutions.push({ index, family, externalId, status: selected.status, ...("candidates" in selected ? { candidates: selected.candidates } : {}), ...("reason" in selected ? { reason: selected.reason } : {}) })
          next.unresolved.push(`Reference ${index}: backend selection ${selected.status}.`)
          continue
        }
        const backendId = selected.backend.id
        const result = await acquireEvidence(root, { family, backendId, externalId, repository: reference.repository })
        next.resolutions.push({ index, family, externalId, backendId, status: result.status, ...(result.status !== "acquired" ? { reason: result.reason } : {}) })
        if (result.status !== "acquired") {
          next.unresolved.push(`Reference ${index}: acquisition ${result.status}.`)
          continue
        }
        const repo = result.evidence.repository as { stableId?: string } | undefined
        const identity = JSON.stringify([family, backendId, repo?.stableId, externalId])
        if (!identities.has(identity)) {
          identities.add(identity)
          next.candidate[family === "workItemBackends" ? "workItems" : "changeRequests"].push(result.evidence)
        }
      }
      if (!next.candidate.workItems.length) next.unresolved.push("At least one acquired work item is required.")
      if (!next.candidate.changeRequests.length) next.unresolved.push("At least one acquired change request is required.")
      next.state = "AWAITING_CONFIRMATION"
      next.digest = scopeDigest(next)
      await save(next)
      return { status: "resolved", state: next.state, revision: next.revision, digest: next.digest, unresolved: next.unresolved, resolutions: next.resolutions, scopePreview: scopePreview(next.candidate), candidate: next.candidate, ...controls(next) }
    }
    if (action?.action === "status") return state ? { status: "ok", ...state, scopePreview: scopePreview(state.candidate), ...controls(state) } : { status: "not-requested", state: "REQUESTED", confirmationAllowed: false, reviewAllowed: false, nextAction: "resolve" }
    if (!state || !["confirm", "begin"].includes(action?.action)) return { status: "invalid-transition", reason: "Resolve and present the scope before confirmation or review." }
    if (state.digest !== action.digest || state.digest === "pending") return { status: "invalid-transition", reason: "Scope changed or confirmation refers to another revision." }
    if (action.action === "confirm") {
      if (state.state !== "AWAITING_CONFIRMATION" || state.unresolved.length) return { status: "invalid-transition", reason: "Resolve every scope question and await explicit user confirmation." }
      await save({ ...state, state: "CONFIRMED" })
      return { status: "confirmed", ...state, ...controls(state) }
    }
    if (state.state !== "CONFIRMED") return { status: "invalid-transition", reason: "The current candidate must be explicitly confirmed before review." }
    await save({ ...state, state: "REVIEWING" })
    const { candidate, ...confirmed } = state
    return { status: "reviewing", ...confirmed, reviewInput: candidate, ...controls(state) }
  } catch (error) {
    return { status: "invalid-state", reason: "Review state could not be persisted; resolve again before review.", code: (error as NodeJS.ErrnoException).code ?? "INVALID_STATE" }
  }
}
