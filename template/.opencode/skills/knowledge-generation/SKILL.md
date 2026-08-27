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

Coverage entries should link to repository knowledge when it exists and should
remain traceable to actual initialization evidence. Do not create placeholder
repository directories merely to represent uninspected repositories.

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
- Migrate obsolete structure only when necessary.
- Report obsolete or unverified content.

## Markdown quality

- Use standard Markdown.
- Prefer relative links.
- Avoid empty sections and placeholders.
- Verify that related links point to existing documents when practical.
- Avoid duplicate documents describing the same concept.
