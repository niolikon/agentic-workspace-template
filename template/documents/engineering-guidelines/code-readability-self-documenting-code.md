# Self-documenting code guideline

## CODE-002 — Code should communicate intent without explanatory comments

- **Severity**: warning
- **Scope**: source code, test code
- **Repositories**: *
- **Applies to**: *
- **Rule**: Code should favor meaningful names, clear control flow and appropriately sized abstractions so that a human reader can understand its purpose directly. Comments should be added only when necessary to explain information that cannot be expressed clearly by the code itself, especially rationale, constraints or non-obvious trade-offs.
- **Rationale**: Self-documenting code keeps implementation and explanation aligned as code evolves and reduces comments that merely restate behavior.
- **Exceptions**: Public API documentation, required legal or tooling annotations, non-obvious algorithms, interoperability constraints and important design rationale may require comments or documentation even when the implementation is readable.
