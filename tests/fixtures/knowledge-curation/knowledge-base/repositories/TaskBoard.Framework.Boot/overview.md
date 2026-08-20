# TaskBoard.Framework.Boot — overview

Repository path: repositories/TaskBoard.Framework.Boot

Purpose

Java framework modules and shared utilities used by other Java-based TaskBoard components. Contains tests and Keycloak/security-related helpers.

Role

- Shared framework library for Java/Spring Boot services.

Technology and build system

- Language: Java
- Build: Maven (`pom.xml`)

Primary evidence

- `repositories/TaskBoard.Zone.Boot/TaskBoard.Framework.Boot/pom.xml` (submodule checkout)
- Tests and security helpers present under the framework submodule.

Status

- Recognised as a compile-time dependency for TaskBoard.Service.Boot (pom.xml). No standalone runtime entrypoint.
