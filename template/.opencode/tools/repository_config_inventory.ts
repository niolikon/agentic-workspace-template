import { tool } from "@opencode-ai/plugin"
import { readdir, realpath, stat } from "node:fs/promises"
import path from "node:path"

type Candidate = {
  path: string
  name: string
  sourceFamily: string
  reason: string
}

const IGNORED_DIRECTORIES = new Set([
  ".git", "node_modules", "target", "build", "dist", "out", "bin", "obj",
  ".idea", ".vscode", ".venv", "venv", "__pycache__", ".pytest_cache",
  ".mypy_cache", ".tox", ".gradle", ".next", "coverage",
])

const CONFIG_DIRECTORIES = new Set([
  "config", "configs", "configuration", "conf", "settings",
])

const EXACT_NAMES = new Map<string, { sourceFamily: string; reason: string }>([
  ["application.yml", { sourceFamily: "application", reason: "conventional application configuration" }],
  ["application.yaml", { sourceFamily: "application", reason: "conventional application configuration" }],
  ["application.properties", { sourceFamily: "application", reason: "conventional application configuration" }],
  ["bootstrap.yml", { sourceFamily: "application", reason: "conventional bootstrap configuration" }],
  ["bootstrap.yaml", { sourceFamily: "application", reason: "conventional bootstrap configuration" }],
  ["bootstrap.properties", { sourceFamily: "application", reason: "conventional bootstrap configuration" }],
  ["appsettings.json", { sourceFamily: "application", reason: "conventional application settings" }],
  ["pyproject.toml", { sourceFamily: "project", reason: "project configuration manifest" }],
  ["setup.cfg", { sourceFamily: "project", reason: "project configuration manifest" }],
  ["tox.ini", { sourceFamily: "project", reason: "project/runtime configuration" }],
  ["microprofile-config.properties", { sourceFamily: "application", reason: "MicroProfile application configuration" }],
  ["config.toml", { sourceFamily: "application", reason: "conventional TOML application configuration" }],
  ["config.yaml", { sourceFamily: "application", reason: "conventional YAML application configuration" }],
  ["config.yml", { sourceFamily: "application", reason: "conventional YAML application configuration" }],
  ["docker-compose.yml", { sourceFamily: "deployment", reason: "container orchestration configuration" }],
  ["docker-compose.yaml", { sourceFamily: "deployment", reason: "container orchestration configuration" }],
  ["compose.yml", { sourceFamily: "deployment", reason: "container orchestration configuration" }],
  ["compose.yaml", { sourceFamily: "deployment", reason: "container orchestration configuration" }],
  ["chart.yaml", { sourceFamily: "deployment", reason: "Helm chart metadata" }],
  ["values.yaml", { sourceFamily: "deployment", reason: "Helm values configuration" }],
  ["values.yml", { sourceFamily: "deployment", reason: "Helm values configuration" }],
])

const CONFIG_DIRECTORY_EXTENSIONS = new Set([
  ".yml", ".yaml", ".json", ".toml", ".ini", ".cfg", ".conf", ".properties", ".xml", ".php", ".rb", ".py",
])

function toPosix(value: string): string { return value.split(path.sep).join("/") }
function relativeToWorkspace(workspace: string, value: string): string { return toPosix(path.relative(workspace, value) || ".") }
async function exists(value: string): Promise<boolean> { try { await stat(value); return true } catch { return false } }

function classify(name: string, relativePath: string): { sourceFamily: string; reason: string } | null {
  const lowerName = name.toLowerCase()
  const exact = EXACT_NAMES.get(lowerName)
  if (exact) return exact

  if (/^application-[^/]+\.(yml|yaml|properties)$/i.test(name))
    return { sourceFamily: "application", reason: "profile-specific application configuration" }
  if (/^bootstrap-[^/]+\.(yml|yaml|properties)$/i.test(name))
    return { sourceFamily: "application", reason: "profile-specific bootstrap configuration" }
  if (/^appsettings\.[^/]+\.json$/i.test(name))
    return { sourceFamily: "application", reason: "environment-specific application settings" }
  if (/^\.env(?:\..+)?$/i.test(name))
    return { sourceFamily: "environment", reason: "environment-variable configuration" }
  if (/^dockerfile(?:\..+)?$/i.test(name))
    return { sourceFamily: "deployment", reason: "container build/runtime configuration" }
  if (/^values-[^/]+\.(yml|yaml)$/i.test(name))
    return { sourceFamily: "deployment", reason: "environment-specific Helm values configuration" }
  if (/^(?:.+\.)?config\.(js|cjs|mjs|ts|json|yml|yaml)$/i.test(name))
    return { sourceFamily: "application", reason: "conventional named configuration file" }
  if (/^(settings|config)\.py$/i.test(name))
    return { sourceFamily: "application", reason: "conventional Python configuration module" }
  if (/^(config|settings)\.php$/i.test(name))
    return { sourceFamily: "application", reason: "conventional PHP configuration file" }
  if (/^(application|environment|database|secrets|routes)\.(rb|yml|yaml)$/i.test(name))
    return { sourceFamily: "application", reason: "conventional Ruby/Rails configuration file" }

  const segments = toPosix(relativePath).toLowerCase().split("/")
  const insideConfigDirectory = segments.slice(0, -1).some((segment) => CONFIG_DIRECTORIES.has(segment))
  if (insideConfigDirectory && CONFIG_DIRECTORY_EXTENSIONS.has(path.extname(lowerName)))
    return { sourceFamily: "configuration-directory", reason: "configuration-like file under a conventional configuration directory" }

  return null
}

async function walk(repositoryRoot: string, current: string, workspace: string, candidates: Candidate[], warnings: string[]): Promise<void> {
  let entries
  try { entries = await readdir(current, { withFileTypes: true }) }
  catch (error) { warnings.push(`Unable to read ${relativeToWorkspace(workspace, current)}: ${error instanceof Error ? error.message : String(error)}`); return }

  for (const entry of entries) {
    const absolute = path.join(current, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name.toLowerCase())) continue
      await walk(repositoryRoot, absolute, workspace, candidates, warnings)
      continue
    }
    if (!entry.isFile()) continue

    const repositoryRelative = toPosix(path.relative(repositoryRoot, absolute))
    const classification = classify(entry.name, repositoryRelative)
    if (!classification) continue
    candidates.push({
      path: relativeToWorkspace(workspace, absolute),
      name: entry.name,
      sourceFamily: classification.sourceFamily,
      reason: classification.reason,
    })
  }
}

export default tool({
  description: "Return a deterministic inventory of plausible repository-local configuration sources across common application, environment, project and deployment conventions. The tool inventories paths only; it does not interpret configuration semantics or assert that a candidate participates in an effective configuration chain. Prefer this over broad glob discovery when deciding which configuration sources may exist in a repository.",
  args: {
    repository: tool.schema.string().describe("Canonical repository identifier under the workspace repositories directory."),
  },
  async execute(args, context) {
    const workspace = path.resolve(context.directory)
    const repositoriesRoot = path.resolve(workspace, "repositories")
    const repositoryName = args.repository.trim()
    if (!repositoryName || repositoryName === "." || repositoryName === ".." || repositoryName.includes("/") || repositoryName.includes("\\"))
      throw new Error(`Repository must be a canonical immediate child identifier: ${args.repository}`)

    const repositoryRoot = path.resolve(repositoriesRoot, repositoryName)
    const relative = path.relative(repositoriesRoot, repositoryRoot)
    if (relative.startsWith("..") || path.isAbsolute(relative) || relative.includes(path.sep))
      throw new Error(`Repository must stay inside the workspace repositories directory: ${args.repository}`)
    if (!(await exists(repositoryRoot)))
      return JSON.stringify({ repository: repositoryName, repositoryPath: relativeToWorkspace(workspace, repositoryRoot), candidateCount: 0, candidates: [], warnings: [`Repository does not exist: ${repositoryName}`] }, null, 2)

    const resolvedRoot = await realpath(repositoryRoot).catch(() => repositoryRoot)
    const resolvedRepositories = await realpath(repositoriesRoot).catch(() => repositoriesRoot)
    const resolvedRelative = path.relative(resolvedRepositories, resolvedRoot)
    if (resolvedRelative.startsWith("..") || path.isAbsolute(resolvedRelative))
      throw new Error(`Resolved repository path escapes the workspace repositories directory: ${args.repository}`)

    const candidates: Candidate[] = []
    const warnings: string[] = []
    await walk(repositoryRoot, repositoryRoot, workspace, candidates, warnings)
    candidates.sort((a, b) => a.path.localeCompare(b.path))

    return JSON.stringify({
      repository: repositoryName,
      repositoryPath: relativeToWorkspace(workspace, repositoryRoot),
      candidateCount: candidates.length,
      candidates,
      warnings,
      guarantees: [
        "Discovery uses direct filesystem enumeration rather than the generic glob tool.",
        "Ignored build, dependency, IDE and cache directories are excluded from recursive discovery.",
        "Returned candidates are existence/discovery evidence only and do not establish configuration precedence, binding, runtime activation or semantic relevance.",
        "Configuration semantics remain the responsibility of configuration-resolution after focused content inspection.",
      ],
    }, null, 2)
  },
})
