import { tool } from "@opencode-ai/plugin"
import { resolveFromWorkspace } from "../skills/review-backend-resolution/resolve"

export default tool({
  description: "Resolve a configured Review backend deterministically without accessing credentials. Returns a sanitized descriptor or an explicit ambiguity/error.",
  args: {
    family: tool.schema.enum(["workItemBackends", "changeBackends"]),
    backendId: tool.schema.string().optional().describe("Explicit backend ID from the request"),
    repository: tool.schema.string().optional().describe("Exact configured repository identity"),
    backendHint: tool.schema.string().optional().describe("Backend ID from observed repository metadata"),
    resourceUrl: tool.schema.string().optional().describe("Secret-free HTTPS source URL used to constrain compatibility"),
  },
  async execute(args, context) {
    return JSON.stringify(await resolveFromWorkspace(context.directory, args), null, 2)
  },
})
