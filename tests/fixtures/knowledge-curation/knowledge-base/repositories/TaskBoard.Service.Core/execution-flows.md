# TaskBoard.Service.Core — execution flows (repository-local)

Flow: Todo HTTP API (repository-local)

- Scope: repository-local
- Purpose: Provide CRUD operations for Todo entities via HTTP REST API.
- Entry point: `WebAPI.Controllers.TodoController` (repositories/TaskBoard.Service.Core/src/WebAPI/Controllers/TodoController.cs)
- Input: HTTP requests with Todo DTO payloads
- Processing stages (ordered):
  1. Controller action (Create/Read/ReadAll/Update/Delete)
  2. Calls into Application service: `Application.Todos.ITodoService` / `Application.Todos.Services.TodoService`
  3. Application service maps DTOs to domain entities via mappers (e.g. `ITodoMapper`) and delegates to repository
  4. Repository (Infrastructure.Persistence.Repositories.TodoRepository) interacts with EF Core DbContext to persist or read entities
  5. Controller returns HTTP response (Created/Ok/NoContent) or raises ProblemDetails-style exceptions
- Persistence: EF Core, DbSet<Todo> and migrations under `src/Infrastructure/Migrations` (evidence).

Evidence

- Controller: repositories/TaskBoard.Service.Core/src/WebAPI/Controllers/TodoController.cs
- Service implementation: repositories/TaskBoard.Service.Core/src/Application/Todos/Services/TodoService.cs
- Repository implementation: repositories/TaskBoard.Service.Core/src/Infrastructure/Persistence/Repositories/TodoRepository.cs
- Migrations: repositories/TaskBoard.Service.Core/src/Infrastructure/Migrations/

Confidence: High — code paths are explicit and test coverage exists in the repository tests.
