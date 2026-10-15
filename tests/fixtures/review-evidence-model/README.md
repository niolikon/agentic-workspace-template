# Review evidence model validation fixtures

These fixtures are deterministic, synthetic review inputs for manual validation of
`review-evidence-model`. They represent the provider-neutral side of the normalization
boundary; they are not captured provider API responses and do not exercise live provider
connectivity.

Every provenance entry identifies the synthetic acquisition backend separately
from the represented provider. The original nine cases did not acquire comments:
their comment collections explicitly record `unavailable` / `not-retrieved` rather
than inventing an empty discussion. Existing identity, evidence and safety defects
in negative cases remain intentional.

The original nine cases use reserved/example-style test hosts. Fixture URLs are
source references and do not require network access. Any
credential-like marker exists only to validate that secret-bearing normalized evidence is
rejected or reported as unsafe; it is not a real credential.

Run the corresponding Ask prompt in a fresh OpenCode session. The fixture file names are
intentionally neutral so the agent must derive validity and evidence boundaries from the
model rather than from the file name.

`case-10.json` preserves the independent harness's synthetic positive discussion
fixture (issue-56-post-validation/fixtures/valid-with-evidence-boundaries.json).
It covers known typed parent/thread references alongside unsupported relationships,
redacted comment content and unavailable author/timestamp evidence. Its complete
collection must not imply complete individual fields. Expected classification:
`valid-with-evidence-boundaries`. The independent original and its oracle are not
modified by the candidate.
