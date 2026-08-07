import { tool } from "@opencode-ai/plugin"
import { readdir, readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"

type GitCommandResult = { ok: boolean; stdout: string; stderr: string }
type Submodule = { name: string; path: string; url: string | null; pinnedCommit: string | null; initialized: boolean | null }
type Repository = {
  name: string
  path: string
  realPath: string
  gitMetadataType: "directory" | "file"
  topLevel: string | null
  remoteUrl: string | null
  branch: string | null
  commit: string | null
  isOrchestrator: boolean
  submodules: Submodule[]
  manifests: string[]
  warnings: string[]
}

const IGNORED_DIRECTORIES = new Set(["node_modules", "target", "build", "dist", "bin", "obj", ".idea", ".vscode", ".venv", "venv", "__pycache__"])
const MANIFEST_NAMES = new Set(["pom.xml", "build.gradle", "build.gradle.kts", "package.json", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml"])

function toPosix(value: string): string { return value.split(path.sep).join("/") }
function relativeToWorkspace(workspace: string, value: string): string { return toPosix(path.relative(workspace, value) || ".") }
async function exists(value: string): Promise<boolean> { try { await stat(value); return true } catch { return false } }

async function runGit(repositoryPath: string, args: string[]): Promise<GitCommandResult> {
  return await new Promise((resolve) => {
    const child = spawn("git", ["-C", repositoryPath, ...args], { windowsHide: true, shell: false })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => { stdout += chunk.toString() })
    child.stderr.on("data", (chunk) => { stderr += chunk.toString() })
    child.on("error", (error) => resolve({ ok: false, stdout, stderr: `${stderr}${error.message}` }))
    child.on("close", (code) => resolve({ ok: code === 0, stdout: stdout.trim(), stderr: stderr.trim() }))
  })
}

async function discoverGitRoots(current: string, result: Map<string, "directory" | "file">): Promise<void> {
  let entries
  try { entries = await readdir(current, { withFileTypes: true }) } catch { return }
  for (const entry of entries) {
    if (entry.name === ".git") {
      result.set(current, entry.isDirectory() ? "directory" : "file")
      continue
    }
    if (!entry.isDirectory() || IGNORED_DIRECTORIES.has(entry.name)) continue
    await discoverGitRoots(path.join(current, entry.name), result)
  }
}

async function discoverManifests(repositoryRoot: string): Promise<string[]> {
  const manifests: string[] = []
  let entries
  try { entries = await readdir(repositoryRoot, { withFileTypes: true }) } catch { return manifests }
  for (const entry of entries) {
    if (entry.isFile() && (MANIFEST_NAMES.has(entry.name) || entry.name.endsWith(".sln") || entry.name.endsWith(".csproj"))) {
      manifests.push(entry.name)
      continue
    }
    if (!entry.isDirectory() || !["src", "source"].includes(entry.name)) continue
    const childRoot = path.join(repositoryRoot, entry.name)
    let nested
    try { nested = await readdir(childRoot, { withFileTypes: true }) } catch { continue }
    for (const child of nested) {
      if (child.isFile() && (child.name.endsWith(".sln") || child.name.endsWith(".csproj"))) {
        manifests.push(`${entry.name}/${child.name}`)
      } else if (child.isDirectory()) {
        let deeper
        try { deeper = await readdir(path.join(childRoot, child.name), { withFileTypes: true }) } catch { continue }
        for (const file of deeper) {
          if (file.isFile() && (file.name.endsWith(".sln") || file.name.endsWith(".csproj"))) manifests.push(`${entry.name}/${child.name}/${file.name}`)
        }
      }
    }
  }
  return [...new Set(manifests)].sort()
}

function parseGitmodules(content: string): Array<{ name: string; path: string; url: string | null }> {
  const result: Array<{ name: string; path: string; url: string | null }> = []
  let current: { name: string; path: string | null; url: string | null } | null = null
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    const section = line.match(/^\[submodule\s+"(.+)"\]$/)
    if (section) {
      if (current?.path) result.push({ name: current.name, path: current.path, url: current.url })
      current = { name: section[1], path: null, url: null }
      continue
    }
    if (!current) continue
    const property = line.match(/^([A-Za-z0-9._-]+)\s*=\s*(.+)$/)
    if (!property) continue
    if (property[1] === "path") current.path = property[2].trim()
    if (property[1] === "url") current.url = property[2].trim()
  }
  if (current?.path) result.push({ name: current.name, path: current.path, url: current.url })
  return result
}

async function readSubmodules(workspace: string, repositoryRoot: string): Promise<Submodule[]> {
  const gitmodulesPath = path.join(repositoryRoot, ".gitmodules")
  if (!(await exists(gitmodulesPath))) return []
  const declarations = parseGitmodules(await readFile(gitmodulesPath, "utf8"))
  const status = await runGit(repositoryRoot, ["submodule", "status", "--recursive"])
  const statusByPath = new Map<string, { commit: string; initialized: boolean }>()
  if (status.ok) {
    for (const line of status.stdout.split(/\r?\n/)) {
      const match = line.match(/^([ +-U])?([0-9a-fA-F]{40})\s+(\S+)/)
      if (match) statusByPath.set(toPosix(match[3]), { commit: match[2], initialized: match[1] !== "-" })
    }
  }
  return declarations.map((item) => {
    const matched = statusByPath.get(toPosix(item.path))
    return {
      name: item.name,
      path: relativeToWorkspace(workspace, path.join(repositoryRoot, item.path)),
      url: item.url,
      pinnedCommit: matched?.commit ?? null,
      initialized: matched?.initialized ?? null,
    }
  })
}

async function inspectRepository(workspace: string, repositoryRoot: string, gitMetadataType: "directory" | "file"): Promise<Repository> {
  const warnings: string[] = []
  const topLevel = await runGit(repositoryRoot, ["rev-parse", "--show-toplevel"])
  const remote = await runGit(repositoryRoot, ["config", "--get", "remote.origin.url"])
  const branch = await runGit(repositoryRoot, ["branch", "--show-current"])
  const commit = await runGit(repositoryRoot, ["rev-parse", "HEAD"])
  if (!topLevel.ok) warnings.push(`git rev-parse failed: ${topLevel.stderr || "unknown error"}`)
  const submodules = await readSubmodules(workspace, repositoryRoot)
  const manifests = await discoverManifests(repositoryRoot)
  const resolved = await realpath(repositoryRoot).catch(() => repositoryRoot)
  return {
    name: path.basename(repositoryRoot),
    path: relativeToWorkspace(workspace, repositoryRoot),
    realPath: relativeToWorkspace(workspace, resolved),
    gitMetadataType,
    topLevel: topLevel.ok ? relativeToWorkspace(workspace, topLevel.stdout) : null,
    remoteUrl: remote.ok ? remote.stdout : null,
    branch: branch.ok && branch.stdout ? branch.stdout : null,
    commit: commit.ok ? commit.stdout : null,
    isOrchestrator: submodules.length > 0,
    submodules,
    manifests,
    warnings,
  }
}

export default tool({
  description: "Return the authoritative inventory of every Git repository under the workspace repositories directory, including standalone repositories, nested repositories, orchestrators, submodules, Git identity and primary manifests. Use this before any glob-based repository discovery.",
  args: {
    root: tool.schema.string().optional().describe("Workspace-relative root to scan. Defaults to repositories."),
  },
  async execute(args, context) {
    const workspace = path.resolve(context.directory)
    const requestedRoot = args.root?.trim() || "repositories"
    const scanRoot = path.resolve(workspace, requestedRoot)
    const relativeRoot = path.relative(workspace, scanRoot)
    if (relativeRoot.startsWith("..") || path.isAbsolute(relativeRoot)) throw new Error(`The scan root must stay inside the workspace: ${requestedRoot}`)
    if (!(await exists(scanRoot))) {
      return JSON.stringify({ workspace: toPosix(workspace), scanRoot: requestedRoot, repositories: [], warnings: [`Scan root does not exist: ${requestedRoot}`] }, null, 2)
    }
    const discovered = new Map<string, "directory" | "file">()
    await discoverGitRoots(scanRoot, discovered)
    const repositories: Repository[] = []
    for (const [repositoryRoot, metadataType] of [...discovered.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      repositories.push(await inspectRepository(workspace, repositoryRoot, metadataType))
    }
    const byRemote = new Map<string, string[]>()
    for (const repository of repositories) {
      if (!repository.remoteUrl) continue
      const normalized = repository.remoteUrl.replace(/\.git$/, "").toLowerCase()
      const paths = byRemote.get(normalized) ?? []
      paths.push(repository.path)
      byRemote.set(normalized, paths)
    }
    const duplicateLogicalRepositories = [...byRemote.entries()].filter(([, paths]) => paths.length > 1).map(([remoteUrl, paths]) => ({ remoteUrl, paths }))
    return JSON.stringify({
      workspace: toPosix(workspace),
      scanRoot: toPosix(relativeToWorkspace(workspace, scanRoot)),
      repositoryCount: repositories.length,
      repositories,
      duplicateLogicalRepositories,
      guarantees: [
        "Every discovered Git repository is included regardless of orchestrator or submodule membership.",
        "Standalone and apparently unrelated repositories remain first-class workspace repositories.",
        "Glob results are not used as the authoritative repository inventory.",
      ],
    }, null, 2)
  },
})
