# Unit-test Given / When / Then naming guideline

## TEST-002 — Unit-test names should describe Given / When / Then behavior

- **Severity**: warning
- **Scope**: test code
- **Repositories**: *
- **Applies to**: Java, C#, TypeScript
- **Rule**: Unit-test names should express the relevant precondition, action and expected outcome using a Given / When / Then naming convention appropriate to the language and test framework.
- **Rationale**: Behavior-oriented names make the scenario and expected result understandable without reading the test implementation.
- **Exceptions**: Framework-generated, parameterized or specification-style tests whose native naming mechanism already expresses equivalent behavior clearly.
