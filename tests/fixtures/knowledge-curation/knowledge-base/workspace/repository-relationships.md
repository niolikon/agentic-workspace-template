# Repository relationships (workspace-level)

This document records relationships and notable cross-repository evidence discovered
during initialization. Evidence paths are workspace-relative.


Detected submodule / orchestrator relationships

- TaskBoard.Zone.Boot (repositories/TaskBoard.Zone.Boot) declares the following submodules in `.gitmodules`:
  - TaskBoard.Authenticator.Boot → repositories/TaskBoard.Zone.Boot/TaskBoard.Authenticator.Boot (pinned commit in inventory)
  - TaskBoard.Framework.Boot → repositories/TaskBoard.Zone.Boot/TaskBoard.Framework.Boot
  - TaskBoard.Service.Boot → repositories/TaskBoard.Zone.Boot/TaskBoard.Service.Boot
  - TaskBoard.App.Ng → repositories/TaskBoard.Zone.Boot/TaskBoard.App.Ng
  - TaskBoard.DropStack.Boot → repositories/TaskBoard.Zone.Boot/TaskBoard.DropStack.Boot

  Evidence: repositories/TaskBoard.Zone.Boot/.gitmodules and repository inventory.


Compile-time relationships observed

- TaskBoard.Service.Boot (Java/Maven) declares a dependency on `TaskBoard.Framework.Boot` in its `pom.xml` (compile-time Maven dependency).
  Evidence: repositories/TaskBoard.Service.Boot/pom.xml (dependency: com.github.niolikon:TaskBoard.Framework.Boot).

- TaskBoard.Service.Core (dotnet) projects reference internal projects and use EF Core; references are local within the solution.
  Evidence: repositories/TaskBoard.Service.Core/TaskBoard.Service.Core.sln and project references under `src/`.

Runtime / orchestration note

- The orchestrator (`TaskBoard.Zone.Boot`) includes the Java Spring Boot service `TaskBoard.Service.Boot` as a submodule and deploys it in docker-compose. Therefore `TaskBoard.Service.Boot` is treated as the primary runtime implementation for the composed environment.
  Evidence: repositories/TaskBoard.Zone.Boot/.gitmodules and repositories/TaskBoard.Zone.Boot/docker-compose.yml.

- `TaskBoard.Service.Core` is present in the workspace as a .NET implementation of similar APIs but is not included as a submodule in the orchestrator. It is therefore considered an alternate or standalone implementation rather than the orchestrated primary runtime.
  Evidence: absence of a `TaskBoard.Service.Core` submodule entry in `repositories/TaskBoard.Zone.Boot/.gitmodules` and presence of `repositories/TaskBoard.Service.Core/` in the workspace inventory.

Probable runtime integrations

- Frontend (TaskBoard.App.Ng) —> Backend API(s): The Angular project includes standard scripts and the Zone orchestrator README mentions the frontend talking to `BACKEND_BASEURL` (repositories/TaskBoard.App.Ng/package.json, repositories/TaskBoard.Zone.Boot/README.md).

- Zone.Boot docker-compose likely deploys multiple services (TaskBoard.Service.Boot, Keycloak, reverse-proxy APISIX, MinIO, Mongo/Postgres). Evidence: repositories/TaskBoard.Zone.Boot/docker-compose.yml and submodule composition.

Duplicates and canonicalization

The inventory contains duplicate logical checkouts (the same remote appears at multiple paths). This initialization created one canonical repository directory per logical repository and recorded alternate checkout paths in per-repository overviews.

Unresolved relationships

- Direct runtime integration evidence (e.g., explicit HTTP client base URLs or OpenAPI contracts) tying TaskBoard.App.Ng to a particular API implementation exists in the orchestrator README and docker-compose but not as a single machine-readable contract. Cross-repository flows are therefore classified as probable where only one side is explicit.
