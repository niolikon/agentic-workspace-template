import { tool } from "@opencode-ai/plugin"
import { readdir, readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"
import { inflateRawSync, inflateSync } from "node:zlib"

type SearchHit = {
  path: string
  format: string
  matchedTerms: string[]
  matchedBy: Array<"path" | "content">
  score: number
  snippets: string[]
}

type UnsearchedCandidate = {
  path: string
  format: string
  reason: string
}

type PassageMatch = {
  score: number
  matchedTerms: string[]
  text: string
}

const ALLOWED_SCOPES = new Set(["documents", "trainings", "notes", "knowledge-base"])
const IGNORED_DIRECTORIES = new Set([".git", "node_modules", ".tmp"])
const TEXT_EXTENSIONS = new Set([
  ".md", ".txt", ".adoc", ".rst", ".csv", ".json", ".jsonc", ".xml",
  ".yml", ".yaml", ".toml", ".ini", ".cfg", ".conf", ".properties",
  ".java", ".kt", ".kts", ".cs", ".fs", ".vb", ".py", ".js", ".jsx",
  ".ts", ".tsx", ".mjs", ".cjs", ".go", ".rs", ".rb", ".php", ".sh",
  ".ps1", ".sql", ".graphql", ".proto", ".html", ".htm", ".css", ".scss",
])
const OOXML_EXTENSIONS = new Set([".docx", ".pptx"])
const CANDIDATE_ONLY_EXTENSIONS = new Set([".doc", ".ppt", ".xlsx", ".xls"])
const MAX_TEXT_BYTES = 4 * 1024 * 1024
const MAX_RESULTS = 20
const MAX_SNIPPETS = 3
const SNIPPET_RADIUS = 120

function toPosix(value: string): string { return value.split(path.sep).join("/") }
function workspaceRelative(workspace: string, value: string): string { return toPosix(path.relative(workspace, value) || ".") }
async function exists(value: string): Promise<boolean> { try { await stat(value); return true } catch { return false } }

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function canonicalTerm(term: string): string {
  const normalized = normalize(term)
  if (normalized.length > 4 && normalized.endsWith("s") && !normalized.endsWith("ss")) return normalized.slice(0, -1)
  return normalized
}

function queryAlternatives(query: string): string[][] {
  const alternatives = query
    .split("|")
    .map((alternative) => normalize(alternative)
      .split(" ")
      .map(canonicalTerm)
      .filter((term) => term.length >= 3))
    .filter((terms) => terms.length > 0)
    .map((terms) => [...new Set(terms)])

  const unique = new Map<string, string[]>()
  for (const alternative of alternatives) unique.set(alternative.join(" "), alternative)
  return [...unique.values()]
}

function queryTerms(alternatives: string[][]): string[] {
  return [...new Set(alternatives.flat())]
}

function normalizedTokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .map(canonicalTerm)
    .filter(Boolean)
}

function decodeXml(value: string): string {
  return value
    .replace(/<w:tab\s*\/?>/gi, "\t")
    .replace(/<w:br\s*\/?>/gi, "\n")
    .replace(/<a:br\s*\/?>/gi, "\n")
    .replace(/<\/w:p>/gi, "\n")
    .replace(/<\/a:p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim()
}

function decodePdfLiteralString(value: string): string {
  let output = ""
  for (let index = 0; index < value.length; index++) {
    const current = value[index]
    if (current !== "\\") { output += current; continue }
    const next = value[++index]
    if (next === undefined) break
    if (next === "n") output += "\n"
    else if (next === "r") output += "\r"
    else if (next === "t") output += "\t"
    else if (next === "b") output += "\b"
    else if (next === "f") output += "\f"
    else if (next === "\n") continue
    else if (next === "\r") { if (value[index + 1] === "\n") index++; continue }
    else if (/[0-7]/.test(next)) {
      let octal = next
      for (let count = 0; count < 2 && /[0-7]/.test(value[index + 1] || ""); count++) octal += value[++index]
      output += String.fromCharCode(Number.parseInt(octal, 8))
    } else output += next
  }
  return output
}

function extractPdfLiteralStrings(value: string): string[] {
  const strings: string[] = []
  let index = 0
  while (index < value.length) {
    if (value[index] !== "(") { index++; continue }
    index++
    let depth = 1
    let raw = ""
    while (index < value.length && depth > 0) {
      const current = value[index]
      if (current === "\\") {
        raw += current
        if (index + 1 < value.length) raw += value[++index]
      } else if (current === "(") { depth++; raw += current }
      else if (current === ")") { depth--; if (depth > 0) raw += current }
      else raw += current
      index++
    }
    if (raw) strings.push(decodePdfLiteralString(raw))
  }
  return strings
}

function extractPdfHexStrings(value: string): string[] {
  const strings: string[] = []
  const pattern = /<([0-9a-fA-F\s]+)>/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(value)) !== null) {
    let hex = match[1].replace(/\s+/g, "")
    if (hex.length < 2) continue
    if (hex.length % 2 !== 0) hex += "0"
    try {
      const bytes = Buffer.from(hex, "hex")
      if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        let decoded = ""
        for (let index = 2; index + 1 < bytes.length; index += 2) decoded += String.fromCharCode(bytes.readUInt16BE(index))
        strings.push(decoded)
      } else strings.push(bytes.toString("latin1"))
    } catch { /* malformed hex string: ignore */ }
  }
  return strings
}

function decodeAscii85(buffer: Buffer): Buffer {
  let source = buffer.toString("latin1").replace(/\s+/g, "")
  if (source.startsWith("<~")) source = source.slice(2)
  const end = source.indexOf("~>")
  if (end >= 0) source = source.slice(0, end)
  const bytes: number[] = []
  let group: number[] = []
  const flush = (partial: boolean) => {
    const originalLength = group.length
    while (group.length < 5) group.push(84)
    let value = 0
    for (const digit of group) value = value * 85 + digit
    const decoded = [
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    ]
    bytes.push(...decoded.slice(0, partial ? originalLength - 1 : 4))
    group = []
  }

  for (const char of source) {
    if (char === "z") {
      if (group.length !== 0) throw new Error("Invalid ASCII85 z inside group")
      bytes.push(0, 0, 0, 0)
      continue
    }
    const code = char.charCodeAt(0)
    if (code < 33 || code > 117) continue
    group.push(code - 33)
    if (group.length === 5) flush(false)
  }
  if (group.length === 1) throw new Error("Invalid ASCII85 trailing group")
  if (group.length > 1) flush(true)
  return Buffer.from(bytes)
}

function decodePdfStream(raw: Buffer, dictionary: string): Buffer | null {
  const filters = [...dictionary.matchAll(/\/(ASCII85Decode|A85|FlateDecode|Fl)\b/g)].map((match) => match[1])
  if (filters.length === 0) return /\/Filter\b/.test(dictionary) ? null : raw
  let decoded = raw
  try {
    for (const filter of filters) {
      if (filter === "ASCII85Decode" || filter === "A85") decoded = decodeAscii85(decoded)
      else if (filter === "FlateDecode" || filter === "Fl") {
        try { decoded = inflateSync(decoded) }
        catch { decoded = inflateRawSync(decoded) }
      } else return null
    }
    return decoded
  } catch { return null }
}

function extractPdfSearchableText(buffer: Buffer): string {
  const chunks: string[] = []
  const source = buffer.toString("latin1")
  chunks.push(...extractPdfLiteralStrings(source), ...extractPdfHexStrings(source))

  const streamPattern = /stream\r?\n/g
  let match: RegExpExecArray | null
  while ((match = streamPattern.exec(source)) !== null) {
    const dataStart = match.index + match[0].length
    const dataEnd = source.indexOf("endstream", dataStart)
    if (dataEnd < 0) break
    const dictionaryStart = Math.max(0, source.lastIndexOf("<<", match.index))
    const dictionary = source.slice(dictionaryStart, match.index)
    const raw = buffer.subarray(dataStart, dataEnd)
    const decoded = decodePdfStream(raw, dictionary)
    if (decoded !== null) {
      const text = decoded.toString("latin1")
      chunks.push(...extractPdfLiteralStrings(text), ...extractPdfHexStrings(text))
    }
    streamPattern.lastIndex = dataEnd + "endstream".length
  }

  return chunks
    .map((chunk) => chunk.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const minimum = Math.max(0, buffer.length - 65_557)
  for (let offset = buffer.length - 22; offset >= minimum; offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset
  }
  throw new Error("ZIP end-of-central-directory record not found")
}

function extractZipEntries(buffer: Buffer, accepts: (name: string) => boolean): Array<{ name: string; content: Buffer }> {
  const end = findEndOfCentralDirectory(buffer)
  const entryCount = buffer.readUInt16LE(end + 10)
  let offset = buffer.readUInt32LE(end + 16)
  const entries: Array<{ name: string; content: Buffer }> = []

  for (let index = 0; index < entryCount; index++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("Invalid ZIP central-directory entry")
    const method = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const fileNameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localHeaderOffset = buffer.readUInt32LE(offset + 42)
    const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8")

    if (accepts(name)) {
      if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) throw new Error(`Invalid ZIP local header for ${name}`)
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26)
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28)
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize)
      let content: Buffer
      if (method === 0) content = compressed
      else if (method === 8) content = inflateRawSync(compressed)
      else throw new Error(`Unsupported ZIP compression method ${method} for ${name}`)
      entries.push({ name, content })
    }

    offset += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

async function readSearchableText(file: string, extension: string): Promise<{ text: string | null; reason?: string }> {
  const info = await stat(file)
  if (TEXT_EXTENSIONS.has(extension)) {
    if (info.size > MAX_TEXT_BYTES) return { text: null, reason: `text file exceeds ${MAX_TEXT_BYTES} byte search limit` }
    return { text: await readFile(file, "utf8") }
  }

  if (OOXML_EXTENSIONS.has(extension)) {
    if (info.size > MAX_TEXT_BYTES) return { text: null, reason: `OOXML file exceeds ${MAX_TEXT_BYTES} byte search limit` }
    const buffer = await readFile(file)
    const accepts = extension === ".docx"
      ? (name: string) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/i.test(name)
      : (name: string) => /^ppt\/(slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/i.test(name)
    const entries = extractZipEntries(buffer, accepts)
    return { text: entries.map((entry) => decodeXml(entry.content.toString("utf8"))).filter(Boolean).join("\n") }
  }

  if (extension === ".pdf") {
    if (info.size > MAX_TEXT_BYTES) return { text: null, reason: `PDF file exceeds ${MAX_TEXT_BYTES} byte search limit; candidate remains discoverable by path` }
    const buffer = await readFile(file)
    const text = extractPdfSearchableText(buffer)
    if (text) return { text }
    return { text: null, reason: "PDF text could not be extracted reliably; candidate remains discoverable by path" }
  }

  if (CANDIDATE_ONLY_EXTENSIONS.has(extension))
    return { text: null, reason: `${extension} content is not indexed by this tool; candidate remains discoverable by path` }

  return { text: null, reason: `unsupported content format ${extension || "<none>"}` }
}

function passageCandidates(text: string): string[] {
  const candidates: string[] = []
  for (const block of text.split(/\n+/).map((value) => value.trim()).filter(Boolean)) {
    if (block.length <= 500) {
      candidates.push(block)
      continue
    }
    const sentences = block.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [block]
    for (const sentence of sentences.map((value) => value.trim()).filter(Boolean)) candidates.push(sentence)
  }
  return candidates
}

function scorePassage(text: string, alternatives: string[][]): PassageMatch | null {
  const tokens = normalizedTokens(text)
  if (tokens.length === 0) return null
  const tokenSet = new Set(tokens)
  const normalizedPassage = tokens.join(" ")

  let bestScore = 0
  let bestTerms: string[] = []
  for (const alternative of alternatives) {
    const matchedTerms = alternative.filter((term) => tokenSet.has(term))
    if (matchedTerms.length === 0) continue
    const coverage = matchedTerms.length / alternative.length
    const exactSequence = normalizedPassage.includes(alternative.join(" "))
    const cooccurrenceBonus = matchedTerms.length >= 2 ? 15 : 0
    const score = matchedTerms.length * 12 + coverage * 20 + cooccurrenceBonus + (exactSequence ? 30 : 0)
    if (score > bestScore) {
      bestScore = score
      bestTerms = matchedTerms
    }
  }

  return bestScore > 0 ? { score: bestScore, matchedTerms: [...new Set(bestTerms)], text } : null
}

function findPassageMatches(text: string, alternatives: string[][]): PassageMatch[] {
  return passageCandidates(text)
    .map((passage) => scorePassage(passage, alternatives))
    .filter((match): match is PassageMatch => match !== null)
    .sort((a, b) => b.score - a.score || b.matchedTerms.length - a.matchedTerms.length || a.text.localeCompare(b.text))
}

function buildSnippets(matches: PassageMatch[]): string[] {
  const snippets: string[] = []
  for (const match of matches) {
    if (snippets.length >= MAX_SNIPPETS) break
    let snippet = match.text.replace(/\s+/g, " ").trim()
    if (snippet.length > SNIPPET_RADIUS * 3) snippet = `${snippet.slice(0, SNIPPET_RADIUS * 3).trim()}…`
    if (snippet && !snippets.includes(snippet)) snippets.push(snippet)
  }
  return snippets
}

async function walk(current: string, files: string[], warnings: string[]): Promise<void> {
  let entries
  try { entries = await readdir(current, { withFileTypes: true }) }
  catch (error) { warnings.push(`Unable to read ${current}: ${error instanceof Error ? error.message : String(error)}`); return }

  for (const entry of entries) {
    const absolute = path.join(current, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name.toLowerCase())) continue
      await walk(absolute, files, warnings)
      continue
    }
    if (entry.isFile()) files.push(absolute)
  }
}

export default tool({
  description: "Search workspace evidence deterministically within one semantic source scope. Enumerates files directly and searches plain text, DOCX/PPTX OOXML and text-based PDF content without relying on generic grep indexing. PDFs whose text cannot be extracted and other unsupported binary formats remain discoverable as candidates and are never treated as absent. This tool returns discovery/search evidence only; evidence roles, authority and claim strength remain the responsibility of evidence-semantics.",
  args: {
    scope: tool.schema.string().describe("Evidence source scope: documents, trainings, notes, or knowledge-base."),
    query: tool.schema.string().describe("Natural-language terms to locate within the selected scope."),
  },
  async execute(args, context) {
    const workspace = path.resolve(context.directory)
    const scope = args.scope.trim()
    if (!ALLOWED_SCOPES.has(scope)) throw new Error(`Unsupported evidence scope: ${args.scope}`)

    const query = args.query.trim()
    const alternatives = queryAlternatives(query)
    const terms = queryTerms(alternatives)
    if (terms.length === 0) throw new Error("Query must contain at least one searchable term of three or more characters")

    const scopeRoot = path.resolve(workspace, scope)
    const relative = path.relative(workspace, scopeRoot)
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`Evidence scope escapes workspace: ${scope}`)
    if (!(await exists(scopeRoot))) {
      return JSON.stringify({ scope, query, candidateCount: 0, hitCount: 0, hits: [], unsearchedCandidates: [], warnings: [`Scope does not exist: ${scope}`] }, null, 2)
    }

    const resolvedWorkspace = await realpath(workspace).catch(() => workspace)
    const resolvedScope = await realpath(scopeRoot).catch(() => scopeRoot)
    const resolvedRelative = path.relative(resolvedWorkspace, resolvedScope)
    if (resolvedRelative.startsWith("..") || path.isAbsolute(resolvedRelative)) throw new Error(`Resolved evidence scope escapes workspace: ${scope}`)

    const files: string[] = []
    const warnings: string[] = []
    await walk(scopeRoot, files, warnings)
    files.sort((a, b) => a.localeCompare(b))

    const hits: SearchHit[] = []
    const unsearchedCandidates: UnsearchedCandidate[] = []
    for (const file of files) {
      const relativePath = workspaceRelative(workspace, file)
      const extension = path.extname(file).toLowerCase()
      const normalizedPath = normalize(relativePath)
      const pathTerms = terms.filter((term) => normalizedPath.includes(term))

      try {
        const searchable = await readSearchableText(file, extension)
        if (searchable.text !== null) {
          const passageMatches = findPassageMatches(searchable.text, alternatives)
          const contentTerms = [...new Set(passageMatches.flatMap((match) => match.matchedTerms))]
          const matchedTerms = [...new Set([...pathTerms, ...contentTerms])]
          if (matchedTerms.length === 0) continue
          const matchedBy: Array<"path" | "content"> = []
          if (pathTerms.length > 0) matchedBy.push("path")
          if (passageMatches.length > 0) matchedBy.push("content")
          const bestPassageScore = passageMatches[0]?.score || 0
          hits.push({
            path: relativePath,
            format: extension || "<none>",
            matchedTerms,
            matchedBy,
            score: bestPassageScore + Math.min(contentTerms.length * 2, 20) + pathTerms.length * 3,
            snippets: buildSnippets(passageMatches),
          })
        } else {
          unsearchedCandidates.push({ path: relativePath, format: extension || "<none>", reason: searchable.reason || "content not searchable" })
          if (pathTerms.length > 0) {
            hits.push({ path: relativePath, format: extension || "<none>", matchedTerms: pathTerms, matchedBy: ["path"], score: pathTerms.length * 3, snippets: [] })
          }
        }
      } catch (error) {
        unsearchedCandidates.push({ path: relativePath, format: extension || "<none>", reason: `content search failed: ${error instanceof Error ? error.message : String(error)}` })
      }
    }

    hits.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    unsearchedCandidates.sort((a, b) => a.path.localeCompare(b.path))

    return JSON.stringify({
      scope,
      query,
      alternatives,
      terms,
      candidateCount: files.length,
      hitCount: hits.length,
      hits: hits.slice(0, MAX_RESULTS),
      unsearchedCandidates,
      warnings,
      guarantees: [
        "Candidate discovery uses direct filesystem enumeration rather than generic glob or grep indexing.",
        "Plain text, DOCX/PPTX OOXML and extractable PDF text are searched deterministically within the selected scope.",
        "Pipe-separated query alternatives are evaluated independently and snippets are ranked by term co-occurrence and alternative coverage rather than first-term position.",
        "Unsupported binary formats remain visible as candidates; lack of indexed content is never reported as evidence of absence.",
        "Search results establish candidate relevance only and do not establish semantic authority, claim certainty or factual correctness.",
      ],
    }, null, 2)
  },
})
