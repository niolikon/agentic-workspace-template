# Workspace data flows (cross-repository)

Principal cross-repository data movements observed or inferred:


1) Todo data (frontend -> backend -> persistent store)

- Flow: User creates/edits a Todo in the Angular UI -> frontend issues HTTP request -> primary backend (Java Spring Boot: TaskBoard.Service.Boot) persists to SQL -> backend returns DTO -> frontend displays.
- Evidence:
  - Frontend: `repositories/TaskBoard.App.Ng/package.json` and orchestrator README
  - Orchestrator composition deploying the Java service: `repositories/TaskBoard.Zone.Boot/.gitmodules` and `repositories/TaskBoard.Zone.Boot/docker-compose.yml`
  - Java backend controllers and persistence under `repositories/TaskBoard.Zone.Boot/TaskBoard.Service.Boot/src/main/java/...` and Dockerfile
- Confidence: High for the primary flow in the orchestrated environment. The workspace also contains a .NET implementation (`TaskBoard.Service.Core`) which appears to be an alternate/standalone implementation; it is not part of the orchestrator composition.

2) Identity and authentication data (Keycloak realm -> services)

- Flow: Keycloak provides tokens that services validate for protected endpoints.
- Evidence: Keycloak realm export `repositories/TaskBoard.Zone.Boot/config/keycloak/realm-export.json` and Java/Spring Boot security configuration under service submodules.
- Confidence: High for presence of Keycloak and service-side OAuth resource-server configuration; mapping of specific clients and scopes should be confirmed from runtime config.
