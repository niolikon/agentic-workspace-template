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
5. determine the exact resolved dependency version before remote retrieval;
6. verify that the required executable is available;
7. use the least invasive operation that can answer the question.

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
3. artifact already present in the repository-local dependency directory;
4. artifact already present in a local package cache;
5. source artifact, type declaration or binary metadata already present locally;
6. native tool metadata query that does not materialize dependencies;
7. retrieval of the smallest exact artifact required through the native Bash permission boundary;
8. binary metadata inspection when source is unavailable.

Stop as soon as sufficient evidence exists. Never resolve the whole dependency
graph merely because an inspection mechanism is available.

## Native Bash permission contract

Permission handling belongs to OpenCode, not to the agent conversation.

Every shell command must be constructed and invoked normally. The agent must
never ask questions such as "May I run this command?", "Do you approve?" or
"Can I proceed with Maven/npm/etc.?".

OpenCode's native Bash permission system is the sole authority for shell-command
approval. With the `ask` agent, Bash commands are configured with `"*": ask`,
so OpenCode may display its native approval dialog for any command. The user can
then allow or deny the command using the OpenCode interface, including any
persistent approval option offered by that interface.

Before invoking a dependency-related command:

1. establish the dependency from repository evidence;
2. determine the exact resolved version whenever possible;
3. inspect repository-local artifacts and already-populated local caches first;
4. choose the least invasive native command that can produce the missing evidence;
5. ensure the command does not intentionally modify repository source, manifests or lockfiles;
6. direct temporary artifacts under `.opencode/.tmp/dependencies/` whenever the tool supports an explicit output destination.

Then invoke the command directly and let OpenCode enforce the permission policy.

If OpenCode denies the command, do not rephrase the same request as a
conversational approval question and do not bypass the denial with another tool
or package manager. Continue with the remaining evidence when possible and
report the resulting limitation.

The safety guidance in this skill determines which command is appropriate to
attempt. It does not replace OpenCode's permission system.

## Critical permission-handling rule

Bash approval is **never conversational**.

Never ask the user for permission to execute a shell command.

Forbidden conversational patterns include:

- "May I run this command?"
- "Do you approve?"
- "Can I proceed?"
- "Reply yes to continue."
- "I need your approval before running Maven/npm/dotnet/etc."

If a shell command is necessary, invoke the Bash tool immediately.

OpenCode's native Bash permission system is the only approval mechanism. It may
interrupt execution and display its own approval dialog. Do not predict,
simulate, duplicate or replace that dialog in the conversation.

If OpenCode denies a command, respect the denial, continue with the evidence
already available when possible, and report the limitation. Do not ask the user
again in chat for permission to run the same operation.

## Critical staging rule

Dependency artifacts intentionally materialized for inspection must never be
written inside a repository.

Do not use repository-local staging paths such as:

- `target/deps/`;
- `build/deps/`;
- `node_modules/`;
- `src/`;
- repository-local `tmp/` directories.

Use the canonical workspace-local staging area instead:

```text
.opencode/.tmp/dependencies/<ecosystem>/
```

Examples:

- `.opencode/.tmp/dependencies/maven/`
- `.opencode/.tmp/dependencies/gradle/`
- `.opencode/.tmp/dependencies/nuget/`
- `.opencode/.tmp/dependencies/npm/`
- `.opencode/.tmp/dependencies/python/`

Existing artifacts already present in external package-manager caches may be
inspected in place. The staging rule applies only to artifacts intentionally
materialized for the current analysis.

## Local caches and resolved-version evidence

Existing dependency caches are valid local evidence sources and should be
inspected in place when already available. Do not copy an already-local artifact
into `.opencode/.tmp/dependencies/` merely to inspect it. The staging area is
reserved for artifacts intentionally materialized by retrieval commands.

Cache contents do not establish which dependency version a repository resolves:
a cache may contain versions accumulated from unrelated projects.

Determine the exact resolved version from resolution evidence, preferring as
applicable:

- lockfiles;
- generated resolution metadata such as `.NET` `obj/project.assets.json`;
- central dependency-management files such as `Directory.Packages.props`;
- effective dependency trees or equivalent native-tool output;
- other ecosystem-specific resolution metadata.

A manifest version is only a declared version unless resolution evidence confirms
it. Use the confirmed resolved version to locate an artifact in a local cache. If
the artifact is absent, construct the narrowest retrieval command, invoke it immediately through Bash,
and let OpenCode's native permission system handle authorization.

## Critical local-source short-circuit rule

When the candidate dependency version has a source artifact already available in
a local package-manager cache, inspect that source artifact immediately before
attempting any retrieval.

A cached source artifact takes precedence over:

- dependency download/get/copy commands;
- archive extraction into workspace staging;
- alternate package-manager retrieval strategies;
- repeated toolchain retries.

If the cached source artifact contains the exact implementation or API evidence
required by the question, dependency retrieval must stop there.

Do not retrieve an artifact merely to obtain another copy of evidence that is
already locally inspectable.

## Critical no-cache-to-resolution rule

A manifest declaration plus a matching cached artifact never proves the resolved
dependency version.

If resolution has not been independently established from lockfiles, generated
resolution metadata, effective dependency-tree output or equivalent evidence,
report the distinction explicitly:

- declared version;
- cached artifact version inspected;
- resolved version: not independently confirmed.

Do not combine manifest and cache presence into phrases such as "the build uses
this version", "the effective version is", or "the resolved version is".

If the user's question does not require independent resolution verification, it
is acceptable to inspect the cached artifact corresponding to the declared
version, provided the answer clearly states that boundary.

## Critical retrieval retry rule

After any retrieval command fails, re-evaluate existing local evidence before
trying another retrieval form.

Do not repeatedly try `dependency:get`, `dependency:copy`, alternate plugin
invocations, wrapper variants or equivalent commands when the required artifact
is already present in a local cache.

Retry retrieval only when:

1. the artifact required for the analysis is genuinely absent or insufficient;
2. the previous failure identifies a specific correctable cause;
3. the next command materially improves the chance of obtaining missing evidence.

If local evidence becomes sufficient at any point, stop retrieval attempts and
continue the analysis.

## Archive inspection fallback

For ZIP-compatible dependency artifacts such as JAR and NUPKG files:

1. prefer direct inspection without copying or extracting when possible;
2. use an ecosystem-native archive tool when available;
3. otherwise use an already-available ZIP API/tool;
4. avoid renaming or copying an archive solely to satisfy a filename-extension
   restriction when direct archive reading is possible.

On Windows, PowerShell/.NET `System.IO.Compression.ZipFile` is an acceptable
fallback for direct JAR/NUPKG entry inspection.

## Critical cache-first inspection rule

If the exact resolved artifact is already present in a local package-manager
cache and already exposes the evidence needed for the analysis, inspect it in
place.

Do not copy, unpack or extract an already-inspectable cached artifact into
`.opencode/.tmp/dependencies/` merely for convenience.

Workspace-local staging is used only when one of the following is true:

- the required artifact is not present locally and must be retrieved;
- the cached artifact must be transformed or unpacked because the required
  evidence cannot otherwise be inspected;
- the native tool requires an explicit output location for the operation.

Before staging anything, check whether directly readable source files,
documentation, metadata, archives or binaries already exist in the resolved
cache location.

For example, if a NuGet cache directory already contains the exact
`Microsoft.EntityFrameworkCore.xml` required for API inspection, read that file
directly rather than extracting the matching `.nupkg` into workspace staging.

## Toolchain-generated resolution metadata

Native dependency-resolution commands may create normal build metadata inside a
repository when that is required to establish the resolved dependency graph.

Examples include:

- `.NET` `obj/project.assets.json`;
- Maven/Gradle generated resolution/build metadata;
- equivalent ecosystem-specific files created by the native toolchain.

Such files are tolerated build-tool side effects, not dependency-inspection
staging. They must not be used as a general-purpose location for copied or
downloaded inspection artifacts.

The agent should avoid generating build metadata when existing resolution
evidence is already sufficient, but may allow the native toolchain to create it
when necessary to answer the question accurately.

## Critical contract-strength rule

Do not derive a stronger runtime or quantitative guarantee than the inspected
API contract actually states.

For example:

> `SaveChangesAsync` returns the number of state entries written to the database.

does not by itself prove:

> one logical insert always returns exactly `1`.

If a stronger conclusion depends on model shape, cascading behavior, provider
semantics, generated values, interceptors or other runtime conditions, retain
that qualification unless those conditions were directly verified.

Likewise, statements about generated database values, identity propagation or
provider-specific behavior must remain explicitly qualified unless the exact
provider/API behavior was inspected.

## Critical unresolved-version wording rule

Do not soften an unverified resolved-version claim with phrases such as:

- "strong evidence that this is the resolved version";
- "very likely the effective version";
- "the build probably uses this version";
- equivalent wording.

If resolution has not been independently verified, keep the boundary explicit
everywhere in the answer:

- declared version: `<version>`;
- cached artifact inspected: `<version>`;
- resolved version: not independently confirmed.

Do not let later prose, summaries or conclusions implicitly promote that version
to resolved/effective merely because the declared and cached versions match.

## Critical provider-specific evidence rule

Do not infer provider-specific runtime behavior from core-library API evidence.

If a conclusion depends on a concrete provider, runtime, adapter or backend
implementation, inspect provider-specific evidence before presenting the behavior
as confirmed.

Examples include:

- EF Core SQL Server identity/HiLo/value-generation behavior;
- Hibernate dialect/provider behavior;
- database-driver-specific generated-value handling;
- npm/Yarn/pnpm runtime or lifecycle behavior beyond the inspected package API;
- framework adapter behavior that is not defined by the core package contract.

If provider-specific evidence is not inspected, mark the conclusion as
unverified/provider-dependent.

## Critical verification-completion rule

Do not offer optional follow-up verification for evidence that is required to
support a claim already made in the current answer.

If a claim requires additional verification, choose one of two paths:

1. perform the verification during the current analysis, invoking shell commands
   directly and relying on OpenCode's native Bash permission system when needed;
2. weaken the claim so that it accurately reflects the evidence already
   available.

Do not end with menus such as:

- "If you want, I can verify the provider";
- "Choose A or B";
- "Tell me whether to run restore";
- "I can confirm this with another command if you prefer";

when that verification is necessary to justify the preceding conclusion.

Optional follow-up suggestions are acceptable only for genuinely additional
analysis that is not required to support the answer already given.

## Completion discipline

When the user's requested dependency analysis is complete, stop.

Do not append optional follow-up menus, alternative investigation branches or
questions asking which additional analysis to perform unless the user explicitly
asked for alternatives, next steps or further exploration.

Avoid endings such as:

- "If you want, I can...";
- "Choose A or B";
- "Do you want me to proceed?";
- "I can also inspect...";
- "Tell me which additional check you prefer."

If additional verification is required to support the current answer, perform it
during the current analysis or weaken the claim according to the evidence rules
above.

If additional verification is merely optional and not required by the user's
request, omit it from the final answer.


## Critical evidence-strength rule

Never present evidence as stronger than it actually is.

A declared dependency version plus a matching artifact in a local cache does
not prove that the repository resolves that version.

Unless a lockfile, generated resolution metadata, effective dependency tree or
equivalent native-tool output confirms the version, report the facts separately,
for example:

- declared version: `9.0.5`;
- cached artifact inspected: `9.0.5`;
- resolved version: not independently confirmed.

Do not use terms such as `resolved`, `confirmed`, `guaranteed`, `proves` or
equivalent wording unless the cited evidence directly supports that strength of
claim.

Never upgrade an inference into a confirmed finding in the final answer. If the
analysis establishes only that a behavior is likely, expected or reasonable,
the final conclusion must retain the same uncertainty.

Before making a behavioral claim from broad documentation searches, locate
evidence for the exact API/member or implementation path involved whenever
practical. Generic mentions of a concept elsewhere in package documentation do
not confirm the behavior of the API under analysis.

A behavior may be described as confirmed only when directly supported by
inspected evidence such as:

- source code for the relevant implementation;
- binary/assembly metadata that establishes the behavior in question;
- documentation for the exact API/member;
- lock/resolution metadata for dependency-version claims;
- equivalent authoritative local evidence.

If direct evidence cannot be found, state the remaining uncertainty explicitly.

## Evidence discipline

Keep conclusions within the evidence actually inspected. If dependency
inspection reveals an unrelated anomaly or potential runtime problem, distinguish
the observation from a confirmed runtime conclusion. Inspect the relevant wiring,
registration or configuration before claiming runtime behavior; otherwise state
the uncertainty explicitly and keep the observation concise.

For example, finding a method that throws `NotImplementedException` does not by
itself prove that the method is reached at runtime. Verify dependency injection
or other runtime wiring before making that claim.

### Maven inspection flow

For Maven repositories:

1. establish the dependency and exact resolved version from repository/toolchain
   resolution evidence;
2. derive the corresponding location in the local Maven repository;
3. inspect the artifact in `~/.m2/repository` in place when it already exists;
4. only if the required artifact/source artifact is missing, invoke the narrowest
   Maven retrieval command;
5. direct any artifact intentionally copied for inspection to
   `.opencode/.tmp/dependencies/maven/`, never to `target/` or another repository
   directory;
6. invoke Maven directly and let OpenCode's native Bash permission system handle
   any approval dialog.

Do not stop before step 6 to ask the user for conversational approval.


## Workspace-local staging

Use `.opencode/.tmp/dependencies/` as the canonical staging area for temporary
dependency artifacts created after approval.

Suggested ecosystem subdirectories include:

- `.opencode/.tmp/dependencies/npm/`;
- `.opencode/.tmp/dependencies/python/`;
- `.opencode/.tmp/dependencies/maven/`;
- `.opencode/.tmp/dependencies/nuget/`;
- `.opencode/.tmp/dependencies/go/`;
- `.opencode/.tmp/dependencies/cargo/`.

Do not extract or materialize dependency contents inside `repositories/`. Avoid
external temporary directories for command output when a workspace-local staging
destination can be supplied. Package-manager caches that are already populated
may still be inspected read-only when the current permission model allows it.

## Ecosystem guidance

### npm / Yarn / pnpm

Respect the package manager selected by repository metadata and lockfiles. Check
`node_modules` and available local cache evidence before attempting retrieval.

For npm, a constrained retrieval such as the following is appropriate when the
exact version is known:

```text
npm pack <package>@<exact-version> --ignore-scripts --pack-destination .opencode/.tmp/dependencies/npm
```

Invoke the command normally; OpenCode's native Bash permission policy decides whether it may run. Keep `--ignore-scripts`; never use bare
`npm pack`, and do not substitute `npm install`, `npm ci`, `npm update`,
`npm run`, `npm exec` or `npx` merely to inspect a dependency.

Yarn and pnpm retrieval use the same native Bash permission boundary. Prefer narrowly scoped
artifact retrieval over full project installation when their tooling supports it.

### Python

Respect the package/environment strategy declared by the repository. Prefer an
already-installed distribution or local cache first.

When an exact version is known and a wheel is sufficient, a constrained command
may be proposed:

```text
python -m pip download <package>==<exact-version> --only-binary=:all: --no-deps --dest .opencode/.tmp/dependencies/python
```

Invoke it through the normal Bash tool and let OpenCode enforce its native permission boundary. Keep `--only-binary=:all:` and `--no-deps` so
the command does not fall back to source-distribution build hooks or resolve the
whole dependency graph. Inspect the downloaded wheel without importing or
installing it.

### Maven / Gradle

Use `pom.xml`, Gradle metadata, lock/dependency information and local caches
first. Prefer repository wrappers when they exist.

Commands that resolve or download Maven/Gradle artifacts must be invoked through the normal Bash tool; OpenCode handles approval.
Project/plugin evaluation may execute code, so describe that possibility before
running the command. Avoid full build/test lifecycle commands when a narrower
dependency-oriented command is sufficient.

### .NET / NuGet

Use project files, lock metadata and the global NuGet package cache first. Remote
package retrieval or `dotnet restore` uses the native Bash permission boundary. Prefer narrowly scoped
package acquisition into `.opencode/.tmp/dependencies/nuget/` when possible; do
not use `dotnet add package` for inspection.

### Go

Use `go.mod`, `go.sum` and the module cache first. Commands such as
`go mod download` or other module retrieval must go through the native Bash permission boundary because they may
contact remote sources and may affect module/workspace state depending on context.
Do not use `go get` for read-only inspection.

### Rust / Cargo

Use `Cargo.toml`, `Cargo.lock` and existing Cargo caches first. `cargo fetch` and
other retrieval/resolution commands use the native Bash permission boundary. Builds and tests are not
dependency-inspection substitutes.

## Command safety examples

Do not choose generic commands such as these merely for dependency inspection:

- `mvn package`, `mvn install`, `mvn test`, Maven dependency goals not explicitly
  validated by this skill;
- `gradle build`, `gradlew build` or arbitrary Gradle tasks;
- `npm install`, `npm ci`, `npm update`, `npm run`, `npm exec`, `npx`;
- `yarn install`, `yarn run`, `pnpm install`, `pnpm run`;
- `dotnet restore`, `dotnet build`, `dotnet test`, `dotnet run`;
- `pip install`, source-distribution builds or environment mutation;
- `go get`, `go mod download` from the repository;
- `cargo fetch`, `cargo build`, `cargo test`;
- publication, deployment or release commands in any ecosystem.

When a shell command is necessary, invoke the safest appropriate command directly and let OpenCode present any required permission dialog. Do not add a conversational pre-approval step and do not try a different package manager merely to bypass a denial.

## Network boundary

Do not use public-web tools or generic HTTP clients for dependency research.

Native package-manager operations permitted by OpenCode may contact registries
configured by the repository or local development environment. Treat this as
native dependency resolution, not general web research.

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
- toolchain and retrieval state used (`local inspection` or `approval required`);
- local artifact, cache path, source archive, type declaration or binary
  metadata inspected;
- whether the evidence came from source, declarations or compiled metadata;
- limitations or unresolved information.

Keep workspace source evidence and external dependency evidence distinguishable.
