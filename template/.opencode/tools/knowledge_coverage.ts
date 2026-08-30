import { tool } from "@opencode-ai/plugin"
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"

type CoverageState = "not analysed" | "referenced, not analysed" | "blocked" | "partially analysed" | "analysed"
type CoverageEntry = { state: CoverageState; knowledgeArtifact?: string; notes?: string }
type GitResult = { ok: boolean; stdout: string }
type RepositoryIdentity = { name: string; remoteUrl: string | null; path: string; depth: number }

const STATE_RANK: Record<CoverageState, number> = {
  "not analysed": 0,
  "referenced, not analysed": 1,
  blocked: 2,
  "partially analysed": 3,
  analysed: 4,
}

function toPosix(value: string): string { return value.split(path.sep).join("/") }
async function exists(value: string): Promise<boolean> { try { await stat(value); return true } catch { return false } }

async function runGit(repositoryPath: string, args: string[]): Promise<GitResult> {
  return await new Promise((resolve) => {
    const child = spawn("git", ["-C", repositoryPath, ...args], { windowsHide: true, shell: false })
    let stdout = ""
    child.stdout.on("data", (chunk) => { stdout += chunk.toString() })
    child.on("error", () => resolve({ ok: false, stdout: "" }))
    child.on("close", (code) => resolve({ ok: code === 0, stdout: stdout.trim() }))
  })
}

async function discoverGitRoots(current: string, roots: string[]): Promise<void> {
  let entries
  try { entries = await readdir(current, { withFileTypes: true }) } catch { return }
  if (entries.some((entry) => entry.name === ".git")) roots.push(current)
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === ".git" || ["node_modules", "target", "build", "dist", "bin", "obj"].includes(entry.name)) continue
    await discoverGitRoots(path.join(current, entry.name), roots)
  }
}

function normalizeRemote(remoteUrl: string | null, fallback: string): string {
  return remoteUrl ? remoteUrl.replace(/\.git$/i, "").toLowerCase() : `path:${fallback.toLowerCase()}`
}

async function canonicalRepositories(workspace: string, root: string): Promise<RepositoryIdentity[]> {
  const scanRoot = path.resolve(workspace, root)
  const relative = path.relative(workspace, scanRoot)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`Repository root must stay inside workspace: ${root}`)
  const roots: string[] = []
  if (await exists(scanRoot)) await discoverGitRoots(scanRoot, roots)
  const identities: RepositoryIdentity[] = []
  for (const repositoryRoot of roots) {
    const relativePath = toPosix(path.relative(workspace, repositoryRoot))
    const remote = await runGit(repositoryRoot, ["config", "--get", "remote.origin.url"])
    identities.push({
      name: path.basename(repositoryRoot),
      remoteUrl: remote.ok && remote.stdout ? remote.stdout : null,
      path: relativePath,
      depth: relativePath.split("/").length,
    })
  }
  const grouped = new Map<string, RepositoryIdentity[]>()
  for (const identity of identities) {
    const key = normalizeRemote(identity.remoteUrl, identity.path)
    const values = grouped.get(key) ?? []
    values.push(identity)
    grouped.set(key, values)
  }
  return [...grouped.values()].map((values) => values.sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path))[0]).sort((a, b) => a.name.localeCompare(b.name))
}

function parseState(value: string): CoverageState | null {
  const normalized = value.trim().toLowerCase()
  return Object.prototype.hasOwnProperty.call(STATE_RANK, normalized) ? normalized as CoverageState : null
}

function strongest(left: CoverageEntry | undefined, right: CoverageEntry): CoverageEntry {
  if (!left || STATE_RANK[right.state] > STATE_RANK[left.state]) return right
  if (STATE_RANK[right.state] < STATE_RANK[left.state]) return left
  return {
    state: left.state,
    knowledgeArtifact: right.knowledgeArtifact || left.knowledgeArtifact,
    notes: right.notes || left.notes,
  }
}

function parseExistingCoverage(content: string): Map<string, CoverageEntry> {
  const result = new Map<string, CoverageEntry>()
  const heading = /^## Repository coverage\s*$/m.exec(content)
  if (!heading) return result
  const sectionStart = heading.index + heading[0].length
  const rest = content.slice(sectionStart)
  const nextHeading = /^##\s+/m.exec(rest)
  const section = nextHeading ? rest.slice(0, nextHeading.index) : rest
  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line.startsWith("|") || /^\|\s*-/.test(line)) continue
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim())
    if (cells.length < 2 || cells[0].toLowerCase() === "repository") continue
    const state = parseState(cells[1])
    if (!state) continue
    const entry: CoverageEntry = {
      state,
      knowledgeArtifact: cells[2] && cells[2] !== "-" ? cells[2] : undefined,
      notes: cells[3] || undefined,
    }
    result.set(cells[0], strongest(result.get(cells[0]), entry))
  }
  return result
}

function replaceCoverageSection(content: string, rendered: string): string {
  const heading = /^## Repository coverage\s*$/m.exec(content)
  if (!heading) {
    const trimmed = content.trimEnd()
    return `${trimmed}${trimmed ? "\n\n" : ""}${rendered}\n`
  }
  const start = heading.index
  const afterHeading = heading.index + heading[0].length
  const rest = content.slice(afterHeading)
  const nextHeading = /^##\s+/m.exec(rest)
  const end = nextHeading ? afterHeading + nextHeading.index : content.length
  const before = content.slice(0, start).trimEnd()
  const after = content.slice(end).trimStart()
  return `${before}${before ? "\n\n" : ""}${rendered}\n${after ? `\n${after}` : ""}`
}

function renderCoverage(repositories: RepositoryIdentity[], states: Map<string, CoverageEntry>): string {
  const rows = repositories.map((repository) => {
    const entry = states.get(repository.name) ?? { state: "not analysed" as CoverageState }
    const artifact = (entry.knowledgeArtifact ?? "").replace(/\|/g, "\\|")
    const notes = (entry.notes ?? "").replace(/\|/g, "\\|")
    return `| ${repository.name} | ${entry.state} | ${artifact} | ${notes} |`
  })
  return [
    "## Repository coverage",
    "",
    "| Repository | State | Knowledge artifact | Notes |",
    "|---|---:|---|---|",
    ...rows,
  ].join("\n")
}

function parseUpdates(value: string): Record<string, CoverageEntry> {
  let parsed: unknown
  try { parsed = JSON.parse(value) } catch { throw new Error("updates must be valid JSON") }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("updates must be a JSON object keyed by canonical repository name")
  const result: Record<string, CoverageEntry> = {}
  for (const [name, raw] of Object.entries(parsed as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`Invalid coverage update for ${name}`)
    const item = raw as Record<string, unknown>
    const state = typeof item.state === "string" ? parseState(item.state) : null
    if (!state) throw new Error(`Invalid coverage state for ${name}: ${String(item.state)}`)
    result[name] = {
      state,
      knowledgeArtifact: typeof item.knowledgeArtifact === "string" ? item.knowledgeArtifact : undefined,
      notes: typeof item.notes === "string" ? item.notes : undefined,
    }
  }
  return result
}

export default tool({
  description: "Deterministically merge knowledge-base repository coverage. Discovers canonical logical repositories, preserves the strongest prior state, collapses duplicate stale rows and replaces the complete ## Repository coverage section. Use this during knowledge-init instead of editing coverage Markdown directly.",
  args: {
    updates: tool.schema.string().describe('JSON object keyed by canonical repository name. Values: {"state":"analysed|partially analysed|blocked|referenced, not analysed|not analysed","knowledgeArtifact"?:string,"notes"?:string}.'),
    repositoryRoot: tool.schema.string().optional().describe("Workspace-relative repositories root. Defaults to repositories."),
    overviewPath: tool.schema.string().optional().describe("Workspace-relative overview path. Defaults to knowledge-base/workspace/overview.md."),
  },
  async execute(args, context) {
    const workspace = path.resolve(context.directory)
    const repositoryRoot = args.repositoryRoot?.trim() || "repositories"
    const overviewRelative = args.overviewPath?.trim() || "knowledge-base/workspace/overview.md"
    const overviewPath = path.resolve(workspace, overviewRelative)
    const safeRelative = path.relative(workspace, overviewPath)
    if (safeRelative.startsWith("..") || path.isAbsolute(safeRelative) || !toPosix(safeRelative).startsWith("knowledge-base/")) {
      throw new Error(`Coverage overview must stay under knowledge-base/: ${overviewRelative}`)
    }

    const repositories = await canonicalRepositories(workspace, repositoryRoot)
    const canonicalNames = new Set(repositories.map((repository) => repository.name))
    const updates = parseUpdates(args.updates)
    for (const name of Object.keys(updates)) {
      if (!canonicalNames.has(name)) throw new Error(`Coverage update references a non-canonical repository: ${name}`)
    }

    const existing = await exists(overviewPath) ? await readFile(overviewPath, "utf8") : "# Workspace overview\n\nThis document is the canonical current-state workspace knowledge projection.\n"
    const states = parseExistingCoverage(existing)
    for (const repository of repositories) {
      if (!states.has(repository.name)) states.set(repository.name, { state: "not analysed" })
    }
    for (const [name, update] of Object.entries(updates)) states.set(name, strongest(states.get(name), update))

    const rendered = renderCoverage(repositories, states)
    const next = replaceCoverageSection(existing, rendered)
    await mkdir(path.dirname(overviewPath), { recursive: true })
    await writeFile(overviewPath, next, "utf8")

    const persisted = await readFile(overviewPath, "utf8")
    const persistedStates = parseExistingCoverage(persisted)
    const missing = repositories.filter((repository) => !persistedStates.has(repository.name)).map((repository) => repository.name)
    const sectionMatch = /^## Repository coverage\s*$/m.exec(persisted)
    const section = sectionMatch ? persisted.slice(sectionMatch.index, (() => {
      const after = persisted.slice(sectionMatch.index + sectionMatch[0].length)
      const nextHeading = /^##\s+/m.exec(after)
      return nextHeading ? sectionMatch.index + sectionMatch[0].length + nextHeading.index : persisted.length
    })()) : ""
    const duplicates = repositories.filter((repository) => {
      const escaped = repository.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      return (section.match(new RegExp(`^\\|\\s*${escaped}\\s*\\|`, "gm")) ?? []).length !== 1
    }).map((repository) => repository.name)
    if (missing.length || duplicates.length) throw new Error(`Coverage validation failed. Missing: ${missing.join(", ") || "none"}; duplicate/invalid rows: ${duplicates.join(", ") || "none"}`)

    return JSON.stringify({
      overviewPath: toPosix(safeRelative),
      canonicalRepositoryCount: repositories.length,
      coverage: repositories.map((repository) => ({ repository: repository.name, ...(persistedStates.get(repository.name) ?? { state: "not analysed" }) })),
      validation: { oneEntryPerCanonicalRepository: true, missing: [], duplicates: [] },
    }, null, 2)
  },
})
