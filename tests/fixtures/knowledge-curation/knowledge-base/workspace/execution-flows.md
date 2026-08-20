# Workspace execution flows (cross-repository)

This document summarises cross-repository execution flows reconstructed from repository-local evidence and orchestrator configuration.


1) Frontend -> Backend API (confirmed primary: Java Spring Boot)

- Scope: cross-repository (TaskBoard.App.Ng -> TaskBoard.Service.Boot)
- Purpose: UI actions in the Angular frontend invoke backend REST APIs to perform Todo CRUD operations.
- Evidence:
  - Frontend project and scripts: `repositories/TaskBoard.App.Ng/package.json`
  - Orchestrator README and `.env` references to `BACKEND_BASEURL`: `repositories/TaskBoard.Zone.Boot/README.md` and `repositories/TaskBoard.Zone.Boot/.env`
  - Orchestrator submodule and docker-compose include the Java service: `repositories/TaskBoard.Zone.Boot/.gitmodules` and `repositories/TaskBoard.Zone.Boot/docker-compose.yml`
  - Backend APIs implemented in Java Spring Boot under the submodule path: `repositories/TaskBoard.Zone.Boot/TaskBoard.Service.Boot/src/main/java/.../controller` (controllers, DTOs, Dockerfile)
- Confidence: High — orchestrator composition explicitly includes and deploys the Java `TaskBoard.Service.Boot` service as the runtime backend for the composed environment. No single OpenAPI contract is present in the workspace but runtime wiring is explicit in docker-compose and submodules.

2) Orchestrator-deployed services and infrastructure

- Scope: composition-level flow (TaskBoard.Zone.Boot) — orchestrator starts Keycloak, backend services, APISIX and storage.
- Purpose: Provide authentication (Keycloak), reverse-proxying (APISIX), object storage (MinIO) and databases required by services.
- Evidence: `repositories/TaskBoard.Zone.Boot/docker-compose.yml`, `repositories/TaskBoard.Zone.Boot/config/*`, submodules as declared in `.gitmodules`.

- Confidence: High for composition; runtime interactions between services (e.g., API gateway routes) are probable but require runtime configs to confirm.

Notes

- Where only one side of a runtime integration is explicit, the relationship is recorded as probable rather than confirmed. Further confirmation requires explicit client usage, OpenAPI files, or runtime configuration linking service names to base URLs.
