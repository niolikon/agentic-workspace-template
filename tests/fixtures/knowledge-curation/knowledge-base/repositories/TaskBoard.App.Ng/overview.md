# TaskBoard.App.Ng — overview

Repository path: repositories/TaskBoard.App.Ng

Purpose

Angular frontend for the TaskBoard application. Provides UI for users to create, read, update and delete Todos.

Role

- Frontend application intended to be served (in orchestrator) and to call backend APIs.

Technology and build system

- Language: TypeScript / Angular (v19)
- Build: npm / Angular CLI (`package.json`)

Primary evidence

- `repositories/TaskBoard.App.Ng/package.json` (scripts and dependencies)
- The orchestrator README documents that the Angular frontend is served as part of the Docker Compose deployment (`repositories/TaskBoard.Zone.Boot/README.md`).


Runtime relationships (primary backend)

- The frontend is configured by the orchestrator to call the primary Java Spring Boot backend (`TaskBoard.Service.Boot`) using a `BACKEND_BASEURL` environment variable. Evidence: orchestrator README (`repositories/TaskBoard.Zone.Boot/README.md`), `repositories/TaskBoard.Zone.Boot/.env` and the inclusion of the Java service as a submodule in `repositories/TaskBoard.Zone.Boot/.gitmodules`.

Status

- Repository inspected at manifest level. No compiled output is present in the workspace. Execution flow (frontend -> HTTP API) targets the Java Spring Boot service in the orchestrated deployment.
