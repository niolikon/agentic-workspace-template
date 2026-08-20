# TaskBoard.Service.Boot — overview

Repository path: repositories/TaskBoard.Service.Boot

Purpose

Java Spring Boot implementation of a TaskBoard service (Todo operations). The repository contains a Spring Boot application, tests, Dockerfile and a Maven build.

Role

- Primary backend service (Spring Boot) intended to be deployed by the orchestrator `TaskBoard.Zone.Boot`. The orchestrator includes this repository as a submodule and its Dockerfile is referenced by the composed deployment.

Technology and build system

- Language: Java 17
- Build: Maven (`pom.xml`)

Primary evidence and entry points

- Maven project descriptor: repositories/TaskBoard.Service.Boot/pom.xml
- Main application class: repositories/TaskBoard.Zone.Boot/TaskBoard.Service.Boot/src/main/java/com/niolikon/taskboard/TaskBoardServiceBootApplication.java (also available under top-level submodule path in Zone.Boot)
-- REST controllers and DTOs under `src/main/java/com/niolikon/taskboard/service/todo/controller` in the submodule checkout at `repositories/TaskBoard.Zone.Boot/TaskBoard.Service.Boot` (evidence).

Notable: repository contains Dockerfile and docker-compose support via the orchestrator. Evidence: `repositories/TaskBoard.Zone.Boot/.gitmodules`, `repositories/TaskBoard.Zone.Boot/docker-compose.yml` and `repositories/TaskBoard.Zone.Boot/TaskBoard.Service.Boot/Dockerfile`.

Status

-- Repository-local execution flows are present (controller -> service -> repository) and tests are included. Cross-repository runtime relationships are mediated by the orchestrator and by API surface (TaskBoard.Service.Boot is the primary backend for the composed deployment and is expected to be the target for TaskBoard.App.Ng in the orchestrated environment).

Evidence

- repositories/TaskBoard.Service.Boot/pom.xml
- repositories/TaskBoard.Zone.Boot/TaskBoard.Service.Boot/Dockerfile and controllers under the submodule path.
