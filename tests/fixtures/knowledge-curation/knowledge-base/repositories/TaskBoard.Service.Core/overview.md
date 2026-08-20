# TaskBoard.Service.Core — overview

Repository path: repositories/TaskBoard.Service.Core


Purpose

TaskBoard.Service.Core implements a .NET backend providing a Todo domain and
HTTP API surface (WebAPI) for CRUD operations. It contains layered projects
following a common application/domain/infrastructure pattern.

Role

- Backend service (API + domain + persistence library). Note: this repository
  is a separate .NET implementation of the Todo service and is not included in
  the orchestrator (`TaskBoard.Zone.Boot`) composition. It is documented as an
  alternate or standalone implementation — useful for comparison, testing or
  alternative deployment scenarios.

Technology and build system

- Language: C# (.NET 9 / net9.0)
- Build: .sln and .csproj projects. Evidence: `TaskBoard.Service.Core.sln`, `src/**/.csproj`.

Primary components and entry points

- WebAPI project: `src/WebAPI` — contains controllers (e.g. `Controllers/TodoController.cs`) which expose REST endpoints under `api/Todos`.
- Application layer: `src/Application` — service interfaces and mappings (e.g. `Application.Todos.ITodoService`).
- Domain layer: `src/Domain` — domain entities (e.g. `Domain/Entities/Todo.cs`).
- Infrastructure: `src/Infrastructure` — persistence (EF Core) and `TodoRepository` implementation.

Notable evidence

- Controller entrypoints: repositories/TaskBoard.Service.Core/src/WebAPI/Controllers/TodoController.cs
- Persistence and repository: repositories/TaskBoard.Service.Core/src/Infrastructure/Persistence/Repositories/TodoRepository.cs
- EF Core migrations: repositories/TaskBoard.Service.Core/src/Infrastructure/Migrations/
- Solution and projects: repositories/TaskBoard.Service.Core/TaskBoard.Service.Core.sln


Status

- Repository-local execution flows, data flows and business rules have been inspected and recorded in accompanying documents.

- Orchestration status: Not included as a submodule in `TaskBoard.Zone.Boot`; the orchestrator deploys the Java Spring Boot implementation (`TaskBoard.Service.Boot`) as the primary runtime. Evidence: absence of `TaskBoard.Service.Core` in `repositories/TaskBoard.Zone.Boot/.gitmodules` and presence of `TaskBoard.Service.Boot` in the orchestrator.
