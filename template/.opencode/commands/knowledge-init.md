---
description: Initialize the structured workspace knowledge base
agent: knowledge
subtask: false
---

Optional repository scope supplied by the user:

$ARGUMENTS

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

## Repository scope

Treat `$ARGUMENTS` as an optional whitespace-separated list of repository
identifiers. Each identifier must name a directory immediately under
`repositories/`.

Always invoke `repository_inventory` for the workspace-wide authoritative
repository set before detailed repository inspection. Use that inventory to
validate the requested scope and to retain awareness of repositories outside
the current slice.

When `$ARGUMENTS` is empty:

- preserve the existing full-workspace initialization behavior;
- every canonical repository is in the detailed analysis scope.

When `$ARGUMENTS` contains repositories:

- resolve each identifier against an immediate child directory of
  `repositories/`;
- reject unknown, ambiguous or non-immediate-child identifiers and report them
  without silently substituting another repository;
- perform detailed repository analysis only for canonical repositories that
  correspond to the selected directories;
- do not deeply inspect an unselected repository merely because it is mentioned
  by selected-repository evidence;
- allow workspace-level `documents/`, `trainings/` and `notes/` to be inspected
  selectively when relevant to the selected repositories;
- preserve valid knowledge from previous initialization slices.

Repository slices are execution scopes, not separate knowledge bases. All
knowledge continues to be created or updated under `knowledge-base/`.

A cross-scope relationship may be recorded when evidence from the selected
repositories or relevant workspace-level sources supports it. Record the
external repository as referenced but not analysed unless it was already
analysed by a previous initialization. Do not expand the current detailed
analysis scope automatically.

## Completion policy

This command performs a complete initialization of the requested repository
scope. Without arguments, that scope is the complete workspace.

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
2. resolve and validate the optional repository scope;
3. read existing knowledge before writing so valid knowledge from earlier slices
   is preserved;
4. create or update repository overview documents for repositories in the
   detailed analysis scope;
5. document orchestrator and submodule relationships supported by evidence,
   without treating out-of-scope repositories as fully analysed;
6. identify repository roles and primary components for repositories in scope;
7. identify compile-time, runtime and deployment relationships supported by the
   selected repositories;
8. analyse each repository in scope for:
   - principal execution flows;
   - principal data flows;
   - business and domain rules;
9. persist repository-local knowledge before moving to the next repository;
10. perform cross-repository reconciliation limited to relationships supported by
    the current scope plus existing validated knowledge;
11. identify or refine workspace-level execution flows when supported;
12. identify or refine workspace-level data flows when supported;
13. identify or refine workspace-level business rules when supported;
14. analyse architecture and architectural patterns only to the extent justified
    by accumulated workspace evidence;
15. update repository coverage and validate Markdown links.

Do not limit knowledge generation to repositories declared as submodules.

During full-workspace initialization, repositories not referenced by an
orchestrator must still receive their own repository-specific knowledge. During
scoped initialization, this applies only to repositories in the requested
detailed analysis scope.

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

Process every canonical non-orchestrator repository in the detailed analysis scope one at a time.

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
non-orchestrator repository in the detailed analysis scope has one of the states
above and every in-scope orchestrator repository has been assessed for its
orchestration responsibilities.

Do not create repository-local overview or analysis documents for an
out-of-scope repository solely to represent a discovered reference. Represent
such relationships in workspace knowledge and coverage instead.

## Coverage awareness

Maintain a concise repository coverage view in existing workspace knowledge,
preferably `knowledge-base/workspace/overview.md` unless another existing
workspace document already owns that responsibility. Avoid creating a new
hierarchy solely for coverage.

Coverage must distinguish at least:

- `analysed`: detailed analysis completed in this or a previous initialization;
- `partially analysed`: detailed analysis started but incomplete or blocked;
- `referenced, not analysed`: known through a supported relationship but not
  deeply inspected;
- `not analysed`: present in the authoritative inventory but not yet deeply
  inspected.

For `analysed` and `partially analysed`, retain traceability to repository-local
knowledge and its source evidence. A repository must never become `analysed`
merely because another repository references it. Preserve stronger coverage
from previous runs; a later reference must not downgrade an already analysed
repository.

## Final report

Keep the final response concise.

Report:

- repositories covered in the requested scope;
- workspace repository coverage, including repositories not fully analysed;
- knowledge files created or updated;
- major workspace-level findings;
- unresolved blockers;
- phases that could not be completed.

## Completion criteria

The initialization of the requested scope is complete only when:

- every canonical repository in the detailed analysis scope has an overview;
- every canonical non-orchestrator repository in the detailed analysis scope has
  been inspected beyond inventory-level metadata;
- every orchestrator repository in the detailed analysis scope has been assessed
  for orchestration, composition, deployment and configuration responsibilities;
- repository roles and principal components have been assessed;
- compile-time relationships have been assessed;
- repository-local execution flows have been assessed;
- repository-local data flows have been assessed;
- repository-local business rules have been assessed;
- cross-repository reconciliation has been performed;
- workspace-level execution and data flows have been assessed;
- workspace-level business rules have been assessed when supported;
- architectural analysis has been attempted when sufficient evidence exists;
- generated knowledge has been validated for duplication and broken links;
- repository coverage reflects the authoritative workspace inventory and does
  not overstate analysis of out-of-scope repositories.

"Assessed" does not mean that a document must always be created.

If no meaningful information exists for a category, record that outcome and
continue.

Do not finish the command after inventory or overview generation alone.

A command is not complete merely because every planned phase has been
attempted.

It is complete only when every repository in the requested detailed analysis
scope and every applicable workspace-level analysis has either:

- produced knowledge;
- been explicitly marked as not applicable;
- been blocked by documented evidence or tool limitations.