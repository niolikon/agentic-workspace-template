# Workspace architecture analysis — TaskBoard

This architectural summary synthesises evidence from repository-local analysis and orchestrator composition.

High-level architecture

- Multi-platform microservice composition: the workspace contains multiple service implementations (Java Spring Boot and .NET services) plus an Angular frontend. The deployment is composed using Docker Compose by `TaskBoard.Zone.Boot`.
- API gateway / reverse-proxy: APISIX manifests/configuration are present under `repositories/TaskBoard.Zone.Boot/config/apisix`, indicating a gateway in front of backend services.
- Identity / Auth: Keycloak is used as the identity provider and configured via realm-export JSON; backend services are configured as OAuth2 resource servers (evidence in Java Spring Boot projects and orchestrator configuration).

Architectural patterns observed

1) Layered / Clean-separation within services (confirmed)

- Evidence: `TaskBoard.Service.Core` uses explicit separation: WebAPI (controllers) → Application (services & DTOs) → Domain (entities) → Infrastructure (persistence). Project layout and DI registrations support a layered architecture.
- Confidence: High

2) Microservice / compositional deployment (confirmed)

- Evidence: `TaskBoard.Zone.Boot` composes multiple independent services and infrastructure via Docker Compose and Git submodules. Services have their own Dockerfiles and run independently in containers.
- Confidence: High

3) API gateway and centralized auth (probable/confirmed)

- Evidence: APISIX config in orchestrator and Keycloak configuration indicate an API gateway combined with centralized authentication. Services include OAuth resource-server dependencies in Maven/Gradle/Project files.
- Confidence: Medium-High

4) Multi-technology polyglot stack (confirmed)

- Evidence: Java (Spring Boot/Maven), .NET (C#/EF Core), Angular (TypeScript). Build manifests are present for each.
- Confidence: High

Contradictions and resolved aspects

- The workspace contains both Java and .NET backend implementations; this might indicate alternative implementations or separate services. During this update the workspace decision was applied: the Java Spring Boot implementation (`TaskBoard.Service.Boot`) is treated as the primary runtime used by the orchestrator. Evidence: `repositories/TaskBoard.Zone.Boot/.gitmodules` and `repositories/TaskBoard.Zone.Boot/docker-compose.yml` include and deploy the Java service.

Open questions (remaining)

- Are there runtime message-based interactions (events) between services beyond HTTP REST and the gateway? No explicit messaging configurations were found in the initial scan.
