# Provider-neutral review evidence fixture validation

**Agent:** Ask

## Prompt

```text
Validate the deterministic review-input fixtures under
`tests/fixtures/review-evidence-model/` against the canonical provider-neutral review
evidence contract. Do not modify any file and do not use public web or live provider
access.

Before inspecting fixture contents, load the specialized capability that owns the review
evidence contract. Use supporting evidence/workspace capabilities only when needed.

Inspect every `case-*.json` fixture independently. For each case report:

- `valid`, `valid-with-evidence-boundaries`, `invalid`, or `contract-gap`;
- the exact invariant(s) that determine the classification;
- which evidence states constrain downstream review, if any;
- whether work-item, change-request, repository/ref and source identities remain
  traceable;
- whether ordinary review reasoning would need provider-specific branching;
- whether any normalized field contains sensitive transport material.

Do not infer missing values and do not repair malformed fixtures. Treat partial,
ambiguous and unavailable evidence according to their explicit semantics rather than as
validation failures when the surrounding ReviewInput remains structurally valid.

After evaluating all fixtures:

1. compare cases that use different providers and state whether their canonical semantics
   can be consumed without provider-specific branching;
2. compare the single-change and multi-change cases and verify that change-request
   attribution is preserved independently;
3. identify any case whose expected validity cannot be decided from the current contract
   because the model leaves a structural rule unspecified;
4. identify any normalized identity field whose value cannot be bound unambiguously to
   its provenance;
5. report any gap in the contract itself separately from defects in a fixture.

Keep the analysis read-only. Cite fixture paths and the relevant sections of the loaded
capability for each material conclusion.
```

## Expected behavior

- Loads `review-evidence-model` before reading fixture content.
- Does not access GitHub, GitLab, Bitbucket, Jira or Azure DevOps.
- Classifies explicit `partial`, `ambiguous` and `unavailable` states as evidence
  boundaries rather than automatically invalidating the whole ReviewInput.
- Rejects structural normalization errors rather than guessing repairs.
- Detects unsafe secret-bearing normalized evidence without reproducing the synthetic
  secret value in its final response.
- Keeps conclusions traceable to individual fixture files and change requests.
- Uses `contract-gap` when the fixture exposes a material invariant that the current model does not define strongly enough to classify deterministically.
- Reports contract gaps independently from fixture errors.
- Does not modify files.
