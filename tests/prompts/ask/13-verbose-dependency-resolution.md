# Ask — verbose dependency resolution

## Agent

`ask`

## Purpose

Validate that `dependency-inspection` can resolve an external dependency that is
not already available locally without allowing package-manager transfer progress
to consume the analysis context.

This test specifically covers the regression where Maven download progress
prevented a framework inspection from completing, while validating the generic
output-control contract that must also apply to other dependency tools.

## Fixture

Use a disposable Maven repository whose application behavior depends on a
specific external framework implementation that cannot be established from the
repository source alone.

The fixture should:

- declare an exact or independently resolvable Spring Data JPA version;
- contain a small code path whose interpretation requires inspecting Spring Data
  JPA implementation or API evidence;
- use Maven or the Maven wrapper selected by repository evidence;
- run in a clean environment, or use a dependency/version deliberately absent
  from the effective local Maven cache before the test starts;
- allow Maven to contact its configured repositories and download the missing
  artifact when OpenCode's native Bash permission permits it;
- remain disposable so cache state can be reset between positive and failure
  variants.

Do not pre-populate the dependency being inspected. The point of this test is to
exercise actual resolution/download behavior.

## Prompt

```text
Trace what happens after this repository calls the Spring Data JPA operation in
<fixture path or method>, including the framework behavior that is not visible
in the repository source. Inspect the external dependency itself when needed and
base the answer on the resolved version actually used by this repository.
```

## Expected behavior

The agent should:

1. load `execution-flow-analysis` because the request asks for runtime behavior;
2. establish the repository, Maven toolchain and exact resolved Spring Data JPA
   version from workspace/toolchain evidence;
3. load `dependency-inspection` when repository evidence reaches the external
   framework boundary;
4. inspect an existing suitable local artifact first, but when the required
   artifact is genuinely absent, invoke a focused Maven resolution/retrieval
   command through OpenCode's native Bash permission boundary;
5. allow Maven to resolve/download the required artifact from configured
   repositories;
6. select a controlled-retrieval output profile before invoking the
   network-capable Maven command and use `--no-transfer-progress` or `-ntp`,
   preferably together with `--batch-mode` for non-interactive use;
7. avoid Maven `-q`/`--quiet` when doing so would hide the dependency result or
   other evidence needed by the inspection;
8. after the resolved version is known, immediately check the local Maven cache
   again, including matching source artifacts, before issuing any separate retrieval
   command, because the resolution step may already have materialized the evidence;
9. when a cached JAR/source JAR contains the required evidence, inspect entries
   directly with the simplest available archive mechanism and do not retrieve, copy
   or fully extract it merely for convenience;
10. retrieve only the exact missing artifact when the mandatory post-resolution
    cache check proves the required evidence absent or insufficient;
11. after a failed retrieval, re-check the cache before attempting a fallback and
    avoid equivalent retries unless a concrete diagnostic justifies them;
13. continue the analysis after dependency resolution and inspect the resolved
    dependency source, API or binary metadata needed to answer the question;
13. preserve relevant warnings and all actionable Maven failures;
14. cite both repository evidence and the external dependency evidence used;
15. leave repository source, manifests and lock/configuration files unchanged;
16. terminate after answering the requested investigation.

A typical network-capable Maven invocation should be equivalent in output
behavior to:

```text
mvn --batch-mode --no-transfer-progress <focused dependency goal and arguments>
```

The exact goal must be chosen from the evidence need. The test does not require a
specific Maven dependency-plugin goal if a narrower valid Maven query is
available.

## Positive checks

Verify that:

- Maven is actually invoked when the missing external evidence requires it;
- download/resolution is not rejected merely because network access is needed;
- normal Maven transfer lines such as `Progress (1): ...`, repeated download
  percentages or equivalent progress rendering do not dominate the Bash result;
- the requested dependency information remains visible after output control;
- after version resolution, the agent re-checks the local cache before issuing a
  separate retrieval command;
- if the resolution operation already materialized sufficient evidence, the agent
  inspects it directly and does not perform a redundant download/get/copy;
- a cached source JAR or equivalent archive is inspected in place with a simple
  direct-entry mechanism when available, instead of cycling through extraction tools;
- after one archive mechanism fails, any fallback is materially different and the
  agent stops archive-tool troubleshooting as soon as the required entry is readable;
- the agent still has enough execution context to inspect the resolved artifact
  and finish the framework analysis;
- the final conclusion distinguishes repository evidence from framework evidence;
- `git status --short` for the fixture repository remains unchanged after the
  inspection, excluding pre-existing changes.

## Generic portability check

The behavior being tested is not Maven-specific. The implementation passes this
regression only if the same command-construction policy would force controlled
output for another selected dependency ecosystem as well.

At minimum verify from the active skill/policy that a network-capable command is
never accepted solely because it is valid: the agent must first choose the
selected tool/version's safe no-progress/plain/reduced-noise mode, or use the
bounded captured fallback when native controls are unavailable or insufficient.

The fallback must preserve complete raw diagnostics in workspace-local staging,
return only the relevant bounded result to the analysis, and propagate the
original dependency command exit status.

## Failure-diagnostic variant

Run the same test with the dependency made intentionally unresolvable, for
example by using a disposable fixture version that does not exist or a test
repository configuration that returns an authentication/repository error.

Verify that output control does **not** hide the reason for failure. The agent
must retain enough diagnostics to identify the relevant condition, such as:

- artifact not found;
- repository unavailable;
- authentication/authorization failure;
- invalid Maven project configuration;
- Maven command failure.

The agent should report that dependency inspection could not be completed and
preserve explicit uncertainty rather than inventing the missing framework
behavior.

## Negative checks

The test fails if the agent:

- avoids Maven solely because the dependency is not cached locally;
- asks for conversational permission instead of invoking Bash and allowing
  OpenCode to enforce its native permission boundary;
- runs a full build/test lifecycle when a focused dependency query is sufficient;
- invokes a network-capable Maven dependency command without `-ntp` or
  `--no-transfer-progress` when the active Maven version supports it;
- uses `-q`/`--quiet` and thereby removes the dependency information required by
  the inspection;
- redirects all stderr away or filters out repository/dependency errors;
- uses a filtering pipeline whose exit status can hide Maven failure;
- repeatedly streams transfer-progress output into the analysis;
- retries the same unexpectedly verbose command unchanged instead of switching
  to stronger native output control or a bounded captured fallback;
- issues a retrieval/download command without re-checking the local cache after a
  resolution operation that may have materialized the required artifact;
- copies, renames or fully extracts an already-inspectable cached archive merely to
  work around a tool preference when direct entry inspection is available;
- cycles through `Expand-Archive`, custom PowerShell/.NET scripts, `jar`, `tar` or
  equivalent archive tools without evidence that each fallback addresses the prior
  failure;
- cycles through equivalent get/copy/restore/download commands after a failure
  without a new diagnostic that makes the next attempt materially different;
- captures output but loses the dependency command's original exit status;
- stops immediately after download instead of inspecting the resolved
  dependency;
- modifies `pom.xml`, source files, lock/configuration files or other repository
  content;
- presents unresolved framework behavior as confirmed.
