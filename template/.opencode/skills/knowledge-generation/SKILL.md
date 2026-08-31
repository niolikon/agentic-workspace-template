---
name: knowledge-generation
description: Canonical structure and maintenance rules for the workspace knowledge base
---

# Knowledge generation

Use this skill for every knowledge-base task.

## Canonical structure

```text
knowledge-base/
├── workspace/
└── repositories/
    └── <repository-name>/
```

Workspace-wide knowledge belongs under `knowledge-base/workspace/`.
Repository-specific knowledge belongs under
`knowledge-base/repositories/<repository-name>/`.

## Possible workspace documents

Create only when supported by evidence:

- `overview.md`;
- `architecture.md`;
- `repository-relationships.md`;
- `orchestration.md`;
- `execution-flows.md`;
- `data-flows.md`;
- `business-rules.md`;
- `architectural-patterns.md`;
- `development.md`;
- `operations.md`;
- `glossary.md`.

## Possible repository documents

Create only when supported by evidence:

- `overview.md`;
- `architecture.md`;
- `components.md`;
- `execution-flows.md`;
- `data-flows.md`;
- `business-rules.md`;
- `public-interfaces.md`;
- `configuration.md`;
- `dependencies.md`;
- `persistence.md`;
- `development.md`;
- `operations.md`;
- `submodules.md`.

Do not create every possible document automatically.

## Evidence threshold for persistent knowledge

Persistent knowledge must be supported by workspace evidence appropriate to the
kind of claim being recorded. Plausibility is not evidence.

Treat repository inventory, repository names, manifest presence, language/build
metadata, submodule identity and directory layout as structural evidence only.
They may support repository classification, topology, build-system facts and
limited architectural observations, but do not establish behavioural or domain
knowledge by themselves.

Do not persist behavioural claims derived only from:

- common domain semantics;
- repository or component names;
- generic framework conventions;
- expected architectural patterns;
- the existence of candidate controllers, services or manifests without a
  demonstrated runtime binding.

This restriction includes assumed authorization or ownership rules, lifecycle
or state-machine transitions, API contracts, persistence/atomicity guarantees,
runtime integrations and execution flows.

When evidence for a knowledge category is unavailable, blocked or insufficient,
prefer an explicit incomplete assessment over a placeholder document. Do not
create `business-rules.md`, `execution-flows.md` or another category document
whose durable content would consist only of hypotheses, conventions or
low-confidence guesses. Preserve any existing confirmed content unchanged unless
new evidence supports a safe update.

## Scope rules

- Repository-local information stays in the repository directory.
- Cross-repository information stays in the workspace directory.
- Prefer relative Markdown links over duplication.
- Workspace documents should connect and summarize repository knowledge rather
  than repeat it verbatim.

## Orchestrator knowledge

When a repository contains Git submodules:

- create repository-specific orchestration knowledge under that repository;
- document `.gitmodules`;
- document submodule paths and remote identities;
- document pinned commits when available;
- distinguish repository composition from build and runtime relationships.

Detailed submodule evidence belongs under:

```text
knowledge-base/repositories/<orchestrator>/submodules.md
```

Workspace-level orchestration implications belong under:

```text
knowledge-base/workspace/orchestration.md
```

Do not duplicate the complete submodule inventory in both locations.

## Repository coverage

For full-workspace initialization, create repository-specific knowledge for every
confirmed Git repository returned by `repository_inventory`.

For scoped initialization, keep the full inventory visible for coverage but
create or deepen repository-specific knowledge only for repositories in the
requested detailed analysis scope. An out-of-scope repository may appear in
workspace relationship knowledge without receiving repository-local analysis.

The scope is also a source-inspection boundary. Do not read, glob or grep files
inside an out-of-scope repository in order to improve repository-local or
workspace-level knowledge. Cross-scope claims must be supported from the
selected repository side, permitted workspace-level sources, repository
inventory metadata, or previously validated knowledge.

When an in-scope orchestrator contains a nested checkout for an out-of-scope
canonical repository, orchestration metadata owned by the orchestrator may be
read, but the nested repository content remains out of scope.

Scoped initialization reduces the number of repositories analysed; it does not
reduce the expected analysis depth of repositories that are in scope. For an
in-scope repository, apply the normal selective-analysis sequence: README and
primary manifests first, then relevant configuration, entry points,
representative implementation files and tests as required by the knowledge
being generated.

Do not create repository execution-flow, data-flow or business-rule knowledge
from README-level inference alone when stronger evidence is available through
reasonable selective inspection of the same in-scope repository. If the
supporting implementation evidence does not exist, is not discoverable
selectively, or cannot be read because of an actual blocker, preserve the
uncertainty and record `insufficient evidence`; do not replace the missing
evidence with convention-based inference.

Repository documentation, when the repository is in the detailed analysis
scope, is required regardless of whether the repository:

- participates in an orchestrated system;
- is a standalone application;
- is a shared library;
- is an experimental component;
- is a driver or integration adapter;
- has no currently demonstrated relationship with other repositories.

Do not use cross-repository relationships as a prerequisite for repository
documentation.

### Coverage state

Keep repository coverage observable in existing workspace knowledge, preferably
in `knowledge-base/workspace/overview.md`. Use the simplest representation that
fits the existing document, such as a compact Markdown table.

Distinguish:

- `analysed`;
- `partially analysed`;
- `referenced, not analysed`;
- `not analysed`.

Coverage is cumulative across initialization runs. Preserve prior validated
coverage and strengthen it only when new evidence supports the stronger state.
A discovered relationship is evidence for `referenced, not analysed`, never by
itself for `analysed`.

Do not equate repository discovery with repository analysis. Repository
inventory, directory enumeration and `glob` results prove identity or structure;
they do not prove the contents of discovered source/configuration/test files.
README and manifest reads prove only what those artifacts state. When material
repository behaviour remains dependent on uninspected implementation or
configuration, the strongest new coverage state for that run is normally
`partially analysed`, unless a stronger validated state already exists.

Coverage notes must be provenance-accurate. Never state that controllers,
services, tests, configuration, deployment descriptors or other implementation
artifacts were inspected unless their contents were actually inspected or the
note explicitly refers to preserved validated knowledge.

Treat coverage as a canonical current-state projection, not a history of
initialization runs.

For incremental initialization, `knowledge-base/workspace/overview.md` is a
canonical current-state document. When it already exists, update it only through
a complete-file reconstruction followed by a full replacement with the `write`
tool. Do not invoke `edit` for this file during the cumulative update, and do
not patch the coverage section or append current-slice rows.

The repository coverage section MUST start with the exact ATX heading
`## Repository coverage`. Stable heading syntax is part of the persisted
knowledge contract; do not substitute a Setext heading or another level.

The update procedure is mandatory:

1. read the complete existing overview before writing;
2. parse existing coverage into a map keyed by canonical logical repository
   identity and collapse duplicates to the strongest valid state;
3. reconcile that map with the authoritative repository inventory;
4. apply current-slice evidence as state transitions while preserving stronger
   valid states from earlier runs;
5. retain unrelated overview content only when it is still valid;
6. remove or rewrite stale run-specific statements;
7. render the complete desired overview in memory with one canonical
   `## Repository coverage` table containing every logical repository exactly
   once;
8. replace the complete overview file with one `write` tool call; `edit` is
   forbidden for this cumulative overview update.

After writing, verification is also mandatory:

1. read the complete persisted overview back;
2. locate the coverage section from the exact `## Repository coverage` heading
   to the next level-two `## ` heading, or EOF;
3. count canonical repository identifiers in coverage entries and require each
   to occur exactly once;
4. require that no weaker superseded state or stale old coverage row remains;
5. require that stale run-specific metadata is absent;
6. if any check fails, reconstruct and overwrite the complete overview again
   before initialization may complete.

Do not claim that the coverage was rebuilt or verified unless the persisted
readback satisfies these checks. A section patch, row insertion, or append-only
edit is a failure of this procedure even if the intended table was rendered.

Preserve valid state for repositories not touched by the current slice. Treat
normal coverage progression as monotonic:

`not analysed` -> `referenced, not analysed` -> `partially analysed` ->
`analysed`.

Do not downgrade stronger validated coverage because a later slice provides
only weaker relationship evidence.

Do not use the persistent workspace overview as a run log. Prefer not to store
`Scope of this run` there at all; report the requested scope in the command's
final response. If such a line already exists, replace or remove it rather than
adding another occurrence during incremental initialization.

If the surrounding workspace overview contains other run-specific prose, keep
it only while it remains true. Incremental runs must rewrite or remove stale
statements such as "no existing knowledge-base was present" rather than carrying
them forward as workspace facts.

Coverage entries should link to repository knowledge when it exists and should
remain traceable to actual initialization evidence. Do not create placeholder
repository directories merely to represent uninspected repositories.


### Deterministic coverage persistence

During `knowledge-init`, repository coverage is tool-owned state. Invoke
`knowledge_coverage` after repository-local analysis and reconciliation. Pass
only evidence-backed state changes from the current slice; do not manually patch
or regenerate the coverage Markdown table. The tool discovers canonical logical
repositories, parses any existing coverage, collapses duplicate rows to the
strongest state, applies monotonic transitions and replaces the complete
`## Repository coverage` section.

Do not compensate for a failed coverage-tool update with `edit` or `write`. Read
the persisted overview after the tool call and report a blocker if it does not
match the tool result.

## Behavioural artifact evidence gate

Before creating or materially extending a behavioural knowledge artifact:

1. list the material claims that the artifact would persist;
2. associate every claim with content-inspected evidence from the current run or
   existing validated knowledge;
3. reject claims supported only by repository inventory, directory enumeration,
   `glob`, filenames, repository names, manifest metadata or generic conventions;
4. keep README/documentation claims scoped to exactly what the documentation
   states; do not report them as source-code, test or runtime verification;
5. if no stable reusable claims survive this check, return `insufficient
   evidence` for the phase and do not create the artifact.

A `glob` result is discovery evidence only. The presence of paths such as
`TodoController.java`, `application.yml`, `docker-compose.yml` or a test class
must never be described as inspection of those artifacts unless relevant file
content was actually observed.

Apply this gate independently to repository and workspace artifacts. Workspace
reconciliation must not combine several weak structural signals into a stronger
behavioural conclusion.

## Evidence ledger reconciliation

During `knowledge-init`, keep a run-local ledger of the evidence actually
acquired. Populate it only from completed acquisition results and record each
successful observation as it occurs; never reconstruct the ledger later from
expected repository contents, intended analysis steps, generated knowledge or
paths mentioned by another source. Treat these evidence classes differently:

- `repository_inventory`: identity/topology metadata only;
- `glob` or directory enumeration: exact discovered paths/structure only;
- focused `grep`: exact matching files/fragments and only the returned matching
  content;
- `read`: exact files and only the returned file content;
- existing validated knowledge: reusable evidence, clearly distinguished from
  evidence newly inspected in the current run, and available only after the
  corresponding existing knowledge artifact has itself been content-read during
  the current run.

Do not infer `existing validated knowledge` from artifact existence, persisted
coverage, patch context or memory of a previous run. Read the existing knowledge
artifact before using any of its assertions as evidence or before rewriting it.
If it cannot be read, preserve it unchanged when appropriate but do not treat its
contents as an observed evidence source for the current run.

When an existing knowledge artifact is refreshed, preserve persistent validated
facts separately from run-relative diagnostics. Persistent claims may survive
when still supported; diagnostics tied to a specific acquisition run must not be
carried forward unchanged. Recompute from the current ledger any `Evidence
acquired during this run` section, current-run provenance list, statement that a
source/category was or was not inspected, evidence-gap rationale, confidence
rationale, unresolved item, or suggested next step whose wording depends on what
was acquired in that run. If new reads close an old evidence gap, remove or
rewrite the stale limitation instead of preserving it as validated knowledge.

In particular, patching an existing overview after reading source/configuration
must not leave phrases such as `no source implementation files were read`,
`runtime configuration was not inspected`, or `HTTP endpoints remain
insufficient evidence because source was not read`. Embedded run-local evidence
sections must be regenerated from the complete current-run ledger, not appended
to or partially patched from the prior run.

For structured repository artifacts such as `overview.md`, a material
refresh of an existing artifact is a **tool-enforced canonical replacement**.
Use `knowledge_artifact_refresh`; do not rely on generic mutation tools to honour
this invariant.

The required sequence is:

1. invoke `knowledge_artifact_refresh(action=inspect)` for the existing artifact
   before any modification and before using its assertions as validated input.
   The returned complete content is the observed existing-knowledge source and
   the returned `revision` token identifies exactly that observed revision;
2. snapshot only persistent validated facts and their prior provenance. Text in
   the old artifact that says `read`, `discovered`, `inventory`, `this run`,
   `not inspected`, or equivalent remains prior-run provenance and must never be
   copied into the current run-local ledger;
3. acquire current-run repository evidence and populate the run-local ledger only
   from completed acquisition results in the current trace;
4. reconcile persistent facts with that ledger and recompute all run-relative
   evidence, limitations, confidence and unresolved items;
5. render the complete desired canonical artifact in memory;
6. invoke `knowledge_artifact_refresh(action=replace)` with that complete content
   and the exact `expectedRevision` from step 1. The tool rejects a stale token,
   performs a whole-file replacement preserving the artifact's line-ending style,
   and verifies the persisted content;
7. require successful tool verification before treating the artifact as refreshed.
   For repository `overview.md`, duplicate exact Markdown headings are rejected.

Generic `write`, `edit`, patch, diff-style replacement, append-only merge and
repeated localized edits are forbidden for this refresh. If the dedicated tool
is unavailable or rejects the operation, report the refresh as blocked rather
than falling back. The protocol is `inspect -> reconcile -> replace`; it applies
only to the individual artifact being refreshed and does not authorize rewriting
unrelated knowledge artifacts or regenerating the whole knowledge base.

The final response must describe the operations that are actually visible in the
tool trace. Do not claim `read before update`, `fully rewritten`, inventory
discovery, or a current-run source read unless the corresponding current-run
tool event occurred in that order.

Acquisition states are independent. A discovered path remains only `discovered`
until a later content operation actually observes content from it. `grep` adds
`matched via grep`; it does not imply a full-file read. `read` adds `read`. Do
not synthesize any of these states from repository conventions or from another
state.

Before persisting any repository or workspace artifact, before submitting
coverage updates, and before writing the final report, reconcile all provenance
wording against that ledger. Reconciliation may remove or narrow claims but must
not invent missing evidence. This includes `Evidence`, `Sources`, confidence
justifications and other provenance prose inside generated knowledge artifacts;
those sections are projections of the ledger, not independently generated source
lists. Never use broad phrases such as `representative sources inspected`,
`tests inspected`, `configuration inspected` or `docker-compose evidence`
unless the ledger contains the corresponding content inspections.

A test-class path discovered by `glob` is not a test inspection. A matching line
returned by `grep` may support the specific rule expressed by that line, but it
must be reported as matching test content rather than as inspection of the test
suite unless the relevant test file was actually read. This applies to evidence
lists as well as prose: do not write `X.java and unit tests`, `source + tests`,
or equivalent shorthand unless those test files were content-read. Prefer the
read source alone when it is sufficient; otherwise say `matching test content
observed via grep` and name the matched test file when the tool result exposes it.

Architecture artifacts are subject to the same rule. Repository names,
`.gitmodules`, manifests and discovered deployment paths may establish
structural topology, but runtime/deployment architecture claims that depend on
`docker-compose`, gateway configuration or deployment manifests require those
contents to have been inspected. Do not create or strengthen `architecture.md`
when its material claims would exceed that evidence ceiling.

Coverage is also reconciled against the ledger. `knowledgeArtifact` identifies a
knowledge Markdown artifact, not the evidence used in the slice. When supplied
to `knowledge_coverage`, it must be an actual artifact path under
`knowledge-base/` (or a knowledge-base-relative `repositories/...` or
`workspace/...` path); evidence descriptions belong in `notes`. Build coverage
notes from the repository's ledger entries: exact read sources may be described as read,
grep-only sources as `matching content observed via grep`, and discovery-only
sources only as discovered. Keep reused validated knowledge explicitly separate
from current-run observations. A repository whose README and manifest were read
but whose material implementation/configuration surfaces remain merely
discovered is normally `partially analysed`, not `analysed`, for the current
slice. Preserve a stronger validated prior state rather than regressing it.

When a generated artifact or the final response exposes evidence or provenance,
it is an authoritative projection of the same ledger. Use explicit labels
`discovered`, `matched via grep`, `read`, and `existing validated knowledge`;
do not collapse them into ambiguous labels such as `read/discovered` and do not
invent ad-hoc states such as `matched via read`. Multiple labels for one source
are valid only when every corresponding event actually occurred. Never add
common files such as `README.md`, `pom.xml`, `application.yml` or
`docker-compose.yml` just because they exist or would normally be inspected.

A relationship learned from a read source does not transfer that source's
acquisition state to the referenced repository or path. If `.gitmodules` is read
and names `TaskBoard.App.Ng`, the run may report that `TaskBoard.App.Ng` is
referenced by the read `.gitmodules`; it must not describe `TaskBoard.App.Ng` as
`matched via read`, `read`, or inspected unless its own content was acquired.
Likewise, a README mentioned by another file or present in a nested checkout must
not appear as `read` in an artifact's Evidence section without a corresponding
read event (or an explicit `existing validated knowledge` basis).

The same rule applies to ordinary final-summary prose. Statements describing the
work performed (`README/manifests inspected`, `configuration reviewed`,
`selective source reads`, and similar) must be supported by the ledger at the
stated granularity; otherwise replace them with exact ledger-backed sources or
omit the category-level statement.

## Document responsibility

Each knowledge document has a specific responsibility.

`overview.md` is an entry point, not a catch-all document.

It should contain only:

- repository purpose;
- role;
- technology stack;
- build system;
- major responsibilities;
- major dependencies;
- links to detailed repository knowledge;
- important unresolved questions.

Do not place detailed execution flows, data flows, persistence models,
configuration details or architectural analysis directly in `overview.md`
when they justify dedicated documents.

Use:

- `execution-flows.md` for processing paths;
- `data-flows.md` for data movement and transformation;
- `business-rules.md` for domain constraints, invariants, lifecycle rules,
  state transitions and other evidence-backed behavioural rules;
- `architecture.md` for structural design;
- `components.md` for important internal components;
- `dependencies.md` for compile-time and runtime relationships;
- `persistence.md` for persistence models;
- `configuration.md` for runtime configuration.

Update `overview.md` with relative links to those documents.

## Relationship documentation

`repository-relationships.md` must classify relationships explicitly as:

- submodule;
- compile-time dependency;
- runtime integration;
- deployment relationship;
- shared storage or infrastructure;
- probable or unresolved relationship.

Never use the generic term `dependency` when a more precise relationship type
can be determined.

## Logical repository deduplication

When the same logical repository appears at multiple workspace paths:

- correlate copies using remote URL and Git identity;
- create only one canonical repository knowledge directory;
- list all known checkout paths in its `overview.md`;
- identify which checkout is referenced by the orchestrator;
- do not generate duplicate knowledge directories from directory names alone.

## Traceability

Every generated or updated document should include, when relevant:

- confirmed facts;
- inferences;
- unresolved questions;
- conflicts;
- evidence paths;
- confidence.

Use workspace-relative paths.

## Existing knowledge

- Treat existing validated knowledge as material to refine, not discard.
- Preserve valid content and references semantically.
- Prefer localized updates only when the loaded workflow has not designated the
  target as a mandatory whole-file replacement. During `knowledge-init`, a
  material refresh of an existing structured repository artifact such as
  `overview.md` must follow the canonical replacement protocol above.
- Merge by document responsibility and canonical entity identity; do not use
  append-only updates when an existing fact, coverage row or summary entry is
  being refined.
- Remove superseded contradictory state instead of preserving both old and new
  representations.
- Migrate obsolete structure only when necessary.
- Report obsolete or unverified content.

## Markdown quality

- Use standard Markdown.
- Prefer relative links.
- Avoid empty sections and placeholders.
- Verify that related links point to existing documents when practical.
- Avoid duplicate documents describing the same concept.
