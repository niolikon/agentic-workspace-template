import { lookupRuntimeBackend } from "../review-backend-resolution/resolve.ts"
import type { Request } from "../review-backend-resolution/resolve.ts"

type Failure = "invalid-request" | "invalid-config" | "credentials-unavailable" | "unauthorized" | "not-found" | "rate-limited" | "http-error" | "network-error" | "timeout" | "invalid-response" | "pagination-limit"
export type RestResult<T> = {
  state: "available" | "partial" | "unavailable"
  items: T[]
  pages: number
  failure?: Failure
}
// Trusted adapter code owns endpoints, auth and normalization. Never take this
// specification (or a URL, headers, method or body) from an agent/tool argument.
export type ReadOperation<T> = {
  path: string
  auth: "none" | "bearer" | "basic" | "private-token"
  decode: (payload: unknown) => { items: T[]; partial?: boolean; next?: string }
}
type Options = { timeoutMs?: number; maxPages?: number; maxBytes?: number; transport?: typeof fetch }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)

function scopedUrl(base: URL, value: string): URL | undefined {
  if (typeof value !== "string" || !value || /[\\\s]/.test(value)) return
  // Reject encoded separators and dot segments before URL normalization.
  let decoded: string
  const rawPath = value.split(/[?#]/)[0]
  if (/%(?:2f|5c)/i.test(rawPath)) return
  try { decoded = decodeURIComponent(rawPath) } catch { return }
  if (/[\\%]/.test(decoded) || decoded.split("/").some(p => p === "." || p === "..")) return
  try {
    const url = new URL(value, base)
    if (url.protocol !== "https:" || url.username || url.password || url.hash || url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return
    return url
  } catch { return }
}

function redact<T>(value: T, secrets: string[]): T {
  // JSON roundtrip prevents custom objects/serialization hooks from escaping.
  const json = JSON.stringify(value)
  if (json === undefined) throw new Error("Invalid normalized evidence")
  let safe = json
  for (const secret of secrets.filter(Boolean).sort((a, b) => b.length - a.length)) {
    for (const form of new Set([secret, encodeURIComponent(secret), Buffer.from(secret).toString("base64")])) {
      const escaped = JSON.stringify(form).slice(1, -1)
      safe = safe.split(escaped).join("[REDACTED]")
    }
  }
  return JSON.parse(safe)
}

/** Internal REST support; returns data only, never credentials, URLs, headers or raw errors. */
export async function readRest<T>(workspace: string, request: Request, operation: ReadOperation<T>, options: Options = {}): Promise<RestResult<T>> {
  const items: T[] = []
  let pages = 0
  const fail = (failure: Failure): RestResult<T> => ({ state: pages ? "partial" : "unavailable", items, pages, failure })
  const timeoutMs = options.timeoutMs ?? 15000
  const maxPages = options.maxPages ?? 20
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024
  if (![timeoutMs, maxPages, maxBytes].every(v => Number.isSafeInteger(v) && v > 0) || timeoutMs > 120000 || maxPages > 1000 || maxBytes > 16 * 1024 * 1024) return fail("invalid-request")
  if (!request?.backendId || !operation || !["none", "bearer", "basic", "private-token"].includes(operation.auth) || typeof operation.decode !== "function") return fail("invalid-request")
  try {
    const selected = await lookupRuntimeBackend(workspace, request)
    if (selected.status !== "resolved" || !selected.backend) return fail(selected.status === "invalid-config" ? "invalid-config" : "invalid-request")
    const backend = selected.backend
    if (backend.adapter) return fail("invalid-config")
    const base = new URL(backend.baseUrl.replace(/\/$/, "") + "/")
    let url = scopedUrl(base, operation.path)
    if (!url) return fail("invalid-request")
    const headers: Record<string, string> = { Accept: "application/json" }
    let credential = ""
    if (operation.auth !== "none") {
      credential = backend.credentialEnv ? process.env[backend.credentialEnv] ?? "" : ""
      if (!credential || /[\r\n]/.test(credential)) return fail("credentials-unavailable")
      if (operation.auth === "private-token") headers["PRIVATE-TOKEN"] = credential
      else headers.Authorization = operation.auth === "basic" ? "Basic " + Buffer.from(credential).toString("base64") : "Bearer " + credential
    }
    const secrets = [credential, headers.Authorization ?? ""]
    if (operation.auth === "basic") {
      const colon = credential.indexOf(":")
      if (colon < 1) return fail("credentials-unavailable")
      secrets.push(credential.slice(0, colon), credential.slice(colon + 1))
    }
    const seen = new Set<string>()
    let partial = false
    while (url) {
      if (seen.has(url.href) || pages >= maxPages) return fail("pagination-limit")
      seen.add(url.href)
      const controller = new AbortController()
      let timer: ReturnType<typeof setTimeout> | undefined
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error("Deadline")) }, timeoutMs)
      })
      let payload: unknown
      try {
        const response = await Promise.race([(async () => {
          const response = await (options.transport ?? fetch)(url!, { method: "GET", headers, redirect: "manual", signal: controller.signal })
          if (!response.ok) {
            await response.body?.cancel()
            return { failure: response.status === 401 || response.status === 403 ? "unauthorized" : response.status === 404 ? "not-found" : response.status === 429 ? "rate-limited" : "http-error" } as const
          }
          if (!response.body) return { failure: "invalid-response" } as const
          const reader = response.body.getReader()
          const chunks: Uint8Array[] = []
          let size = 0
          try {
            while (true) {
              const chunk = await reader.read()
              if (chunk.done) break
              size += chunk.value.byteLength
              if (size > maxBytes) { await reader.cancel(); return { failure: "invalid-response" } as const }
              chunks.push(chunk.value)
            }
          } finally { reader.releaseLock() }
          try { return { payload: JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown } } catch { return { failure: "invalid-response" } as const }
        })(), deadline])
        if ("failure" in response) return fail(response.failure!)
        payload = response.payload
      } catch { return fail(controller.signal.aborted ? "timeout" : "network-error") }
      finally { clearTimeout(timer) }
      try {
        const page = operation.decode(payload)
        if (!object(page) || !Array.isArray(page.items) || (page.partial !== undefined && typeof page.partial !== "boolean")) return fail("invalid-response")
        const clean = redact(page.items, secrets)
        items.push(...clean)
        pages++
        partial ||= page.partial === true
        if (page.next === undefined) return { state: partial ? "partial" : "available", items, pages, ...(partial ? { failure: "invalid-response" as const } : {}) }
        url = scopedUrl(base, page.next)
        if (!url) return fail("invalid-response")
      } catch { return fail("invalid-response") }
    }
    return fail("invalid-response")
  } catch { return fail("invalid-config") }
}
