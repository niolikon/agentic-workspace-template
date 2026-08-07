---
description: Initialize the structured workspace knowledge base
agent: knowledge
subtask: false
---

Initialize the workspace knowledge base from:

- `repositories/`;
- `documents/`;
- `trainings/`;
- `notes/`.

Load the following skills before starting:

- `knowledge-generation`
- `workspace-reading`
- `safe-file-writing`
- `repository-analysis`
- `execution-flow-analysis`
- `business-rule-analysis`

Load `architecture-analysis` immediately before the architecture phase, when
repository and relationship evidence is sufficient.

Architecture analysis is the final analytical phase.

Do not perform architecture analysis before repository-local analysis and
cross-repository reconciliation have completed.

## Completion policy

This command performs a complete workspace knowledge-base initialization.

The repository inventory and overview creation are only the first phase of the
task. They do not constitute completion.

Continue autonomously through all workflow phases unless:

- an actual tool or permission error prevents further analysis;
- required evidence does not exist in the workspace;
- the execution-step budget is exhausted.

Reading repository manifests, configuration, source code and tests under the
workspace is already authorized and does not require additional user
confirmation.

Do not ask the user which repository or analysis phase should be processed
next.

Choose the next repository and next analysis phase automatically.

Do not stop merely because deeper repository inspection is required.

When a phase cannot produce meaningful knowledge, record that outcome and
continue with the next repository or phase.

## Workflow

1. invoke `repository_inventory`;
2. create and persist repository overview documents;
3. document orchestrator and submodule relationships returned by
   `repository_inventory`;
4. identify repository roles and primary components;
5. identify compile-time, runtime and deployment relationships;
6. analyse each repository for:
   - principal execution flows;
   - principal data flows;
   - business and domain rules;
7. persist repository-local knowledge before moving to the next repository;
8. perform cross-repository reconciliation;
9. identify workspace-level execution flows;
10. identify workspace-level data flows;
11. identify workspace-level business rules when supported;
12. analyse architecture and architectural patterns;
13. validate knowledge coverage and Markdown links.

Do not limit knowledge generation to repositories declared as submodules.

Repositories not referenced by an orchestrator must still receive their own
repository-specific knowledge.

Do not classify an unreferenced repository as irrelevant, secondary or outside
the workspace.

Run cross-repository reconciliation after repository-local execution and data
flow analysis has completed.

This phase is part of a complete workspace initialization and does not require
additional user confirmation.

## Logical repository deduplication

When the same logical repository appears at multiple workspace paths:

- correlate copies using remote URL and Git identity;
- create only one canonical repository knowledge directory;
- list all known checkout paths in its `overview.md`;
- identify which checkout is referenced by the orchestrator;
- do not generate duplicate knowledge directories from directory names alone.

Do not create every possible document.
Do not generate the complete knowledge base in one large patch.

## Repository analysis phase

Process every canonical non-orchestrator repository one at a time.

For each repository:

1. inspect its README and primary manifests;
2. inspect relevant configuration;
3. identify application or library entry points;
4. identify primary components and responsibilities;
5. identify compile-time dependencies;
6. analyse principal execution flows when meaningful;
7. analyse principal data flows when meaningful;
8. use `business-rule-analysis` to identify evidence-backed business rules;
9. persist the repository knowledge before moving to the next repository;
10. mark the repository as:

- analysed;
- partially analysed;
- no meaningful flow/rules found;
- blocked.

Do not analyse multiple repositories in parallel.

Complete the current repository before starting the next one.

Analyse orchestrator repositories separately for orchestration,
composition, deployment and configuration responsibilities.

Do not repeat the source-level analysis of repositories already represented
by their submodule or canonical checkouts.

Do not proceed to cross-repository reconciliation until every canonical
non-orchestrator repository has one of the states above and every
orchestrator repository has been assessed for its orchestration
responsibilities.

## Final report

Keep the final response concise.

Report:

- repositories covered;
- repositories not fully analysed;
- knowledge files created or updated;
- major workspace-level findings;
- unresolved blockers;
- phases that could not be completed.

## Completion criteria

The initialization is complete only when:

- every canonical repository has an overview;
- every canonical non-orchestrator repository has been inspected beyond
  inventory-level metadata;
- every orchestrator repository has been assessed for orchestration,
  composition, deployment and configuration responsibilities;
- repository roles and principal components have been assessed;
- compile-time relationships have been assessed;
- repository-local execution flows have been assessed;
- repository-local data flows have been assessed;
- repository-local business rules have been assessed;
- cross-repository reconciliation has been performed;
- workspace-level execution and data flows have been assessed;
- workspace-level business rules have been assessed when supported;
- architectural analysis has been attempted when sufficient evidence exists;
- generated knowledge has been validated for duplication and broken links.

"Assessed" does not mean that a document must always be created.

If no meaningful information exists for a category, record that outcome and
continue.

Do not finish the command after inventory or overview generation alone.

A command is not complete merely because every planned phase has been
attempted.

It is complete only when every repository and every applicable
workspace-level analysis has either:

- produced knowledge;
- been explicitly marked as not applicable;
- been blocked by documented evidence or tool limitations.