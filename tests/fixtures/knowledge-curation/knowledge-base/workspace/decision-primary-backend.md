# Decision: Primary backend implementation — Java Spring Boot

Decision

- The workspace knowledge base records the Java Spring Boot service (`TaskBoard.Service.Boot`) as the primary backend implementation for the orchestrated deployment composed by `TaskBoard.Zone.Boot`.

Rationale and evidence

- `TaskBoard.Zone.Boot/.gitmodules` lists `TaskBoard.Service.Boot` as a submodule which the orchestrator includes in its composition.
- `TaskBoard.Zone.Boot/docker-compose.yml` deploys the services from the orchestrator composition and references the Java service' Dockerfile located at `TaskBoard.Zone.Boot/TaskBoard.Service.Boot/Dockerfile`.
- The orchestrator README and `.env` examples document runtime wiring (e.g., `BACKEND_BASEURL`) consistent with the Java service being the runtime target for the frontend.

Effect on knowledge base

- Workspace-level documents were updated to reflect this decision: `overview.md`, `repository-relationships.md`, `orchestration.md`, `execution-flows.md`, `data-flows.md`, and `architecture.md`.
- Repository overviews for `TaskBoard.Service.Boot`, `TaskBoard.Service.Core`, `TaskBoard.App.Ng` and `TaskBoard.Zone.Boot` were updated to reflect primary runtime selection and orchestration membership.

Notes

- `TaskBoard.Service.Core` remains documented as an alternate .NET implementation in the workspace and may be used standalone or for comparison, but it is not part of the orchestrator composition by default.
- This is a documentation-level decision applied to the knowledge base; it does not modify source repositories or their contents.

Confidence

- High: the orchestrator composition and explicit submodule inclusion provide direct evidence that the Java service is the intended orchestrated runtime.
