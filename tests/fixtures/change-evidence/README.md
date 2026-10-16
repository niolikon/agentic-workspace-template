# Change acquisition inputs (#60 / #61)

Synthetic canonical inputs reuse the #58/#59 fixture contract without modifying
validated fixtures. `evidence.json` has two work items and changes in service/client
repositories. PR-7 adds a canonical check and partial review discussion; PR-8 has
explicit unavailable optional metadata. `other.json` represents PR-8 through an
independently selected GitLab fixture backend. No service is contacted.

Copy this directory to the same workspace-relative location and its registry to
workspace-root `review-backends.json`. Select `fixture-work`, `fixture-change` or
`fixture-change-other` explicitly. Assertions and expected outcomes belong in
tests, never in these input catalogs. Legacy fixtures remain separate regressions.
