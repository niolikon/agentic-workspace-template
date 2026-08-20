# TaskBoard.Service.Core — data flows (repository-local)

Principal data object: Todo

- Source representations:
  - HTTP payloads (TodoDto) received by controllers (`src/WebAPI/Controllers/TodoController.cs`)
  - Domain entity (`Domain/Entities/Todo.cs`)
  - Persistence representation (EF Core table `Todos` defined by migrations)

Transformations and movement

- Incoming HTTP JSON -> TodoDto (controller model binding)
- TodoDto -> Domain entity via `ITodoMapper` (`src/Application/Todos/Mappings/TodoMapper.cs`)
- Domain entity persisted/queried via EF Core `DbContext` (`src/Infrastructure/Persistence/ApplicationDbContext.cs`) into SQL table `Todos` (migrations in `src/Infrastructure/Migrations`).
- Outbound responses: domain entity -> TodoDto -> HTTP JSON response.

Evidence

- DTOs: repositories/TaskBoard.Service.Core/src/Application/Todos/DTOs/TodoDto.cs
- Mapper: repositories/TaskBoard.Service.Core/src/Application/Todos/Mappings/TodoMapper.cs
- Persistence: repositories/TaskBoard.Service.Core/src/Infrastructure/Persistence/ApplicationDbContext.cs and migrations

Confidence: High for the internal flow; cross-repository data movement (e.g., frontend -> this API) is probable and recorded at workspace level.
