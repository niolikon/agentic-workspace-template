# Failure-handling guideline

## CODE-004 — Failures should not be silently suppressed

- **Severity**: warning
- **Scope**: source code, test code
- **Repositories**: *
- **Applies to**: *
- **Rule**: Code should not catch, discard or ignore failures without an explicit behavior that makes the decision understandable, such as recovery, translation, propagation or appropriate diagnostic handling.
- **Rationale**: Silent failure handling hides defects and operational problems and makes incorrect behavior difficult to diagnose.
- **Exceptions**: Best-effort operations may intentionally ignore a failure when the behavior is part of the documented contract and suppressing it cannot hide failure of the primary operation.
