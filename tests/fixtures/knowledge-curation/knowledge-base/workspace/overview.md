
# Workspace overview — TaskBoard

This document summarises the repositories discovered under `repositories/` and points
to repository-specific knowledge generated during initialization.

Repositories discovered (canonical logical repositories covered in this initialization):

- TaskBoard.Zone.Boot (orchestrator) — repositories/TaskBoard.Zone.Boot
- TaskBoard.Service.Boot — repositories/TaskBoard.Service.Boot (primary runtime)
- TaskBoard.Service.Core — repositories/TaskBoard.Service.Core (alternate/standalone .NET implementation)
- TaskBoard.Framework.Core — repositories/TaskBoard.Framework.Core
- TaskBoard.Framework.Boot — repositories/TaskBoard.Framework.Boot
- TaskBoard.App.Ng — repositories/TaskBoard.App.Ng
- TaskBoard.Authenticator.Boot — repositories/TaskBoard.Authenticator.Boot
- TaskBoard.DropStack.Boot — repositories/TaskBoard.DropStack.Boot

See repository overviews under `knowledge-base/repositories/` for per-repository
responsibilities, build systems and primary evidence paths.

## Repository coverage

| Repository | State | Knowledge artifact | Notes |
|---|---:|---|---|
| TaskBoard.App.Ng | analysed | repositories/TaskBoard.App.Ng/overview.md | Existing validated state. |
| TaskBoard.Authenticator.Boot | analysed | repositories/TaskBoard.Authenticator.Boot/overview.md | Existing validated state. |
| TaskBoard.DropStack.Boot | not analysed |  | Deliberately remains not analysed even though a repository overview exists. |
| TaskBoard.Framework.Boot | analysed | repositories/TaskBoard.Framework.Boot/overview.md | Existing validated state. |
| TaskBoard.Framework.Core | analysed | repositories/TaskBoard.Framework.Core/overview.md | Existing validated state. |
| TaskBoard.Service.Boot | analysed | repositories/TaskBoard.Service.Boot/overview.md | Existing validated state. |
| TaskBoard.Service.Core | partially analysed | repositories/TaskBoard.Service.Core/overview.md | Existing validated state must not be promoted by curation. |
| TaskBoard.Zone.Boot | referenced, not analysed | repositories/TaskBoard.Zone.Boot/overview.md | Existing validated state must be preserved. |

Navigation

- [Workspace architecture](./architecture-legacy.md)
- [Execution flows](./execution-flows.md)
- [Data flows](./data-flows.md)

Top-level findings

- The workspace contains a heterogenous stack: Java (Spring Boot / Maven), .NET
  (multiple projects, EF Core) and an Angular frontend. Evidence: primary manifests
  and source files referenced from repository overviews.
- The orchestrator (`TaskBoard.Zone.Boot`) composes the environment and deploys
  the Java Spring Boot implementation of the backend (TaskBoard.Service.Boot) as
  the primary runtime. The .NET implementation (`TaskBoard.Service.Core`) is
  present in the workspace but is not included as a submodule in the orchestrator.

Evidence and inventory

- The authoritative repository inventory used to drive this initialization is the
  repository inventory tool output and the discovered repository paths under `repositories/`.

Knowledge files created

- workspace-level: `repository-relationships.md`, `orchestration.md` (see folder).
- repository-level: one `overview.md` created for each canonical repository plus
  additional flow and business-rule documents for Service.Core and selected repositories.

Confidence and next steps

- Confidence: high for repository identities and primary manifests (inventory+
  manifest files). The orchestrator evidence confirms that TaskBoard.Service.Boot
  (Java) is the primary implementation in the composed deployment. See
  `knowledge-base/workspace/repository-relationships.md` and
  `knowledge-base/workspace/orchestration.md` for supporting evidence and details.
