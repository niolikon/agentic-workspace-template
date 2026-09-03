import { tool } from "@opencode-ai/plugin"
import { readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"

type CoverageState = "not analysed" | "referenced, not analysed" | "blocked" | "partially analysed" | "analysed"
type CoverageEntry = { state: CoverageState; knowledgeArtifact?: string; notes?: string }
type KnowledgeArtifact = { name: string; path: string }
type RepositoryKnowledge = {
  repository: string
  path: string
  exists: boolean
  artifactCount: number
  artifacts: KnowledgeArtifact[]
  coverage: CoverageEntry | null
}

const COVERAGE_STATES = new Set<CoverageState>(["not analysed", "referenced, not analysed", "blocked", "partially analysed", "analysed"])

function toPosix(value: string): string { return value.split(path.sep).join("/") }
function relativeToWorkspace(workspace: string, value: string): string { return toPosix(path.relative(workspace, value) || ".") }
async function exists(value: string): Promise<boolean> { try { await stat(value); return true } catch { return false } }

function safeWorkspacePath(workspace: string, relative: string, label: string): string {
  const resolved = path.resolve(workspace, relative)
  const safeRelative = path.relative(workspace, resolved)
  if (safeRelative.startsWith("..") || path.isAbsolute(safeRelative)) throw new Error(`${label} must stay inside the workspace: ${relative}`)
  return resolved
}

function validateRepositoryName(value: string): string {
  const repository = value.trim()
  if (!repository || repository === "." || repository === ".." || repository.includes("/") || repository.includes("\\")) {
    throw new Error(`repository must be a canonical immediate-child identifier, not a path: ${value}`)
  }
  return repository
}

function parseCoverage(content: string): Map<string, CoverageEntry> {
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
    const normalizedState = cells[1].toLowerCase() as CoverageState
    if (!COVERAGE_STATES.has(normalizedState)) continue
    result.set(cells[0], {
      state: normalizedState,
      knowledgeArtifact: cells[2] && cells[2] !== "-" ? cells[2] : undefined,
      notes: cells[3] || undefined,
    })
  }
  return result
}

async function discoverMarkdownArtifacts(workspace: string, repositoryRoot: string): Promise<KnowledgeArtifact[]> {
  const artifacts: KnowledgeArtifact[] = []
  async function walk(current: string): Promise<void> {
    let entries
    try { entries = await readdir(current, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      const candidate = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(candidate)
        continue
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) continue
      artifacts.push({ name: toPosix(path.relative(repositoryRoot, candidate)), path: relativeToWorkspace(workspace, candidate) })
    }
  }
  if (await exists(repositoryRoot)) await walk(repositoryRoot)
  return artifacts.sort((a, b) => a.name.localeCompare(b.name))
}

export default tool({
  description: "Return the authoritative structural inventory of persisted repository knowledge under knowledge-base/repositories, including canonical artifact paths and persisted workspace coverage. Use this to determine what repository knowledge exists; artifact existence is structural evidence only and does not validate artifact claims.",
  args: {
    repository: tool.schema.string().optional().describe("Optional canonical immediate-child repository identifier. When supplied, returns only that repository knowledge entry."),
    knowledgeRoot: tool.schema.string().optional().describe("Workspace-relative repository knowledge root. Defaults to knowledge-base/repositories."),
    overviewPath: tool.schema.string().optional().describe("Workspace-relative workspace overview containing canonical coverage. Defaults to knowledge-base/workspace/overview.md."),
  },
  async execute(args, context) {
    const workspace = path.resolve(context.directory)
    const knowledgeRootRelative = args.knowledgeRoot?.trim() || "knowledge-base/repositories"
    const overviewRelative = args.overviewPath?.trim() || "knowledge-base/workspace/overview.md"
    const knowledgeRoot = safeWorkspacePath(workspace, knowledgeRootRelative, "knowledgeRoot")
    const overviewPath = safeWorkspacePath(workspace, overviewRelative, "overviewPath")
    const coverage = await exists(overviewPath) ? parseCoverage(await readFile(overviewPath, "utf8")) : new Map<string, CoverageEntry>()

    let names: string[] = []
    if (args.repository?.trim()) {
      names = [validateRepositoryName(args.repository)]
    } else if (await exists(knowledgeRoot)) {
      const entries = await readdir(knowledgeRoot, { withFileTypes: true })
      names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort((a, b) => a.localeCompare(b))
    }

    const repositories: RepositoryKnowledge[] = []
    for (const repository of names) {
      const repositoryRoot = path.join(knowledgeRoot, repository)
      const repositoryExists = await exists(repositoryRoot)
      const artifacts = repositoryExists ? await discoverMarkdownArtifacts(workspace, repositoryRoot) : []
      repositories.push({
        repository,
        path: relativeToWorkspace(workspace, repositoryRoot),
        exists: repositoryExists,
        artifactCount: artifacts.length,
        artifacts,
        coverage: coverage.get(repository) ?? null,
      })
    }

    return JSON.stringify({
      workspace: toPosix(workspace),
      knowledgeRoot: relativeToWorkspace(workspace, knowledgeRoot),
      overviewPath: relativeToWorkspace(workspace, overviewPath),
      repositoryCount: repositories.length,
      repositories,
      guarantees: [
        "Repository knowledge existence and artifact paths are derived from the canonical knowledge-base filesystem, not glob output.",
        "Artifact inventory is structural evidence only; existing claims become reusable validated knowledge only after content inspection.",
        "Persisted coverage is reported as stored state and does not substitute for an inspectable repository knowledge artifact.",
      ],
    }, null, 2)
  },
})
