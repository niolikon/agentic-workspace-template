# Unit-test declarative assertion guideline

## TEST-003 — Unit tests should use declarative assertions

- **Severity**: warning
- **Scope**: test code
- **Repositories**: *
- **Applies to**: Java, C#, TypeScript
- **Rule**: Assertions should express the expected state or behavior declaratively using the assertion facilities or fluent assertion library already adopted by the project, rather than reproducing comparison logic imperatively inside the test.
- **Rationale**: Declarative assertions make intent clearer and usually produce more useful failure diagnostics.
- **Exceptions**: Domain-specific verification that cannot be expressed clearly with the available assertion API may use a dedicated assertion helper or matcher.
