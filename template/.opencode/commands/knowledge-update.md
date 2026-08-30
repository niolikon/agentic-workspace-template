---
description: Incrementally update the workspace knowledge base
agent: knowledge
subtask: false
---

Update the knowledge base for:

$ARGUMENTS

This command is for a focused update caused by a known change, topic or
investigation. It is not the continuation mechanism for incomplete repository
initialization. To complete or revisit detailed initialization of a repository,
use `/knowledge-init <repository...>` instead.

Load:

- `knowledge-generation`;
- `workspace-reading`;
- `safe-file-writing`.

Load `repository-analysis`, `execution-flow-analysis` or
`architecture-analysis` only when required by the requested topic.

Load `business-rule-analysis` when the requested topic affects:

- application behaviour;
- domain logic;
- validation;
- state transitions;
- lifecycle rules;
- authorization decisions;
- idempotency;
- retries or compensation;
- atomicity;
- other business constraints.

After repository-local updates, run cross-repository reconciliation when the
changed knowledge affects:

- outbound interactions;
- inbound interfaces;
- cross-repository execution flows;
- cross-repository data flows;
- workspace-level business rules.

Update only the affected workspace documents and related repositories.

When the requested update affects repository inventory, repository identity,
orchestration, submodules, duplicate checkouts or cross-repository
relationships, load `repository-analysis` and invoke `repository_inventory`
before inspecting repository files.

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

When the updated scope affects repository boundaries, runtime integrations or
data exchanged between repositories, run cross-repository reconciliation for
the affected repositories and update the corresponding workspace-level flow
documents.

Do not reanalyze unrelated repositories.

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

Keep the final response concise. 

Report:

- affected scope;
- knowledge files created or updated;
- major findings introduced by the update;
- unresolved blockers;
- incomplete update work.