---
description: Incrementally update the workspace knowledge base
agent: knowledge
subtask: false
---

Update the knowledge base for:

$ARGUMENTS

Load:

- `knowledge-generation`;
- `workspace-reading`;
- `safe-file-writing`.

Load `repository-analysis`, `execution-flow-analysis` or
`architecture-analysis` only when required by the requested topic.

## Scope classification

Determine whether the requested update affects:

- one repository;
- an orchestrator repository;
- one or more submodule pins;
- a compile-time relationship;
- a runtime integration;
- a deployment relationship;
- a repository-local execution or data flow;
- a cross-repository execution or data flow;
- workspace-level orchestration knowledge.

## Workflow

1. identify the smallest relevant source set;
2. identify existing knowledge documents affected by the topic;
3. prepare missing parent directories under `knowledge-base/`;
4. update the most directly affected document first;
5. create a new document only when no suitable document exists and sufficient
   evidence supports a stable reusable topic;
6. update workspace-level documents only when a cross-repository impact is
   supported by evidence;
7. preserve validated content and prefer localized edits;
8. verify Markdown structure, relative links and duplicate coverage.

## Submodule changes

When `.gitmodules` or a submodule commit changes:

1. update the orchestrator repository's `submodules.md`;
2. update `knowledge-base/workspace/orchestration.md` when the workspace-level
   view is affected;
3. update repository identity or alternate-checkout information when needed;
4. do not update runtime execution flows unless separate runtime evidence has
   changed.

Never regenerate the entire knowledge base for a focused update.
Do not inspect unrelated repositories.

## Final report

Keep the final report concise. Summarize:

- identified scope;
- repositories involved;
- files created or updated;
- orchestration or relationship changes;
- execution or data flows affected;
- conflicts and unresolved questions;
- skipped work and reasons.
