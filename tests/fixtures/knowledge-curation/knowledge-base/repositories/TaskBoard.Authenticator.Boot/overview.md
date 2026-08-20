# TaskBoard.Authenticator.Boot — overview

Repository path: repositories/TaskBoard.Authenticator.Boot

Purpose

Authentication/authorization support for the platform. Contains Keycloak realm export and configuration used by the orchestrator.

Role

- Identity provider integration (Keycloak) and security configuration for the system.

Technology and build system

- Java / Spring Boot (Maven) — evidence: `pom.xml` in the submodule checkout under `repositories/TaskBoard.Zone.Boot/TaskBoard.Authenticator.Boot`.

Primary evidence

- Keycloak realm export: `repositories/TaskBoard.Zone.Boot/config/keycloak/realm-export.json`
- Orchestrator README documents Keycloak integration.

Status

- Repository inspected at manifest and configuration level. Orchestrator composes Keycloak and related configuration.
