import { tool } from "@opencode-ai/plugin"
import { readdir, realpath, stat } from "node:fs/promises"
import path from "node:path"

type MatchKind = "file" | "directory"
type Match = { path: string; repositoryPath: string; name: string; kind: MatchKind }

const IGNORED_DIRECTORIES = new Set([
  ".git", "node_modules", "target", "build", "dist", "out", "bin", "obj",
  ".idea", ".vscode", ".venv", "venv", "__pycache__", ".pytest_cache",
  ".mypy_cache", ".tox", ".gradle", ".next", "coverage",
])

function toPosix(value: string): string { return value.split(path.sep).join("/") }
function relativeToWorkspace(workspace: string, value: string): string { return toPosix(path.relative(workspace, value) || ".") }
async function exists(value: string): Promise<boolean> { try { await stat(value); return true } catch { return false } }

function validateRepositoryName(value: string): string {
  const repository = value.trim()
  if (!repository || repository === "." || repository === ".." || repository.includes("/") || repository.includes("\\"))
    throw new Error(`repository must be a canonical immediate-child identifier, not a path: ${value}`)
  return repository
}

function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replace(/\\/g, "/").replace(/^\.\//, "")
  let expression = "^"
  for (let index = 0; index < normalized.length; index++) {
    const char = normalized[index]
    if (char === "*") {
      if (normalized[index + 1] === "*") {
        index++
        if (normalized[index + 1] === "/") {
          index++
          expression += "(?:.*/)?"
        } else {
          expression += ".*"
        }
      } else {
        expression += "[^/]*"
      }
      continue
    }
    if (char === "?") { expression += "[^/]"; continue }
    expression += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }
  return new RegExp(`${expression}$`)
}

export default tool({
  description: "Return a deterministic repository-scoped path inventory for a caller-supplied glob-like pattern. Use this instead of generic workspace globbing when the canonical repository is already known and no more specialized inventory owns the discovery. The tool enumerates paths only and never reads file contents.",
  args: {
    repository: tool.schema.string().describe("Canonical repository identifier under the workspace repositories directory."),
    pattern: tool.schema.string().describe("Repository-relative glob-like pattern using *, ** and ?. Examples: docker-compose.yml, **/Dockerfile, src/**/SecurityConfig.java."),
    kind: tool.schema.string().optional().describe("Optional match kind: file, directory, or any. Defaults to file."),
  },
  async execute(args, context) {
    const workspace = path.resolve(context.directory)
    const repositoriesRoot = path.resolve(workspace, "repositories")
    const repository = validateRepositoryName(args.repository)
    const repositoryRoot = path.resolve(repositoriesRoot, repository)
    const requestedPattern = args.pattern.trim().replace(/\\/g, "/").replace(/^\.\//, "")
    const requestedKind = (args.kind?.trim().toLowerCase() || "file") as "file" | "directory" | "any"

    if (!requestedPattern || path.posix.isAbsolute(requestedPattern) || requestedPattern.split("/").includes(".."))
      throw new Error(`pattern must be a non-empty repository-relative pattern without parent traversal: ${args.pattern}`)
    if (!new Set(["file", "directory", "any"]).has(requestedKind))
      throw new Error(`kind must be file, directory, or any: ${args.kind}`)

    const repositoryPath = relativeToWorkspace(workspace, repositoryRoot)
    if (!(await exists(repositoryRoot))) {
      return JSON.stringify({ repository, repositoryPath, repositoryExists: false, pattern: requestedPattern, kind: requestedKind, matchCount: 0, matches: [], warnings: [`Repository does not exist: ${repository}`] }, null, 2)
    }

    const resolvedRoot = await realpath(repositoryRoot).catch(() => repositoryRoot)
    const resolvedRepositories = await realpath(repositoriesRoot).catch(() => repositoriesRoot)
    const resolvedRelative = path.relative(resolvedRepositories, resolvedRoot)
    if (resolvedRelative.startsWith("..") || path.isAbsolute(resolvedRelative))
      throw new Error(`Resolved repository path escapes the workspace repositories directory: ${repository}`)

    const matcher = globToRegExp(requestedPattern)
    const matches: Match[] = []
    const warnings: string[] = []

    async function walk(current: string): Promise<void> {
      let entries
      try { entries = await readdir(current, { withFileTypes: true }) }
      catch (error) { warnings.push(`Unable to read ${relativeToWorkspace(workspace, current)}: ${error instanceof Error ? error.message : String(error)}`); return }

      for (const entry of entries) {
        const absolute = path.join(current, entry.name)
        const repositoryRelative = toPosix(path.relative(repositoryRoot, absolute))
        const entryKind: MatchKind | null = entry.isFile() ? "file" : entry.isDirectory() ? "directory" : null
        if (entryKind && (requestedKind === "any" || requestedKind === entryKind) && matcher.test(repositoryRelative)) {
          matches.push({ path: relativeToWorkspace(workspace, absolute), repositoryPath: repositoryRelative, name: entry.name, kind: entryKind })
        }
        if (entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name.toLowerCase())) await walk(absolute)
      }
    }

    await walk(repositoryRoot)
    matches.sort((a, b) => a.repositoryPath.localeCompare(b.repositoryPath))

    return JSON.stringify({
      repository,
      repositoryPath,
      repositoryExists: true,
      pattern: requestedPattern,
      kind: requestedKind,
      matchCount: matches.length,
      matches,
      warnings,
      guarantees: [
        "Discovery is constrained to the canonical repository and uses direct filesystem enumeration rather than the generic glob tool.",
        "Ignored dependency, build, IDE and cache directories are excluded from recursive discovery.",
        "Returned paths establish existence only; they do not establish file-content semantics or current implementation behavior.",
        "A caller must read a returned file before presenting its contents as current-run evidence.",
        "Specialized inventories remain preferred when they own the requested discovery, such as repository_config_inventory for configuration sources.",
      ],
    }, null, 2)
  },
})
