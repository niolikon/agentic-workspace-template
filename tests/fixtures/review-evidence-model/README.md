# Review evidence model validation fixtures

These fixtures are deterministic, synthetic review inputs for manual validation of
`review-evidence-model`. They represent the provider-neutral side of the normalization
boundary; they are not captured provider API responses and do not exercise live provider
connectivity.

All hosts use reserved/example-style test names and all identifiers are synthetic. Any
credential-like marker exists only to validate that secret-bearing normalized evidence is
rejected or reported as unsafe; it is not a real credential.

Run the corresponding Ask prompt in a fresh OpenCode session. The fixture file names are
intentionally neutral so the agent must derive validity and evidence boundaries from the
model rather than from the file name.
