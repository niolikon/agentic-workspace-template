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

`knowledge-generation` is mandatory for this command. Do not treat its load
as optional or infer that its rules are available from the agent definition.
Before any create/edit/replace of persistent knowledge, ensure the skill was
loaded in the current run and apply its claim-strength gate to both new claims
and existing claims being preserved, revised or propagated. If it was not
loaded, load it before writing.

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

### Resumable scoped initialization

Treat an explicit repository selection as a request to initialize **or continue**
detailed initialization for that repository. A selected repository is never
considered complete merely because repository-local knowledge artifacts already
exist or because coverage from an earlier run is non-empty.

Before analysing each selected repository:

1. read its existing repository knowledge and relevant workspace knowledge;
2. read its persisted repository coverage state from the workspace overview;
3. preserve validated evidence-backed content as cumulative current state;
4. identify gaps, blockers or stale claims that the current run can resolve;
5. perform the normal initialization-depth inspection for the selected
   repository, even when an `overview.md` already exists;
6. reconcile newly supported knowledge with the existing artifacts; when a
   structured repository artifact is materially refreshed, regenerate its
   complete canonical content from the observed prior artifact plus the current
   run-local ledger instead of incrementally patching run-relative sections.

Coverage is workflow state, not a skip condition. In particular, `not analysed`,
`referenced, not analysed`, `blocked` and `partially analysed` indicate that
additional
detailed initialization may still be useful. An explicit selection of an
`analysed` repository also remains actionable: inspect it to normal initialization
depth as required by the user request, preserve unchanged validated knowledge and
refine it only when stronger current evidence supports the change.

A limitation from an earlier run does not constrain a later continuation run. If
source inspection, permissions or execution budget previously prevented detailed
analysis, retry the normally required evidence surfaces when they are available
now, including README/manifests, configuration, entry points, representative
implementation, tests where useful, execution/data flows and evidence-backed
business rules.

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
- use `blocked` coverage when detailed repository inspection could not start
  because of a concrete tool, permission or source-access blocker; use
  `partially analysed` when detailed analysis started but could not be completed,
  unless a stronger validated coverage state already exists;
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
knowledge document. Build it from completed tool results, not from the analysis
plan or from repository expectations.

Record evidence immediately after each successful acquisition and retain the
exact repository/path plus the acquisition event that actually occurred. The
ledger must distinguish, at minimum:

- repository/inventory facts returned by `repository_inventory`;
- exact paths discovered by `glob` or directory enumeration;
- exact files/fragments whose matching content was returned by focused `grep`;
- exact files whose contents were returned by `read` or an equivalent content
  inspection;
- preserved validated knowledge reused from a previous run, but only after the
  existing knowledge artifact itself has been content-read in the current run.

`existing validated knowledge` is not implicit workspace memory. Before an
existing artifact can contribute evidence, confidence or claims to the current
run, read that artifact and record the read as the acquisition event establishing
its reusable validated-knowledge basis. Merely knowing that the file exists,
patching it, seeing it in persisted coverage, or remembering assertions from a
prior run does not establish `existing validated knowledge`. If the artifact
cannot be read, preserve it unchanged when safe to do so but do not use its
contents as evidence for new or rewritten claims.

When refreshing an existing knowledge artifact, distinguish persistent validated
knowledge from run-relative diagnostics. Persistent facts and claims that remain
supported may be preserved. Run-relative material must be regenerated from the
current run-local ledger and current analysis state rather than copied forward.
Treat as run-relative, at minimum:

- sections labelled `Evidence acquired during this run`, `this run`, `current
  run`, or equivalent;
- statements that a source/category was or was not read, inspected, discovered
  or matched in a particular run;
- current-run evidence ledgers, acquisition summaries and provenance lists;
- limitations or `insufficient evidence` rationales whose reason is that a
  source/category was not inspected in that run;
- current-run confidence rationales and `next steps` that exist only because a
  particular source was not inspected.

Before writing the refreshed artifact, remove or replace stale run-relative
material that conflicts with the current ledger. New acquisitions may invalidate
old diagnostics even when the underlying persistent facts remain valid. For
example, after reading `AuthController.java` and `application.yml` in the current
run, an existing overview must not retain statements such as `no source files
were read`, `HTTP endpoints are insufficient evidence because source was not
inspected`, or `runtime configuration was not inspected`. An embedded
`Evidence acquired during this run` section must be rebuilt from all relevant
current-run ledger entries, not incrementally patched from the previous run.

For structured knowledge artifacts such as repository `overview.md`, a material
refresh of an existing artifact is a **tool-enforced canonical replacement**.
Do not use generic `write` or `edit`/patch for this operation. Use the dedicated
`knowledge_artifact_refresh` tool so that inspection ordering, stale-revision
protection, whole-file replacement and persisted-content verification are
mechanically enforced.

The required sequence is:

1. invoke `knowledge_artifact_refresh` with `action: inspect` for the complete
   existing artifact before any modification and before using its assertions as
   validated input. Treat the returned content as the content-inspection event
   that establishes `existing validated knowledge`, and retain the returned
   `revision` token;
2. snapshot only persistent validated facts and their prior provenance. Text in
   the old artifact that says `read`, `discovered`, `inventory`, `this run`,
   `not inspected`, or equivalent remains prior-run provenance and must never be
   copied into the current run-local ledger;
3. acquire current-run repository evidence and populate the run-local ledger only
   from completed acquisition results in the current trace;
4. reconcile persistent facts with that ledger and recompute all run-relative
   evidence, limitations, confidence and unresolved items;
5. render the complete desired canonical artifact in memory;
6. invoke `knowledge_artifact_refresh` with `action: replace`, the complete
   replacement content and the exact `expectedRevision` returned by step 1.
   Generic `write`, `edit`, patch, diff-style replacement, append-only merge and
   repeated localized edits are forbidden for this refresh;
7. require the tool result to report successful exact-content verification. The
   tool performs the persisted readback and rejects stale revision tokens or
   invalid duplicate Markdown headings in repository `overview.md` files.

If the dedicated tool is unavailable, denied, rejects the revision, or reports a
verification failure, report the refresh as blocked and preserve/re-read the
current artifact before deciding whether a new attempt is safe. Do not silently
fall back to generic `write` or patching. A generic `Read` performed only after a
mutation does not satisfy this protocol. `inspect -> reconcile -> replace`
applies only to the individual artifact being refreshed; it does not authorize
rewriting unrelated knowledge artifacts or regenerating the whole knowledge
base.

The final response must describe the operations that are actually visible in the
tool trace. Do not claim `read before update`, `fully rewritten`, inventory
discovery, or a current-run source read unless the corresponding current-run
tool event occurred in that order.

Do not pre-populate the ledger with files the workflow intends to inspect, common
framework files, paths mentioned by another document, paths represented in
generated knowledge, or sources that would normally be expected in the
repository. A source enters the ledger only after the corresponding acquisition
result has actually been observed.

Track acquisition events independently. If `glob` discovers `application.yml`
and no later content operation observes it, its state is only `discovered`. If a
focused `grep` later returns matching content from that file, add `matched via
grep`; this still does not imply a complete-file read. If `read` later returns
the file content, add `read`. Never synthesize `read`, `inspected` or `observed`
from an earlier discovery event.

A `grep` match authorizes only claims supported by the returned matching
content. It does not mean that the entire matching file, test suite, source
package or configuration set was inspected. A `read` authorizes claims only
from the content actually returned by that read.

Before `knowledge_coverage`, before creating any workspace-level artifact, and
again before the final response, reconcile every evidence statement against the
run-local ledger. Reconciliation is subtractive: it may remove, narrow or
relabel reported evidence, but it must never add a source merely because that
source would make the explanation more complete.

1. remove statements that claim inspection of an artifact or evidence category
   absent from the ledger;
2. replace aggregate wording such as `representative sources inspected`, `tests
   inspected`, `configuration inspected` or `deployment evidence inspected`
   with the exact observed artifacts or with narrower wording such as `matching
   test content observed via grep` when that is what actually occurred;
3. ensure coverage notes name only evidence actually acquired in the run or
   explicitly preserved validated knowledge. Do not append broad evidence labels
   such as `unit tests`, `tests`, `source files` or `configuration` after naming a
   read file unless those additional artifacts were themselves content-inspected.
   If grep returned a relevant match from a test, say `matching test content
   observed via grep` (optionally naming the matched file when known), not simply
   `unit tests` or `tests`;
4. ensure a repository is not promoted to `analysed` when material analysis
   surfaces required for its generated knowledge remain merely discovered or
   unresolved; use `partially analysed` for the new run unless a stronger
   validated state already exists;
5. ensure workspace-level findings and architecture claims cite evidence whose
   contents were actually inspected. A discovered `docker-compose.yml`, gateway
   config, deployment manifest or source path is not deployment/runtime evidence;
6. if reconciliation removes the material support for a newly created artifact,
   do not keep that artifact merely because it was already drafted in the run.
   Omit it, or preserve an older validated version unchanged when one exists;
7. construct each `knowledge_coverage` note from the reconciled ledger for that
   repository. Name exact read sources when useful, describe grep-only evidence
   as `matching content observed via grep`, and keep preserved validated
   knowledge explicitly separate from evidence newly acquired in this run. The
   `knowledgeArtifact` field is not an evidence-description field: when supplied,
   it must be the path of an actual knowledge Markdown artifact under
   `knowledge-base/` (for example
   `knowledge-base/repositories/RepositoryA/overview.md` or the equivalent
   knowledge-base-relative `repositories/RepositoryA/overview.md`). Put phrases
   such as `pom.xml read` or `existing validated overview preserved` in `notes`,
   never in `knowledgeArtifact`;
8. before writing or updating any knowledge artifact, derive every `Evidence`,
   `Sources`, provenance or confidence-support statement in that artifact from
   the same reconciled ledger. Generated artifact prose must not create its own
   evidence inventory. In particular, never claim that a README, manifest,
   nested checkout, source file or configuration file was read merely because it
   exists, was discovered, is conventional for the repository, or is mentioned
   by another read source. If an artifact needs to cite a source whose current-run
   acquisition is absent from the ledger, omit that source or label it only as
   `existing validated knowledge` when that status is actually established.
   When updating an existing artifact, preserve persistent validated claims but
   replace its run-relative diagnostics with a fresh projection of the current
   ledger. Do not leave stale `this run` evidence lists, absence-of-inspection
   statements, unresolved questions, confidence rationales or next steps whose
   stated evidence gap has been closed by current-run reads;
9. if the final response exposes an evidence/provenance ledger, render only
   ledger-backed source entries and use explicit acquisition labels:
   `discovered`, `matched via grep`, `read`, or `existing validated knowledge`.
   Do not use ambiguous slash labels such as `read/discovered`. If more than one
   event actually occurred for the same source, report the events explicitly
   (for example `discovered; read`) or report separate event entries.

The final report must be a projection of this reconciled ledger, not a narrative
reconstruction of intended analysis steps. This applies both to explicit
provenance sections and to ordinary summary prose such as `README/manifests
inspected`, `configuration reviewed`, `representative sources inspected` or
similar descriptions of work performed. Never claim that a file or category was
inspected because the workflow intended to inspect it. In particular, do not add
`README.md`, `pom.xml`, `application.yml`, `docker-compose.yml` or another
conventional repository file to the final evidence list or summary unless its
reported acquisition event exists in the current-run ledger.

Use only the canonical acquisition vocabulary when describing source provenance:
`discovered`, `matched via grep`, `read`, and `existing validated knowledge`.
Do not invent hybrid labels such as `matched via read`, `read/discovered`,
`inspected/read`, or other ad-hoc states. When a relationship is learned by
reading another file, describe the relationship separately from the provenance,
for example: `Referenced by RepositoryA via .gitmodules. Evidence source:
RepositoryA/.gitmodules (read).` This must not imply that the referenced
repository itself was read.

## Workflow

1. invoke `repository_inventory`;
2. when repository arguments are present, resolve and validate them without any
   selection interaction;
3. when repository arguments are absent, resolve the detailed scope through the
   repository-selection flow above, or stop after inventory for `Inventory only`
   or textual fallback;
4. only after `analysis_scope` is resolved, read existing repository and
   workspace knowledge plus persisted coverage before using or rewriting that
   knowledge, so valid knowledge from earlier slices is explicitly observed,
   preserved and resumable. A pre-existing artifact must have a current-run
   `read` before its contents may be classified as `existing validated
   knowledge`; do not rely on patch context, file existence or prior-run memory
   as a substitute for that read;
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
- `blocked`: detailed repository inspection could not start because of a
  concrete access, permission or tool blocker;
- `partially analysed`: detailed analysis started but remains incomplete;
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

Coverage notes must describe only evidence actually acquired. Build each note
from the reconciled run-local ledger rather than from repository contents,
generated knowledge or the analysis plan. Do not write notes such as `controller
inspected`, `tests inspected`, `configuration inspected`, `representative
sources inspected` or equivalent unless the exact supporting artifacts were
content-inspected in the run (or are explicitly identified as preserved
validated knowledge). Prefer exact paths or exact artifact classes actually
observed over broad evidence-category summaries. If a focused `grep` returned
matching test content but no test file was read, describe that narrowly; do not
say that tests were inspected. A file merely discovered by `glob` may be named
as `discovered` when that distinction is useful, but it must not appear in the
read/inspection portion of the note.

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

`not analysed` -> `referenced, not analysed` -> `blocked` ->
`partially analysed` -> `analysed`.

Do not use the current coverage state as a reason to skip an explicitly selected
repository. Coverage describes cumulative validated progress; it does not replace
the requested initialization work.

### Explicit scoped re-inspection gate

When repository arguments were supplied explicitly, successful completion requires
fresh repository evidence from the current run. Reading inventory, persisted
coverage and existing knowledge is preparation for re-initialization, not evidence
that the requested repository still matches that knowledge.

Before concluding that an explicitly selected repository needs no knowledge
changes:

1. perform fresh discovery inside that repository in the current run;
2. content-inspect the normal initialization evidence surfaces that are material to
   its current responsibilities, such as manifests, configuration, entry points,
   representative implementation and tests where useful;
3. compare that current evidence with the preserved knowledge;
4. only then leave unchanged artifacts untouched when no evidence-backed update is
   needed.

An `analysed` coverage state, unchanged repository knowledge, or the mere presence
of repository artifacts must never satisfy this gate by itself. Do not finish an
explicit scoped run after only `repository_inventory` plus reads under
`knowledge-base/`. A no-change result is valid only after current-run repository
inspection, or after reporting a concrete blocker that prevented that inspection.

If the current run has weaker or unavailable source evidence, preserve stronger
validated knowledge unchanged and report the limitation. Do not rewrite stronger
artifacts from the weaker evidence merely to demonstrate that re-inspection was
attempted.

Fresh inspection does not itself justify a knowledge change. Treat the existing
validated artifacts as the baseline and require a material evidence delta before
writing: a newly observed responsibility, flow, rule, relationship, contradiction,
stale statement, or materially stronger detail that is not already represented.
If current evidence merely confirms the baseline, leave the repository knowledge
byte-stable where practical and report that re-inspection found no material delta.
Do not rewrite, reformat, reorder, or expand documents merely to prove that the
repository was re-inspected.

Do not create an additional repository knowledge artifact during re-initialization
solely because an analytical phase is available. Add a new artifact only when the
current inspection reveals a material, evidence-backed knowledge gap that belongs in
that artifact and is not adequately represented by existing repository knowledge.

Before persisting a newly observed defect, contradiction, or stale statement, verify
that the conclusion is supported by the repository's actual language/toolchain and
relevant configuration. Do not record a syntax/build defect from surface syntax alone
when its validity depends on language version, compiler settings, generated-code
semantics, or another inspectable context. If that context is not confirmed, leave the
claim unresolved rather than mutating validated knowledge.

## Final report

Keep the final response concise.

Before drafting the response, build the final factual summary from the
reconciled run-local ledger plus persisted coverage and the set of files actually
written in the run. Do not summarize intended workflow steps as completed work.
For example, do not say `README/manifests + selective source/config reads` unless
README, manifest, source and configuration acquisition events supporting that
phrase are all present. Prefer exact wording such as `read pom.xml for
RepositoryA; read DocumentController.java and DocumentService.java for
RepositoryB` when provenance detail is useful.

Report:

- repositories covered in the requested scope;
- workspace repository coverage, including repositories not fully analysed;
- knowledge files created or updated;
- major workspace-level findings;
- unresolved blockers;
- phases that could not be completed.

After `knowledge_coverage` has persisted the canonical current state, derive
continuation guidance from that actual coverage. If any canonical repository is
`partially analysed`, `blocked`, `referenced, not analysed` or `not analysed`,
list the
repositories for which detailed initialization remains incomplete and provide a
copyable command for each immediate-child repository that can be continued, for
example:

```text
Detailed initialization remains incomplete for:

- RepositoryB — partially analysed
- RepositoryC — blocked

Continue individually with:

/knowledge-init RepositoryB
/knowledge-init RepositoryC
```

Do not emit generic resume advice when coverage already identifies the concrete
repositories. Do not suggest `knowledge-update` for the purpose of completing an
incomplete initialization.

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