---
name: repository-analysis
description: Discover and analyse Git repositories, submodules, build systems and repository relationships
---

# Repository analysis

Use this skill for repository inventories, Git submodule analysis, build-system
detection, language detection and cross-repository relationship analysis.

## Authoritative repository discovery

Repository discovery MUST use filesystem or Git commands.

Do not use `glob` as the primary or authoritative repository-discovery method.
A glob result may be used only as supplementary evidence.

On Bash-compatible environments, locate both `.git` directories and `.git`
files:

```bash
find repositories \

  \( -type d -o -type f \) \
  -name .git \
  -print
```

On PowerShell environments:

```powershell
Get-ChildItem repositories -Force -Recurse |
    Where-Object { $_.Name -eq ".git" } |
    Select-Object -ExpandProperty FullName
```

A repository root is confirmed when:

- it directly contains a `.git` directory;
- it directly contains a `.git` file used by a submodule or worktree;
- `git -C <directory> rev-parse --show-toplevel` succeeds.

Never inspect the internal contents of a `.git` directory.

A directory may be both a Git repository root and a container of nested
repositories or submodules. These roles are not mutually exclusive.

Never classify a directory as a simple container before checking whether it is
itself a Git repository.

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

- `pom.xml`;
- `build.gradle`;
- `build.gradle.kts`;
- `package.json`;
- `*.sln`;
- `*.csproj`;
- `pyproject.toml`;
- `requirements.txt`;
- `go.mod`;
- `Cargo.toml`.

This list is not exhaustive.

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
