---
name: dependency-inspection
description: Inspect external dependencies through repository-native development tooling while preserving read-only workspace semantics
---

# Dependency inspection

Use this skill when a workspace question requires evidence from an external
library, framework or package that cannot be established efficiently from the
repository itself.

This skill extends local retrieval. It does not replace repository manifests,
source code or existing knowledge as the preferred evidence sources.

## Preconditions

Before using a development tool:

1. identify the repository using `repository-analysis` when repository scope is
   not already established;
2. inspect the repository manifest and lockfiles;
3. determine the toolchain from repository evidence rather than language alone;
4. prefer a repository-provided wrapper when one exists;
5. verify that the required executable is available;
6. use the least invasive operation that can answer the question.

Do not install missing development tools automatically.

## Toolchain detection

Use repository evidence such as:

- Maven: `pom.xml`, `.mvn/`, `mvnw`, `mvnw.cmd`;
- Gradle: `build.gradle`, `build.gradle.kts`, `gradlew`, `gradlew.bat`;
- npm: `package.json` with `package-lock.json`;
- Yarn: `yarn.lock`, `.yarnrc.yml`, `packageManager` metadata;
- pnpm: `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `packageManager` metadata;
- .NET / NuGet: `*.sln`, `*.csproj`, `packages.lock.json`, `nuget.config`;
- Python: `pyproject.toml`, `requirements*.txt`, `poetry.lock`, `Pipfile`,
  `uv.lock` and related environment metadata;
- Go: `go.mod`, `go.sum`;
- Rust: `Cargo.toml`, `Cargo.lock`.

When multiple package managers are possible, prefer explicit project metadata,
then lockfiles, then repository wrappers. Do not silently substitute a different
package manager merely because it is installed.

## Retrieval order

Use this order where applicable:

1. dependency declaration in the repository manifest;
2. lockfile or effective dependency metadata already in the workspace;
3. artifact already present in a local package cache;
4. source artifact or type declarations already present locally;
5. native tool metadata query;
6. native dependency resolution or artifact download when necessary and
   permitted;
7. binary metadata inspection when source is unavailable.

Stop as soon as sufficient evidence exists.

## Read-only boundary

The workspace remains read-only.

Acceptable side effects are limited to normal external caches managed by the
selected toolchain, for example Maven, Gradle, NuGet, npm, Yarn, pnpm, Python,
Go or Cargo caches.

Do not intentionally:

- edit source files, manifests or lockfiles;
- generate project files into the repository;
- run code generators;
- publish or deploy artifacts;
- install global packages;
- modify the development environment beyond dependency resolution;
- execute project applications or tests merely to inspect a dependency.

If a command may modify repository files, do not run it automatically.

## Command safety

Native build and package tools may execute arbitrary project-defined code.
Treat this as a security boundary.

Safe automatic operations are limited to commands whose primary effect is tool
availability/version discovery or inspection of already-local artifacts.

Operations that may resolve dependencies, execute build configuration, invoke
plugins, run lifecycle hooks, restore packages or contact configured registries
must remain subject to the Bash permission model unless an equally safe command
has been explicitly allowlisted.

In particular, do not automatically run generic commands such as:

- `mvn package`, `mvn install`, `mvn test`;
- `gradle build`, `gradlew build`, arbitrary Gradle tasks;
- `npm install`, `npm ci`, `npm run ...`;
- `yarn install`, `yarn run ...`;
- `pnpm install`, `pnpm run ...`;
- `dotnet build`, `dotnet test`, `dotnet run`;
- arbitrary Python installation commands into the active project environment;
- publication, deployment or release commands in any ecosystem.

When dependency resolution is required, explain the intended command and use
the existing approval boundary instead of bypassing it.

## Ecosystem guidance

### Java / Maven

Prefer `mvnw` or `mvnw.cmd` when provided.

Useful evidence sources include:

- `pom.xml`;
- effective dependency metadata;
- the Maven local repository;
- binary JAR contents;
- `*-sources.jar` when available.

Typical inspection may use Maven dependency goals, `jar`, or `javap` as
appropriate. Dependency goals that can download artifacts or invoke project
plugins must respect the approval boundary.

### Java / Gradle

Prefer the Gradle wrapper when present.

Gradle build scripts are executable code. Even metadata tasks can evaluate
project build logic, therefore arbitrary Gradle invocations must not be treated
as intrinsically safe.

Prefer already-resolved Gradle cache artifacts when sufficient.

### .NET / NuGet

Use project and lock metadata first. Inspect the NuGet package cache when the
resolved package is already available.

`dotnet restore` and equivalent resolution operations may modify caches and
project-generated state and therefore must respect the approval boundary.

When source is unavailable, assembly metadata may still provide evidence about
public types and signatures.

### JavaScript / TypeScript

Respect the package manager selected by repository metadata and lockfiles.

Prefer:

- lockfile metadata;
- an existing `node_modules` package;
- package metadata;
- `.d.ts` type declarations;
- package source already present locally.

Do not replace Yarn or pnpm with npm merely for convenience.

Package installation can execute lifecycle scripts. Installation, restore and
script execution must therefore respect the approval boundary.

### Python

Respect the environment and package-management strategy declared by the
repository.

Prefer installed distribution metadata and package source from the active or
project-declared environment before downloading anything.

Do not mutate the repository's environment or dependency declarations merely to
inspect a package.

### Go and Rust

Use module/package metadata and existing caches first. Native dependency fetch
operations may use configured registries and caches and must respect the
approval boundary when they produce side effects or network access.

## Network boundary

Do not use public-web tools or generic HTTP clients for dependency research.

Native package managers may contact registries configured by the repository or
local development environment when dependency resolution is explicitly needed
and permitted. Treat registry access as part of the native toolchain workflow,
not as general web research.

Never upload workspace content as part of dependency inspection.

## Missing tooling

If the required executable is unavailable:

1. continue with existing local evidence;
2. identify the missing tool explicitly;
3. state which deeper inspection could not be performed;
4. do not install the tool;
5. do not present the missing evidence as confirmed.

A missing package manager should affect only the analysis that requires it.

## Evidence reporting

When dependency inspection contributes materially to an answer, report:

- repository and manifest establishing the dependency;
- resolved dependency identity and version when known;
- toolchain used;
- local artifact, cache path, source archive, type declaration or binary
  metadata inspected;
- whether the evidence came from source, declarations or compiled metadata;
- limitations or unresolved information.

Keep workspace source evidence and external dependency evidence distinguishable.
