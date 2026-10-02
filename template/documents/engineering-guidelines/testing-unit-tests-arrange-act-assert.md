# Unit-test Arrange / Act / Assert guideline

## TEST-001 — Unit tests should follow Arrange / Act / Assert

- **Severity**: warning
- **Scope**: test code
- **Repositories**: *
- **Applies to**: Java, C#, TypeScript
- **Rule**: Unit tests should keep setup, action and assertions clearly separated according to Arrange / Act / Assert.
- **Rationale**: A consistent test structure improves readability, reviewability and failure diagnosis.
- **Exceptions**: Trivial tests where explicit separation would add ceremony without improving readability.
