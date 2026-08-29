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

- Treat existing validated knowledge as material to refine, not replace.
- Preserve valid content and references.
- Prefer localized updates.
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
