# Architecture

This document records the main architectural and user-experience
decisions of the agentic workspace template. It is intentionally concise
and focuses on durable rules rather than implementation details.

## Core principles

1.  **The workspace is the system boundary.** Project repositories,
    documents, trainings, notes and generated knowledge live under a
    common workspace root.
2.  **Local workspace configuration takes precedence.** OpenCode is
    expected to run from the workspace root so project-specific agents,
    commands, skills and configuration can override broader defaults.
3.  **Remote models are replaceable providers.** Agents should not
    depend on a specific provider or model unless explicitly configured.
    Provider selection remains an operational choice.
4.  **Agents have distinct responsibilities.** `ask` retrieves and
    explains, `coding` analyses and modifies code within its
    permissions, and `knowledge` generates and maintains the knowledge
    base.
5.  **Commands orchestrate workflows; skills define reusable methods.**
    Commands decide which phases must run. Skills describe how a
    particular type of analysis or operation should be performed.
6.  **Deterministic tools are preferred for deterministic facts.**
    Repository discovery must use the dedicated `repository_inventory`
    tool rather than relying on LLM-driven filesystem exploration.

## Knowledge architecture

7.  **The knowledge base is Markdown-first.** Generated knowledge must
    remain directly browsable from the filesystem and suitable for
    Git-based or Markdown-based documentation viewers.
8.  **Workspace and repository knowledge are separated.**
    Repository-specific information belongs under
    `knowledge-base/repositories/<repository>/`; cross-repository and
    system-level information belongs under `knowledge-base/workspace/`.
9.  **Every canonical repository has independent dignity.** A repository
    is analysed because it belongs to the workspace, not because it is
    referenced by an orchestrator or another repository.
10. **Duplicate checkouts produce one logical knowledge
    representation.** Multiple workspace paths for the same logical
    repository are correlated and represented by one canonical knowledge
    directory.
11. **Orchestration is distinct from dependency and runtime
    communication.** Git submodules and version pinning describe
    composition/orchestration and must not by themselves be interpreted
    as compile-time or runtime dependencies.
12. **Repository-local behaviour is documented locally.** Components,
    execution flows, data flows and business rules specific to one
    repository belong in that repository's knowledge directory.
13. **Cross-repository behaviour is reconciled at workspace level.**
    Confirmed interactions discovered from repository-local analysis are
    reconciled into workspace execution flows, data flows and
    relationships.
14. **Business rules are first-class knowledge.** Domain invariants,
    lifecycle rules, state transitions, validation constraints,
    idempotency, compensation and other evidence-backed behavioural
    rules should be captured explicitly when meaningful.
15. **Architecture is inferred only after sufficient evidence exists.**
    Architectural and development patterns must be supported by
    repository and relationship evidence; familiar patterns must never
    be guessed from naming or technology alone.
16. **Knowledge updates are incremental.** Existing knowledge should be
    updated only where affected instead of regenerating the entire
    knowledge base whenever possible.
17. **Existing knowledge must not be weakened.** Updates must not
    replace specific, evidence-backed information with less precise or
    less supported descriptions.
18. **Knowledge quality matters more than document count.** Prefer a
    smaller set of useful, focused documents over shallow documentation
    of every possible topic. Overviews summarize and link rather than
    duplicate detail.
19. **Knowledge curation is source-independent by default.** Curation improves
    the existing knowledge base through consolidation, reorganization and link
    repair without reopening primary sources unless source validation is
    explicitly requested. Evidence references are preserved during curation.

## Evidence and safety

20. **Claims must be evidence-backed.** Confirmed facts must be
    traceable to workspace-relative source paths. Inferences and
    unresolved questions must be clearly distinguished from confirmed
    facts.
21. **Source material is read-only for knowledge workflows.** Knowledge
    generation may inspect repositories and project material but may
    write only under `knowledge-base/`.
22. **Sensitive material is outside normal analysis scope.** Agents must
    not inspect credentials, private keys, production dumps, customer
    exports or personal-data exports.
23. **Public web access is disabled for workspace reasoning.** Project
    knowledge should be derived from local workspace evidence unless a
    different workflow explicitly provides external sources.

## User experience and autonomous execution

24. **A requested workflow implicitly authorizes its permitted read-only
    work.** Agents must not repeatedly ask for confirmation before
    reading workspace files that their configured permissions already
    allow them to inspect.
25. **Progress milestones are not completion conditions.** Inventory
    creation, repository overviews or completion of one repository are
    intermediate results. An agent must continue while required workflow
    phases remain.
26. **Agents choose the next analysis step autonomously.** During a
    complete workflow, agents should select the next repository and
    phase themselves instead of repeatedly asking the user what to
    analyse next.
27. **Confirmation is reserved for real boundaries.** User intervention
    should be requested only when required by permissions, missing
    information that cannot be derived locally, an actual blocker, or an
    operation whose impact requires explicit approval.
28. **Long workflows use explicit progress tracking.** Multi-repository
    or multi-phase work should maintain a task list and mark work
    complete incrementally rather than losing or recreating progress.
29. **Final responses are summaries, not duplicate documentation.** Once
    knowledge has been persisted, conversational output should report
    coverage, changed files, major findings, blockers and incomplete
    work without reproducing the generated documents.
30. **Do not propose optional follow-up work before the requested
    workflow is complete.** Agents should finish the work already
    implied by the command before asking what the user wants to do next.
31. **Completion is evidence-based.** A workflow is complete only when
    every applicable repository and analysis phase has produced
    knowledge, been explicitly assessed as not applicable, or been
    blocked for a documented reason.


## Native dependency evidence

Native toolchains are local evidence sources for questions that cannot be
answered from workspace knowledge, manifests or repository source alone. The
`ask` agent may use the build system or package manager selected by repository
evidence to inspect resolved external dependencies.

This capability is demand-driven and preserves the read-only workspace model:
normal external package-cache writes may occur during approved dependency
resolution, but repository files must not be intentionally modified. Commands
that may execute project-defined build logic, lifecycle hooks or restore/install
operations remain behind the Bash approval boundary. Public-web research is not
used as a substitute for native dependency resolution.


## Dependency inspection staging

Approved dependency retrieval uses the workspace-local
`.opencode/.tmp/dependencies/` staging area. Retrieved artifacts are ephemeral,
Git-ignored and kept outside `repositories/`. This allows the `ask` agent to
inspect exact dependency artifacts without granting access to operating-system
temporary directories or weakening `external_directory: deny`.

### Dependency evidence boundaries

Dependency caches are local evidence stores, not dependency-resolution
authorities. Cached artifacts may be inspected in place, while the version
actually resolved by a repository must come from lockfiles, generated resolution
metadata, dependency-management configuration or native toolchain output.
`.opencode/.tmp/dependencies/` is reserved for artifacts intentionally
materialized for analysis.

Unrelated anomalies discovered during dependency inspection remain observations
until their relevant runtime wiring or configuration has been verified.


### Shell approval ownership

Agents never implement shell-command approval conversationally. They invoke the
required Bash command and OpenCode's native permission layer owns the approval
decision and user interaction.

Artifacts materialized solely for dependency inspection must be staged under
`.opencode/.tmp/dependencies/<ecosystem>/`; repository-local build/output
directories are not valid inspection staging areas.


### Evidence strength

Agent conclusions must preserve the strength of their supporting evidence.
Manifest declarations, cache contents, resolution metadata, exact API
documentation and implementation source are distinct evidence classes and must
not be conflated. Inferences remain explicitly qualified until direct evidence
supports a stronger conclusion.


### Cache-first dependency inspection

Resolved artifacts already available in package-manager caches are inspected in
place whenever they expose the required evidence. Workspace staging is reserved
for retrieval or transformations that are actually necessary.

Native toolchains may create ordinary resolution/build metadata such as
`obj/project.assets.json`; these files are tolerated build side effects and are
not inspection staging areas.

API contracts must not be promoted into stronger quantitative or runtime
guarantees without direct supporting evidence.


### Local-source short circuit

Dependency inspection stops at the earliest sufficient local evidence. Cached
source artifacts take precedence over retrieval. Manifest declarations and cache
contents remain separate from resolved-version evidence, and failed retrieval
commands trigger re-evaluation of local evidence before any retry.


### Provider and resolution evidence boundaries

Unverified dependency resolution remains explicitly unconfirmed even when a
matching artifact exists in a local cache. Provider-specific runtime behavior
requires provider-specific evidence; core-library contracts alone are
insufficient. Verification needed to support a current claim is completed in the
same analysis or the claim is weakened rather than deferred to an optional
follow-up.


### Completion discipline

Once a requested dependency analysis is complete, agents stop rather than
appending optional investigation menus. Additional verification is performed
only when required to support the current answer or explicitly requested by the
user.

