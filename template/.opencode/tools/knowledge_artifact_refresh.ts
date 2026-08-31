import { tool } from "@opencode-ai/plugin"
import { createHash } from "node:crypto"
import { mkdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"

type Action = "inspect" | "replace"
type LineEnding = "crlf" | "lf"

function toPosix(value: string): string { return value.split(path.sep).join("/") }

async function exists(value: string): Promise<boolean> {
  try { await stat(value); return true } catch { return false }
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function parseAction(value: string): Action {
  const normalized = value.trim().toLowerCase()
  if (normalized === "inspect" || normalized === "replace") return normalized
  throw new Error(`action must be inspect or replace: ${value}`)
}

function resolveArtifact(workspace: string, value: string): { absolute: string; relative: string } {
  const requested = value.trim().replace(/\\/g, "/")
  if (!requested) throw new Error("artifactPath must not be empty")
  const relative = requested.startsWith("knowledge-base/") ? requested : `knowledge-base/${requested}`
  const absolute = path.resolve(workspace, relative)
  const safeRelative = toPosix(path.relative(workspace, absolute))
  if (
    safeRelative.startsWith("../") ||
    path.isAbsolute(safeRelative) ||
    !safeRelative.startsWith("knowledge-base/repositories/") ||
    !safeRelative.toLowerCase().endsWith(".md")
  ) {
    throw new Error(`artifactPath must be a Markdown repository artifact under knowledge-base/repositories/: ${value}`)
  }
  return { absolute, relative: safeRelative }
}

function lineEndingOf(content: string): LineEnding {
  return content.includes("\r\n") ? "crlf" : "lf"
}

function normalizeLineEndings(content: string, ending: LineEnding): string {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  return ending === "crlf" ? normalized.replace(/\n/g, "\r\n") : normalized
}

function duplicateExactHeadings(content: string): string[] {
  const counts = new Map<string, number>()
  const lines = content.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index].trim()
    const atx = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(rawLine)
    if (atx) {
      const key = `${atx[1]} ${atx[2].trim().toLowerCase()}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
      continue
    }
    const underline = index + 1 < lines.length ? /^\s*(=+|-+)\s*$/.exec(lines[index + 1]) : null
    if (!rawLine || !underline) continue
    const level = underline[1][0] === "=" ? "#" : "##"
    const key = `${level} ${rawLine.toLowerCase()}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([heading]) => heading)
}

export default tool({
  description: "Safely inspect and canonically replace an existing repository knowledge artifact. Use inspect before reusing prior knowledge; it returns the complete content and a revision token. Use replace with that exact token and the complete desired document. The tool rejects stale revisions, forbids paths outside knowledge-base/repositories, preserves existing line endings, performs a whole-file replacement, and verifies persisted content. Repository overview.md replacements also reject duplicate exact Markdown headings.",
  args: {
    action: tool.schema.string().describe("inspect or replace"),
    artifactPath: tool.schema.string().describe("Workspace-relative Markdown artifact path under knowledge-base/repositories/"),
    expectedRevision: tool.schema.string().optional().describe("Required for replace. Exact revision token returned by the preceding inspect of this artifact."),
    content: tool.schema.string().optional().describe("Required for replace. Complete desired artifact content, never a patch or fragment."),
  },
  async execute(args, context) {
    const action = parseAction(args.action)
    const workspace = path.resolve(context.directory)
    const artifact = resolveArtifact(workspace, args.artifactPath)

    if (action === "inspect") {
      if (!await exists(artifact.absolute)) throw new Error(`Knowledge artifact does not exist: ${artifact.relative}`)
      const content = await readFile(artifact.absolute, "utf8")
      return JSON.stringify({
        action: "inspect",
        artifactPath: artifact.relative,
        revision: sha256(content),
        lineEnding: lineEndingOf(content),
        content,
      }, null, 2)
    }

    if (!args.expectedRevision?.trim()) throw new Error("expectedRevision is required for replace; call inspect first")
    if (typeof args.content !== "string") throw new Error("content is required for replace and must be the complete desired artifact")
    if (!await exists(artifact.absolute)) throw new Error(`Cannot refresh missing artifact: ${artifact.relative}`)

    const current = await readFile(artifact.absolute, "utf8")
    const currentRevision = sha256(current)
    if (currentRevision !== args.expectedRevision.trim()) {
      throw new Error(`Stale knowledge artifact revision for ${artifact.relative}. Expected ${args.expectedRevision.trim()}, current ${currentRevision}. Inspect again before replacing.`)
    }

    const ending = lineEndingOf(current)
    const replacement = normalizeLineEndings(args.content, ending)
    if (artifact.relative.toLowerCase().endsWith("/overview.md")) {
      const duplicates = duplicateExactHeadings(replacement)
      if (duplicates.length) throw new Error(`Repository overview contains duplicate exact Markdown headings: ${duplicates.join(", ")}`)
    }

    await mkdir(path.dirname(artifact.absolute), { recursive: true })
    await writeFile(artifact.absolute, replacement, "utf8")

    const persisted = await readFile(artifact.absolute, "utf8")
    if (persisted !== replacement) throw new Error(`Persisted-content verification failed for ${artifact.relative}`)

    return JSON.stringify({
      action: "replace",
      artifactPath: artifact.relative,
      previousRevision: currentRevision,
      revision: sha256(persisted),
      lineEnding: lineEndingOf(persisted),
      verification: {
        exactContentPersisted: true,
        wholeFileReplacement: true,
        revisionMatched: true,
      },
    }, null, 2)
  },
})
