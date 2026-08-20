# Orchestration and deployment overview

Orchestrator repository: TaskBoard.Zone.Boot (repositories/TaskBoard.Zone.Boot)

Summary

- TaskBoard.Zone.Boot composes multiple submodules and contains artifacts used to deploy the platform with Docker Compose. Key deployment artefacts include:
  - `repositories/TaskBoard.Zone.Boot/docker-compose.yml`
  - submodule composition as described in `repositories/TaskBoard.Zone.Boot/.gitmodules`
  - environment example and `.env` (`repositories/TaskBoard.Zone.Boot/.env`, README)

Submodules (as orchestrated)

- TaskBoard.Authenticator.Boot — identity provider integration (Keycloak config present under `config/keycloak/`).
- TaskBoard.Framework.Boot — shared framework components used by Java services (tests, security, integrations).
- TaskBoard.Service.Boot — Java Spring Boot service (service code and Dockerfile present).
- TaskBoard.App.Ng — Angular frontend served as part of deployment.
- TaskBoard.DropStack.Boot — auxiliary stack including storage (MinIO), DB initialisation scripts, etc.

Deployment pattern (observed)

- The orchestrator prepares a local environment using Docker Compose to run:
  - backend services (Java Spring Boot applications) built from the submodules' Dockerfiles;
  - Keycloak for authentication (realm-export.json present under `config/keycloak`);
  - APISIX reverse-proxy configuration under `config/apisix`;
  - supporting infrastructure (MinIO, Mongo, Postgres initialisation scripts under `config/*`).

Evidence

- repositories/TaskBoard.Zone.Boot/docker-compose.yml
- repositories/TaskBoard.Zone.Boot/.gitmodules
- repositories/TaskBoard.Zone.Boot/config/*
- repositories/TaskBoard.Zone.Boot/TaskBoard.Service.Boot/Dockerfile
- repositories/TaskBoard.Zone.Boot/TaskBoard.App.Ng (frontend submodule)

Notes and limitations


- The orchestrator pins specific commits for its submodules (see repository inventory). This initialization documents the pinning in per-repository overview pages rather than repeating all pinned commits here.
- The docker-compose file is the primary deployment evidence in the workspace. No Kubernetes manifests were found during the inventory.

Primary runtime selection

- The orchestrator includes and deploys the Java Spring Boot backend (`TaskBoard.Service.Boot`) as the primary service implementation in the composed environment. Evidence: `repositories/TaskBoard.Zone.Boot/.gitmodules` and `repositories/TaskBoard.Zone.Boot/docker-compose.yml` referencing the Java service submodule and its Dockerfile (`repositories/TaskBoard.Zone.Boot/TaskBoard.Service.Boot/Dockerfile`).
- The .NET implementation (`TaskBoard.Service.Core`) is present in the workspace but is not included in the orchestrator composition. It remains documented as an alternative or standalone implementation.
