import { readFile, realpath } from "node:fs/promises"
import path from "node:path"

type Family = "workItemBackends" | "changeBackends"
type Backend = { id: string; provider: string; baseUrl: string; credentialEnv?: string; repository?: string; project?: string; adapter?: "fixture"; fixturePath?: string }
type Selection = { workItemBackend?: string; changeBackend?: string }
type Config = { schemaVersion: "review-backends/v1"; workItemBackends: Backend[]; changeBackends: Backend[]; defaults?: Selection; repositoryHints?: Record<string, Selection> }
export type Request = { family: Family; backendId?: string; repository?: string; backendHint?: string; resourceUrl?: string }

const families: Family[] = ["workItemBackends", "changeBackends"]
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value)
const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0
const keysOnly = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every(key => keys.includes(key))

function safeUrl(value: unknown): URL | undefined {
  if (typeof value !== "string") return
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || value.includes("{")) return
    return url
  } catch { return }
}

// Fail closed with fixed diagnostics: never echo untrusted configuration values.
function validate(value: unknown): value is Config {
  if (!object(value) || !keysOnly(value, ["schemaVersion", ...families, "defaults", "repositoryHints"]) || value.schemaVersion !== "review-backends/v1") return false
  const ids = new Set<string>()
  for (const family of families) {
    if (!Array.isArray(value[family])) return false
    for (const backend of value[family]) {
      if (!object(backend) || !keysOnly(backend, ["id", "provider", "baseUrl", "credentialEnv", "repository", "project", "adapter", "fixturePath"])) return false
      if (backend.adapter !== undefined && backend.adapter !== "fixture") return false
      if (backend.adapter === "fixture") {
        if (!nonempty(backend.fixturePath) || path.isAbsolute(backend.fixturePath) || /^[A-Za-z]:/.test(backend.fixturePath) || backend.fixturePath.includes("\\") || backend.fixturePath.split("/").some(part => !part || part === "." || part === "..") || backend.credentialEnv !== undefined) return false
      } else if (backend.fixturePath !== undefined) return false
      if (!nonempty(backend.id) || !idPattern.test(backend.id) || ids.has(backend.id)) return false
      ids.add(backend.id)
      if (!nonempty(backend.provider) || !idPattern.test(backend.provider) || !safeUrl(backend.baseUrl)) return false
      if (backend.credentialEnv !== undefined && (typeof backend.credentialEnv !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(backend.credentialEnv))) return false
      if ([backend.repository, backend.project].some(v => v !== undefined && !nonempty(v))) return false
    }
  }
  function validSelection(selection: unknown): boolean {
    if (!object(selection) || !keysOnly(selection, ["workItemBackend", "changeBackend"])) return false
    return families.every(family => {
      const key = family === "workItemBackends" ? "workItemBackend" : "changeBackend"
      return selection[key] === undefined || (value as Config)[family].some(b => b.id === selection[key])
    })
  }
  if (value.defaults !== undefined && !validSelection(value.defaults)) return false
  if (value.repositoryHints !== undefined && (!object(value.repositoryHints) || !Object.values(value.repositoryHints).every(validSelection))) return false
  return true
}

export function resolveBackend(config: unknown, request: Request) {
  if (!validate(config)) return { status: "invalid-config", reason: "Invalid review backend configuration; check schema, IDs, references and secret-free metadata." }
  if (!families.includes(request.family) || [request.backendId, request.backendHint, request.repository].some(v => v !== undefined && !nonempty(v))) return { status: "invalid-request", reason: "Invalid family or empty selector." }
  const candidates = config[request.family]
  const key = request.family === "workItemBackends" ? "workItemBackend" : "changeBackend"
  const url = request.resourceUrl === undefined ? undefined : safeUrl(request.resourceUrl)
  if (request.resourceUrl !== undefined && !url) return { status: "invalid-request", reason: "Resource URL must be HTTPS without credentials, query or fragment." }
  const compatible = (backend: Backend) => {
    const base = safeUrl(backend.baseUrl)!
    const prefix = base.pathname.replace(/\/$/, "")
    return (!url || (url.origin === base.origin && (url.pathname === prefix || url.pathname.startsWith(prefix + "/")))) &&
      (!request.repository || !backend.repository || request.repository === backend.repository)
  }
  const selected = (id: string, source: string) => {
    const backend = candidates.find(b => b.id === id)
    if (!backend || !compatible(backend)) return { status: "invalid-request", reason: "Selected backend is unknown, belongs to another family or conflicts with the resource scope.", source }
    // Construct an allowlisted descriptor. credentialEnv and all credential values stay out of agent output.
    return { status: "resolved", source, backend: { id: backend.id, provider: backend.provider, baseUrl: backend.baseUrl, ...(backend.adapter ? { adapter: backend.adapter, fixturePath: backend.fixturePath } : {}), ...(backend.repository ? { repository: backend.repository } : {}), ...(backend.project ? { project: backend.project } : {}) } }
  }
  if (request.backendId !== undefined) return selected(request.backendId, "request")
  if (config.defaults?.[key] !== undefined) return selected(config.defaults[key]!, "project")
  const repositoryHint = request.repository && Object.hasOwn(config.repositoryHints ?? {}, request.repository) ? config.repositoryHints![request.repository][key] : undefined
  const hints = [...new Set([repositoryHint, request.backendHint].filter((v): v is string => v !== undefined))].sort()
  if (hints.some(id => !candidates.some(b => b.id === id))) return { status: "invalid-request", reason: "Repository hint references an unknown backend or another family." }
  if (hints.length > 1) return { status: "ambiguous", source: "repository", candidates: hints }
  if (hints.length === 1) return selected(hints[0], "repository")
  const inferred = candidates.filter(compatible)
  if (inferred.length === 1) return selected(inferred[0].id, "inference")
  return inferred.length ? { status: "ambiguous", source: "inference", candidates: inferred.map(b => b.id).sort() } : { status: "unavailable", reason: "No configured backend matches this evidence family and resource scope." }
}

// Internal adapter lookup. Never register this function as an agent tool.
export async function lookupRuntimeBackend(workspace: string, request: Request) {
  try {
    const root = await realpath(workspace)
    const file = await realpath(path.join(root, "review-backends.json"))
    const relative = path.relative(root, file)
    if (relative.startsWith("..") || path.isAbsolute(relative)) return { status: "invalid-config", reason: "Review backend configuration must remain inside the workspace." }
    const config: unknown = JSON.parse(await readFile(file, "utf8"))
    const selected = resolveBackend(config, request)
    if (selected.status !== "resolved") return selected
    const backend = (config as Config)[request.family].find(b => b.id === selected.backend!.id)!
    return { ...selected, backend }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { status: "unavailable", reason: "No review-backends.json configuration found." }
    return { status: "invalid-config", reason: "Review backend configuration could not be read or parsed." }
  }
}

export async function resolveFromWorkspace(workspace: string, request: Request) {
  const result = await lookupRuntimeBackend(workspace, request)
  if (result.status !== "resolved" || !result.backend) return result
  const { credentialEnv, ...backend } = result.backend
  return { ...result, backend }
}
