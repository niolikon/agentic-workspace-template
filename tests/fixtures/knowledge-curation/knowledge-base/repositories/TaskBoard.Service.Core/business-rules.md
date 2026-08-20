# TaskBoard.Service.Core — business and domain rules

This document lists evidence-backed domain or business rules discovered in the repository.

1) Required Todo fields and types

**Rule**
Todo entities require Title, Description, IsCompleted (bool) and DueDate.

**Evidence**
- `Domain/Entities/Todo.cs` declares required properties and default `IsCompleted = false`.

**Confidence**: High

2) Persistence operations report failure as exceptions when database rows affected < 1

**Rule**
Create/Update/Delete repository operations verify SaveChangesAsync returned affected rows; if rowsAffected < 1 an exception (e.g. EntityCouldNotBeCreatedException) is thrown.

**Trigger/Context**
Repository persistence operations in `Infrastructure/Persistence/Repositories/TodoRepository.cs`.

**Resulting behaviour**
Operations failing to affect the database surface as explicit exceptions rather than silent failures.

**Evidence**
- `Infrastructure/Persistence/Repositories/TodoRepository.cs` (checks around SaveChangesAsync and throws Application.Common.Exceptions)

**Confidence**: High

3) NotFound handling

**Rule**
Read and Delete operations that cannot find the requested entity throw an `EntityNotFoundException`.

**Evidence**
- `Infrastructure/Persistence/Repositories/TodoRepository.cs` and controller exception mapping in WebAPI.

**Confidence**: High

Notes and unresolved questions

- No repository-local rule prevents updating a completed Todo; the Update path copies `IsCompleted` from the updates DTO. If immutability of completed todos is desired it is not enforced here and therefore would be an unresolved business decision.
