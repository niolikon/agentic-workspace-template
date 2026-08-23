---
name: repository-analysis
description: Use for repository inventory, identity, submodules, build systems and repository relationships; supporting capability for other analysis, not execution-path tracing
---

# Repository analysis

Use this skill when repository discovery, identity, topology, build structure or
repository relationships are themselves part of the requested analysis. It can
also be loaded as a supporting capability by a specialized analysis skill when
a repository inventory or relationship must be established as evidence.

Do not use this skill as a substitute for a matching specialized capability. In
particular, questions about how an operation executes or propagates through the
system belong to `execution-flow-analysis`; load this skill only afterwards if
the execution analysis needs authoritative repository evidence.

## Mandatory repository inventory

When this skill is responsible for repository discovery or has been loaded to
provide authoritative repository evidence, invoke the `repository_inventory`
tool before using `glob`, `grep`, `read` or Bash for that repository-discovery
work.

The tool output is the authoritative workspace repository inventory.

Every confirmed Git repository returned by the tool is a first-class workspace
repository, regardless of whether it:

- is referenced by an orchestrator;
- is a Git submodule;
- is a direct child of `repositories/`;
- is nested inside another repository;
- appears unrelated to the other repositories;
- contains an application, library, driver, tool or infrastructure component.

Orchestrator membership is metadata. It is never a filter for inclusion.

Do not conclude that a repository does not exist based on `glob` results.

Do not replace the tool result with an independently inferred repository list.

## Workspace membership

A repository belongs to the workspace when it is discovered under
`repositories/`.

Every workspace repository should be considered for repository-specific
knowledge generation.

Relationships between repositories may be:

- submodule;
- compile-time dependency;
- runtime integration;
- deployment relationship;
- shared infrastructure;
- no demonstrated relationship.

The absence of a demonstrated relationship does not reduce the repository's
importance or exclude it from documentation.

## Authoritative repository discovery

The `repository_inventory` tool is the authoritative source for repository
discovery.

Do not independently rebuild the repository inventory using `glob`, `find`,
PowerShell or Git commands.

Filesystem and Git commands may be used only to investigate details that are
not already provided by the tool or to diagnose a tool failure.

Never replace or narrow the repository set returned by `repository_inventory`.

## Repository identity

For each discovered repository collect, when available:

- workspace-relative path;
- repository name;
- Git top-level path;
- remote URL;
- current branch;
- current commit;
- whether `.git` is a directory or a file;
- whether the repository is referenced as a submodule.

Use the remote URL as the strongest repository-identity signal when available.

When the same logical repository appears at multiple workspace paths:

1. report every path;
2. identify the likely canonical path;
3. avoid generating duplicate repository knowledge;
4. document the duplicate or alternate checkout explicitly.

Do not merge repositories solely because their directory names are equal.

## Orchestrator and submodule discovery

For every confirmed repository:

1. check for `.gitmodules`;
2. read `.gitmodules` when present;
3. identify each declared submodule:
   - logical name;
   - relative path;
   - remote URL;
4. run `git submodule status` when permitted;
5. capture the commit pinned by the orchestrator;
6. verify whether the submodule directory exists locally;
7. match the submodule to discovered logical repositories by remote URL and path.

A repository containing submodules is an orchestrator or aggregate repository,
but remains a repository in its own right.

Represent a submodule relationship as:

```text
orchestrator repository
→ submodule path
→ logical repository
→ pinned commit
```

A submodule relationship means that the parent repository selects a version of
another repository. It does not by itself prove a compile-time dependency,
runtime integration, business execution flow or shared deployment.

## Repository classification

Classify repositories when supported by evidence. Possible roles include:

- application;
- service;
- frontend;
- library;
- infrastructure or orchestration repository;
- deployment repository;
- documentation repository;
- test-support repository.

A repository may have more than one role.

## Inventory workflow

1. discover all Git roots authoritatively;
2. collect repository identity;
3. detect orchestrators and submodules;
4. detect duplicate or alternate checkouts;
5. identify primary manifests;
6. identify languages and build systems;
7. identify produced artifacts when requested;
8. identify compile-time relationships when requested;
9. identify runtime integrations only when requested;
10. report covered, skipped and unresolved repositories.

## Primary manifests

Look for:

- `pom.xml`, `.mvn/`, `mvnw`, `mvnw.cmd`;
- `build.gradle`, `build.gradle.kts`, `gradlew`, `gradlew.bat`;
- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`;
- `*.sln`, `*.csproj`, `packages.lock.json`, `nuget.config`;
- `pyproject.toml`, `requirements*.txt`, `poetry.lock`, `Pipfile`, `uv.lock`;
- `go.mod`, `go.sum`;
- `Cargo.toml`, `Cargo.lock`.

This list is not exhaustive.

## Native toolchain selection

When analysis requires the repository's development tooling, determine the tool
from repository evidence rather than language alone.

Prefer, in order:

1. an explicit repository wrapper such as `mvnw` or `gradlew`;
2. package-manager metadata such as the `packageManager` field;
3. an ecosystem-specific lockfile;
4. the primary build manifest.

Do not silently substitute npm for Yarn or pnpm, Maven for Gradle, or another
tool merely because it is installed locally.

Repository analysis identifies the toolchain. Detailed inspection of external
dependencies belongs to the `dependency-inspection` skill.

## Relationship taxonomy

Keep these relationship types separate.

### Submodule relationship

Evidence:

- `.gitmodules`;
- `git submodule status`;
- the Gitlink commit stored by the parent repository.

Meaning:

- repository inclusion;
- version or commit pinning;
- orchestration or aggregate checkout.

### Compile-time dependency

Evidence:

- Maven or Gradle dependency;
- .NET project or package reference;
- npm workspace or package dependency;
- an equivalent build-manifest reference.

Meaning: one repository consumes an artifact produced by another.

### Runtime integration

Evidence:

- HTTP client and matching endpoint;
- message producer and matching consumer;
- gateway route;
- configuration pointing to another service;
- shared runtime storage;
- file exchange or equivalent protocol.

Meaning: independently running components interact during execution.

### Deployment relationship

Evidence:

- Docker Compose;
- Kubernetes manifests;
- infrastructure configuration;
- deployment scripts;
- orchestrator configuration.

Meaning: components are deployed, configured or started together.

Do not collapse different relationship types into a generic dependency.

## Tool-call efficiency

- Perform one authoritative Git discovery operation.
- Do not repeat repository discovery with multiple glob calls.
- Group manifest searches whenever practical.
- Inspect `.gitmodules` only in confirmed repositories.
- Inspect source code only when required by the requested analysis.
- Reserve enough steps for consolidation and reporting.

## Reporting

For every repository report:

- logical identity;
- workspace paths;
- role;
- primary manifests;
- language;
- build system;
- orchestrator or submodule status;
- evidence;
- unresolved information.

For every relationship report:

- source repository;
- target repository;
- relationship type;
- evidence;
- confidence;
- unresolved details.
