# TaskBoard.Service.Core — persistence notes

This small document was created separately from the repository data-flow documentation and now substantially overlaps it.

Persistence flow

- Todo DTOs are mapped to domain entities before persistence.
- Domain entities are stored through EF Core using `ApplicationDbContext`.
- The persistent SQL table is `Todos`, with schema evolution represented by EF Core migrations.

Evidence

- repositories/TaskBoard.Service.Core/src/Application/Todos/Mappings/TodoMapper.cs
- repositories/TaskBoard.Service.Core/src/Infrastructure/Persistence/ApplicationDbContext.cs
- repositories/TaskBoard.Service.Core/src/Infrastructure/Persistence/Repositories/TodoRepository.cs
- repositories/TaskBoard.Service.Core/src/Infrastructure/Migrations/

Confidence: High
