# Unit-test single-behavior guideline

## TEST-004 — Unit tests should focus on one behavior

- **Severity**: warning
- **Scope**: test code
- **Repositories**: *
- **Applies to**: *
- **Rule**: A unit test should exercise one coherent behavior or scenario and keep its assertions focused on the outcome of that behavior.
- **Rationale**: Focused tests make failures easier to diagnose and reduce accidental coupling between unrelated expectations.
- **Exceptions**: Multiple assertions that describe different facets of the same resulting state are allowed when splitting them would duplicate setup without improving diagnostic value.
