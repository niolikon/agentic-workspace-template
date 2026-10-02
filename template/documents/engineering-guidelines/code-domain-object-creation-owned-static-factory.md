# Owned domain object creation guideline

## CODE-001 — Centralize owned domain object creation in the domain type

- **Severity**: warning
- **Scope**: source code, test code
- **Repositories**: *
- **Applies to**: object-oriented languages
- **Rule**: When the project owns a domain type, code should avoid scattering utility methods whose only purpose is constructing that type. Prefer a creation API owned by the domain type, such as a static `of(parameter1, parameter2, ...)` factory when appropriate, and reuse it from callers.
- **Rationale**: Keeping creation semantics with the owned type centralizes invariants and defaults, reduces duplicated construction logic and makes callers easier to understand.
- **Exceptions**: Complex staged construction, framework constraints or intentionally external factories/builders may justify a different creation pattern when that pattern has a clear domain or architectural purpose.
