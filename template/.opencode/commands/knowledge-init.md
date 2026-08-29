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

- invoke `repository_inventory` before any repository-local source inspection;
- retain the complete canonical repository inventory as authoritative workspace
  context;
- do not assume that every repository belongs to the detailed analysis scope;
- ask the user how to continue by using the built-in `question` tool when it is
  available to the current OpenCode runtime/client;
- first offer these mutually exclusive modes:
  - `Select repositories`;
  - `Initialize all`;
  - `Inventory only`;
- when `Select repositories` is chosen, ask a second question with
  `multiple: true` and one option per canonical repository identifier returned
  by `repository_inventory`;
- use exact canonical repository identifiers as option labels so the selected
  values can be validated directly against the authoritative inventory;
- if `Initialize all` is chosen, place every canonical repository in
  `analysis_scope` and continue with normal full-workspace initialization;
- if `Inventory only` is chosen, report the canonical repository identifiers
  and stop without repository-local source inspection or knowledge-base writes;
- if the user supplies a custom answer instead of one of the mode options,
  accept it as a repository selection only when every supplied identifier
  resolves exactly and unambiguously against the canonical inventory;
- if the `question` tool is unavailable, unsupported by the active client, or
  fails before a selection is obtained, do not retry it repeatedly and do not
  start detailed analysis. Instead, list the canonical repository identifiers,
  show an immediately executable scoped `/knowledge-init ...` example, mention
  that rerunning `/knowledge-init` can be used to choose the full workspace in
  an interactive-capable client, and stop.

The no-argument pre-selection phase is discovery-only. Before the user has
chosen the detailed scope, do not `read`, `glob`, `grep` or otherwise inspect
`repositories/<repo>/**`, and do not create repository-local knowledge. The
only repository information used during this phase must come from
`repository_inventory`.

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

Repository scope changes analysis breadth, not analysis depth. For every
repository in `analysis_scope`, perform the same selective repository-analysis
phases that full-workspace `knowledge-init` would normally perform. Do not stop
at inventory or README evidence when manifests, configuration, representative
implementation files or tests are needed to substantiate responsibilities,
execution flows, data flows or business rules.

### Scoped read barrier

When a repository scope is provided, treat it as a hard boundary for content
inspection, not merely as a reporting preference.

After `repository_inventory` resolves the canonical repositories, derive and
retain two explicit sets for the remainder of the command:

- `analysis_scope`: selected canonical repositories;
- `outside_scope`: every other canonical repository in the authoritative
  inventory.

Repository-content tools (`read`, `glob`, `grep` and equivalent source
inspection) may target `repositories/<repo>/**` only when `<repo>` belongs to
`analysis_scope`.

For repositories in `outside_scope`:

- do not read README files, manifests, configuration, source code or tests;
- do not grep or glob inside their directories;
- do not create or deepen repository-local knowledge from their content;
- do not follow a discovered relationship into their checkout to confirm or
  enrich that relationship;
- use only inventory/Git identity already returned by `repository_inventory`,
  evidence found in `analysis_scope`, relevant workspace-level sources, and
  previously validated knowledge.

This restriction also applies to nested duplicate/submodule checkouts. If an
in-scope orchestrator contains a nested checkout that represents an
out-of-scope canonical repository, inspect orchestration metadata such as the
orchestrator's `.gitmodules` or deployment configuration, but do not inspect the
nested repository's own files.

Before every repository-content read/search, verify that the target path belongs
to `analysis_scope`. A cross-scope reference is never permission to cross this
barrier.

## Completion policy

This command performs a complete initialization of the resolved repository
scope. With explicit repository arguments, that scope is supplied directly by
the user. Without arguments, detailed scope is resolved only after repository
inventory and the repository-selection decision described above.

The repository inventory and overview creation are only the first phase of the
task. They do not constitute completion.

Continue autonomously through all workflow phases unless:

- an actual tool or permission error prevents further analysis;
- required evidence does not exist in the workspace;
- the execution-step budget is exhausted.

Reading repository manifests, configuration, source code and tests under the
workspace is already authorized and does not require additional user
confirmation.

After the initial no-argument repository-selection decision has resolved
`analysis_scope`, do not ask the user which repository or analysis phase should
be processed next.

Choose the next repository and next analysis phase automatically.

Do not stop merely because deeper repository inspection is required.

When a phase cannot produce meaningful knowledge, record that outcome and
continue with the next repository or phase. A phase is considered assessed when
its result is `insufficient evidence`; it does not need to produce a knowledge
document to count as completed.

### Evidence-limited initialization

Repository inventory, repository names, primary manifest metadata and generic
framework or domain conventions are not sufficient behavioural evidence.

When repository-content inspection is blocked, unavailable or insufficient:

- do not compensate by inventing expected execution flows, business rules,
  authorization semantics, lifecycle/state transitions, persistence guarantees
  or runtime integrations;
- preserve any existing validated knowledge instead of replacing, weakening or
  diluting it with lower-confidence inference;
- record the affected phase as `insufficient evidence` and state the concrete
  blocker or missing evidence in the command report;
- use `partially analysed` coverage for an in-scope repository when detailed
  analysis started but could not be completed, unless a stronger validated
  coverage state already exists;
- do not create `execution-flows.md`, `business-rules.md` or another behavioural
  knowledge document merely to represent the failed phase.

Structural inference is allowed only when directly supported by observable
structure. For example, project directories may support a statement that a
repository appears layered, but they do not establish business behaviour or a
runtime request path.

Workspace reconciliation must inherit repository-local uncertainty. Do not turn
repository names such as `Frontend`, `Authenticator` and `Service`, inventory
metadata, or unsupported implementation candidates into a confirmed
cross-repository flow.

### Evidence acquisition gate

Treat discovery and inspection as different operations.

- `repository_inventory`, directory listings and `glob` establish that a
  repository or path exists; they do not establish the contents or behaviour of
  a discovered file.
- A path returned by `glob` is `discovered`, not `inspected`.
- A file contributes behavioural evidence only when its relevant contents were
  actually observed in the current run through `read`, a focused `grep` whose
  returned match contains the supporting content, or equivalent permitted
  content inspection. Existing validated knowledge may also be reused as
  evidence, subject to normal conflict checks.
- A manifest or README contributes only the facts actually stated by that
  artifact. Do not silently upgrade documentation evidence into source-code,
  test, configuration or runtime evidence.
- Never report a controller, service, test, configuration file, deployment file
  or implementation as `inspected` merely because its path was discovered.

Before persisting any repository-local or workspace-level behavioural artifact,
perform an evidence checkpoint:

1. enumerate the material behavioural claims that would be written;
2. identify the concrete inspected evidence supporting each claim;
3. remove or mark unresolved every claim whose support is only discovery,
   naming, manifest metadata, generic conventions or an uninspected path;
4. if no stable reusable behavioural claims remain for that document, do not
   create the document;
5. propagate the same evidence ceiling into workspace reconciliation. A
   workspace flow, data flow or business rule cannot have stronger evidence than
   the repository-local transitions on which it depends.

This checkpoint applies especially before creating `execution-flows.md`,
`data-flows.md` or `business-rules.md` at repository or workspace level.

### Run evidence ledger and reconciliation

Maintain a run-local evidence ledger while initialization is executing. The
ledger is conceptual working state and does not need to be persisted as a new
knowledge document. It must distinguish, at minimum:

- repository/inventory facts returned by `repository_inventory`;
- paths discovered by `glob` or directory enumeration;
- focused content fragments observed through `grep`;
- files whose contents were observed through `read` or an equivalent content
  inspection;
- preserved validated knowledge reused from a previous run.

A `grep` match authorizes only claims supported by the returned matching
content. It does not mean that the entire matching file, test suite, source
package or configuration set was inspected. A `read` authorizes claims only
from the content actually returned by that read.

Before `knowledge_coverage`, before creating any workspace-level artifact, and
again before the final response, reconcile every evidence statement against the
run-local ledger:

1. remove statements that claim inspection of an artifact or evidence category
   absent from the ledger;
2. replace aggregate wording such as `representative sources inspected`, `tests
   inspected`, `configuration inspected` or `deployment evidence inspected`
   with the exact observed artifacts or with narrower wording such as `matching
   test content observed via grep` when that is what actually occurred;
3. ensure coverage notes name only evidence actually acquired in the run or
   explicitly preserved validated knowledge;
4. ensure a repository is not promoted to `analysed` when material analysis
   surfaces required for its generated knowledge remain merely discovered or
   unresolved; use `partially analysed` for the new run unless a stronger
   validated state already exists;
5. ensure workspace-level findings and architecture claims cite evidence whose
   contents were actually inspected. A discovered `docker-compose.yml`, gateway
   config, deployment manifest or source path is not deployment/runtime evidence;
6. if reconciliation removes the material support for a newly created artifact,
   do not keep that artifact merely because it was already drafted in the run.
   Omit it, or preserve an older validated version unchanged when one exists.

The final report must be a projection of this reconciled ledger, not a narrative
reconstruction of intended analysis steps. Never claim that a file or category
was inspected because the workflow intended to inspect it.

## Workflow

1. invoke `repository_inventory`;
2. when repository arguments are present, resolve and validate them without any
   selection interaction;
3. when repository arguments are absent, resolve the detailed scope through the
   repository-selection flow above, or stop after inventory for `Inventory only`
   or textual fallback;
4. only after `analysis_scope` is resolved, read existing knowledge before
   writing so valid knowledge from earlier slices is preserved;
5. create or update repository overview documents for repositories in the
   detailed analysis scope;
6. document orchestrator and submodule relationships supported by evidence,
   without treating out-of-scope repositories as fully analysed;
7. identify repository roles and primary components for repositories in scope;
8. identify compile-time, runtime and deployment relationships supported by the
   selected repositories;
9. analyse each repository in scope for:
   - principal execution flows;
   - principal data flows;
   - business and domain rules;
10. persist repository-local knowledge before moving to the next repository;
11. perform cross-repository reconciliation limited to relationships supported by
    the current scope plus existing validated knowledge, without reading
    `outside_scope` repository content;
12. identify or refine workspace-level execution flows only after applying the
    evidence acquisition gate, using only in-scope inspected evidence,
    permitted workspace-level sources and existing validated knowledge;
13. identify or refine workspace-level data flows only when their material
    transitions are supported by inspected evidence;
14. identify or refine workspace-level business rules only when concrete
    inspected evidence supports the rule; do not create a workspace behavioural
    artifact solely because the corresponding phase was assessed;
15. analyse architecture and architectural patterns only to the extent justified
    by content-inspected workspace evidence; apply the same evidence ledger and
    reconciliation gate before creating or extending `architecture.md`;
16. reconcile the run-local evidence ledger against repository artifacts,
    workspace artifacts, proposed coverage states and coverage notes;
17. invoke `knowledge_coverage` to merge canonical repository coverage, then validate Markdown links;
18. reconcile the final response against the same ledger before reporting what
    was inspected or verified.

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
9. when a claim remains inferred but can reasonably be confirmed by selective
   inspection of files inside the current in-scope repository, inspect those
   files before persisting the claim;
10. do not create inferred execution-flow or business-rule documents merely to
    avoid deeper in-scope inspection;
11. persist the repository knowledge before moving to the next repository;
12. mark the repository as:

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

Maintain repository coverage in `knowledge-base/workspace/overview.md` through
`knowledge_coverage`. Do not create or update coverage rows manually.

Coverage states are:

- `analysed`: detailed analysis completed in this or a previous initialization;
- `partially analysed`: detailed analysis started but incomplete or blocked;
- `referenced, not analysed`: known through a supported relationship but not
  deeply inspected;
- `not analysed`: present in the authoritative inventory but not yet deeply
  inspected.

`analysed` requires evidence that the repository's material responsibilities and
relevant behavioural surfaces were actually inspected, not merely discovered.
README/manifest inspection plus a repository-wide `glob` is not sufficient by
itself when source or configuration inspection is needed to substantiate the
repository's behavioural knowledge. If the run stops at documentation,
manifests or structural discovery while material implementation behaviour
remains unverified, use `partially analysed` unless a stronger validated state
already exists.

Coverage notes must describe only evidence actually acquired. Do not write
notes such as `controller inspected`, `tests inspected`, `configuration
inspected`, `representative sources inspected` or equivalent unless the exact
supporting artifacts were content-inspected in the run (or are explicitly
identified as preserved validated knowledge). Prefer exact paths or exact
artifact classes actually observed over broad evidence-category summaries. If a
focused `grep` returned matching test content but no test file was read, describe
that narrowly; do not say that tests were inspected.

For `analysed` and `partially analysed`, retain traceability to repository-local
knowledge and source evidence. A repository must never become `analysed` merely
because another repository references it.

After repository-local analysis and cross-repository reconciliation:

1. invoke `knowledge_coverage` once with the current slice's evidence-backed
   coverage updates;
2. include selected repositories as `analysed` or `partially analysed` according
   to the work actually completed;
3. include out-of-scope repositories as `referenced, not analysed` only when the
   current in-scope evidence establishes a relationship and no stronger state is
   already known;
4. do not send `not analysed` updates merely because a repository is outside the
   current slice; the tool derives the authoritative canonical repository set and
   preserves stronger previous states;
5. pass repository-local knowledge paths and concise evidence notes when useful;
6. rely on the tool's monotonic merge and canonical deduplication; never append,
   edit or patch the Markdown coverage table yourself;
7. read `knowledge-base/workspace/overview.md` after the tool call and verify that
   the persisted table agrees with the tool result.

`knowledge_coverage` owns the exact ATX `## Repository coverage` section. It
collapses stale duplicate rows, preserves the strongest valid prior state, adds
new canonical repositories as `not analysed`, and replaces the complete section
deterministically. If its validation fails, treat that as a tool blocker rather
than attempting a manual coverage repair.

Workspace overview prose represents cumulative current state, not execution
history. Do not accumulate `Scope of this run` lines or other stale run-specific
claims. Report the current requested scope only in the command's final response.

State progression is monotonic unless evidence invalidates previously stored
knowledge:

`not analysed` -> `referenced, not analysed` -> `partially analysed` ->
`analysed`.

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
- `knowledge_coverage` has merged repository states successfully and its
  persisted `## Repository coverage` section contains one canonical current-state
  entry per logical repository with no contradictory stale states;
- after the coverage tool call, `knowledge-base/workspace/overview.md` has been
  read back and checked against the tool result;
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