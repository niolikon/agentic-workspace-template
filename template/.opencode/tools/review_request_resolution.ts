import { tool } from "@opencode-ai/plugin"
import { reviewWorkflow, type Action } from "../skills/review-request-resolution/workflow"

export default tool({
  description: "PREREQUISITES: first invoke skill with name review-evidence-model and wait for completion; separately invoke skill with name review-request-resolution and wait for completion. These are TWO calls: loading one does not load the other. Then resolve scope without assessment. Copy every user-named backend into backendId; null only when unspecified. Present ONLY scopePreview, revision, digest and nextAction, never interpret candidate patches. clarify-scope means ask missing selections then resolve and present a NEW candidate for confirmation; never offer confirmation or review now. request-confirmation means present scope and WAIT for the user's later reply. Confirm/begin only after that reply (or an explicit mechanical lifecycle test). Canonical candidate is transport evidence, not a request to assess it.",
  args: {
    action: tool.schema.enum(["resolve", "status", "confirm", "begin"]),
    references: tool.schema.array(tool.schema.object({
      family: tool.schema.enum(["workItemBackends", "changeBackends"]),
      externalId: tool.schema.string(),
      backendId: tool.schema.string().nullable().describe("REQUIRED: exact backend explicitly named by the user; overrides defaults. Set null only when the user supplied no backend selector."),
      repository: tool.schema.string().optional(),
      resourceUrl: tool.schema.string().optional(),
    })).optional().describe("Complete replacement scope on resolve, never a positional work-item/change pairing"),
    unresolved: tool.schema.array(tool.schema.string()).optional().describe("Unidentified or ambiguous requested references; do not silently omit them"),
    digest: tool.schema.string().optional().describe("Exact digest shown to and explicitly confirmed by the user for this revision"),
  },
  async execute(args, context) {
    const references = args.references?.map(({ backendId, ...reference }) => backendId === null ? reference : { ...reference, backendId })
    return JSON.stringify(await reviewWorkflow(context.directory, context.sessionID, { ...args, references } as Action))
  },
})
