# TaskBoard.Zone.Boot — overview (orchestrator)

Repository path: repositories/TaskBoard.Zone.Boot

Purpose

Top-level orchestrator that composes the TaskBoard deployment using Git submodules and Docker Compose. Provides configuration for Keycloak, APISIX, MinIO, database initialization and service composition.

Role

- Orchestrator / deployment composition repository.

Technology and build system

- Not an application per se. Contains Docker Compose files, submodules and configuration. Submodules are initialised inside the repository (see `.gitmodules`).

Primary evidence

- `repositories/TaskBoard.Zone.Boot/.gitmodules` — submodule declarations
- `repositories/TaskBoard.Zone.Boot/docker-compose.yml` — deployment composition
- `repositories/TaskBoard.Zone.Boot/.env` and `README.md` — deployment instructions and environment variables


Submodules (referenced)

- TaskBoard.Authenticator.Boot
- TaskBoard.Framework.Boot
- TaskBoard.Service.Boot (primary backend implementation deployed by the orchestrator)
- TaskBoard.App.Ng
- TaskBoard.DropStack.Boot

Status

- Orchestration responsibilities documented in `knowledge-base/workspace/orchestration.md`.
