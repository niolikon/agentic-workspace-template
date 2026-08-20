# Todo not-found behaviour

Rule

When a requested Todo cannot be found, repository read/delete operations raise `EntityNotFoundException` rather than returning a successful empty result.

Evidence

- repositories/TaskBoard.Service.Core/src/Infrastructure/Persistence/Repositories/TodoRepository.cs
- repositories/TaskBoard.Service.Core/src/WebAPI/Controllers/TodoController.cs

Confidence: High
