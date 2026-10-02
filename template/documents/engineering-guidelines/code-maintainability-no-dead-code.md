# Dead-code guideline

## CODE-003 — Do not retain dead or commented-out implementation code

- **Severity**: warning
- **Scope**: source code, test code
- **Repositories**: *
- **Applies to**: *
- **Rule**: Code that is no longer used should be removed rather than kept as commented-out implementation, obsolete branches or abandoned helpers.
- **Rationale**: Version control already preserves history; dead code increases cognitive load and can mislead maintainers about supported behavior.
- **Exceptions**: Temporarily disabled code required by a documented migration or compatibility plan may remain when its purpose and removal condition are explicit.
