# Credential and secret handling guideline

## SEC-001 — Credentials and secrets must not be hard-coded

- **Severity**: error
- **Scope**: source code, test code, configuration, documentation
- **Repositories**: *
- **Applies to**: *
- **Rule**: Passwords, access tokens, API keys, private keys and other secrets must not be committed as hard-coded values.
- **Rationale**: Committed secrets can be exposed through source history, artifacts, logs or downstream distribution.
- **Exceptions**: Unmistakably synthetic values used only as test fixtures or documentation examples when they cannot authenticate to any real system.
