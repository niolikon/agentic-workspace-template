import { tool } from "@opencode-ai/plugin"
import { acquireEvidence } from "../skills/review-evidence-acquisition/acquire"

export default tool({
  description: "Acquire canonical work-item or change evidence from an explicitly selected Review backend. Read-only, with controlled evidence failures.",
  args: {
    family: tool.schema.enum(["workItemBackends", "changeBackends"]),
    backendId: tool.schema.string().describe("Exact resolved backend ID"),
    externalId: tool.schema.string().describe("Stable source resource ID"),
    repository: tool.schema.string().optional().describe("Exact repository scope, when supplied"),
  },
  async execute(args, context) {
    return JSON.stringify(await acquireEvidence(context.directory, args), null, 2)
  },
})
