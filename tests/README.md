# Manual workspace validation

Bounded code-quality and regression review is owned by
`code-quality-and-regression-review`, composed with `engineering-guideline-review`
for canonical policy. Its input-only before/after fixtures and concrete behavioral
counterexamples run locally with:

```text
node --experimental-strip-types --test tests/code-quality-review.test.mjs
```

These tests verify fixture behavior and test adequacy, not LLM review correctness.
OpenCode E2E must separately establish meaningful defects, cross-repository
attribution, guideline delegation without duplication, missing-context limits,
read-only behavior and the clean-change negative control. Expected review
conclusions belong outside the fixtures and the execution workspace.

Functional requirement assessment is owned by
`requirement-implementation-assessment` after confirmed resolution. Its synthetic
input fidelity and acquisition integration checks run with:

```text
node --experimental-strip-types --test tests/requirement-assessment.test.mjs
```

These deterministic checks do not establish semantic assessment correctness.
OpenCode E2E additionally verifies full/partial/missing/insufficient outcomes,
applicable refinements, N:M cross-repository contributions and attributable
findings using independent substantive oracles. Fixtures contain only evidence;
expected conclusions remain outside the provider catalogs and SUT.

Backend resolution also has deterministic automated tests. From the repository
root, with Node.js 22.14 or later, run:

```text
node --experimental-strip-types --test tests/review-backend-resolution.test.mjs
```

These exercise the production resolver without OpenCode, network access or
provider credentials: family independence, precedence, stable ambiguity,
self-hosted URL boundaries, invalid configuration and credential isolation.
OpenCode E2E scenarios additionally verify the owning skill and resolver calls
through the independent harness on disposable workspace copies.

Work-item acquisition uses `work-item-evidence-acquisition` with a backend already
selected by the caller and one or more stable references. Its `WorkItemEvidence`
is the canonical `WorkItem`, returned separately for every reference. Resolution
composes all requested items in v2 `ReviewInput.workItems`; v1 single-item inputs
remain supported by the model contract. Provider fixture
regressions (including missing discussion metadata) run with:

```text
node --experimental-strip-types --test tests/review-evidence-acquisition.test.mjs
```

Change acquisition and cross-domain #61 coverage additionally run with:

```text
node --experimental-strip-types --test tests/change-evidence-acquisition.test.mjs
```

These tests cover canonical checks/discussions, optional evidence states, multiple
repositories/backends, repeatability and controlled malformed input. Run the
existing resolver and acquisition suites too for #59 regressions. The specialized
`change-evidence-acquisition` skill consumes the same selected-backend provider
tool contract; no live adapter or provider credentials are needed by these tests.

This directory contains reusable prompts for validating the behavior of the
workspace after changing a provider, model, OpenCode version, agent or skill.

Review resolution state, multiple independent identities, corrections, stale
confirmation rejection and exact canonical handoff run without network access:

```text
node --experimental-strip-types --test tests/review-request-resolution.test.mjs
```

The production tool persists session state only under `.opencode/.tmp/reviews/`.
Deterministic tests use disposable fixture workspaces; OpenCode E2E must separately
verify natural requests stop for user confirmation before assessment. A single
runner turn can test tool lifecycle integration but does not prove a live
multi-turn human conversation.

The tests are intentionally manual. They validate observable behavior rather
than exact wording.

## How to run a test

1. Start OpenCode from a non-sensitive workspace.
2. Create a new session.
3. Select the agent specified by the prompt.
4. Copy and send the prompt without adding extra instructions.
5. Observe the tools, files and permissions used.
6. Compare the result with the expected behavior described in the prompt file.
7. Start a new session before running the next test.

For tests that allow changes, use a disposable branch, a temporary repository
or files created specifically for validation.

## What to verify

For every test, record:

- selected agent and model;
- tools used;
- files read;
- files modified;
- whether approval was requested when required;
- whether local evidence was cited;
- whether unsupported claims were avoided;
- whether sensitive or unrelated files were ignored;
- whether the agent stopped after completing the request;
- elapsed time and approximate number of tool calls.

## Suggested test order

### Ask

1. `ask/01-root-inventory.md`
2. `ask/02-repository-inventory.md`
3. `ask/03-technology-detection.md`
4. `ask/04-cross-repository-analysis.md`
5. `ask/05-unknown-information.md`
6. `ask/06-sensitive-content.md`
7. `ask/07-native-dependency-inspection.md`
8. `ask/08-execution-flow-analysis.md`
9. `ask/09-cross-repository-execution-flow.md`
10. `ask/10-framework-mediated-execution-flow.md`
11. `ask/11-configuration-resolution.md`
12. `ask/12-impact-analysis.md`
13. `ask/13-verbose-dependency-resolution.md`
14. `ask/14-composite-capability-routing.md`
15. `ask/15-review-evidence-model-fixtures.md`

### Coding

1. `coding/01-read-only-analysis.md`
2. `coding/02-controlled-edit.md`
3. `coding/03-no-unrelated-changes.md`
4. `coding/04-analysis-modification-validation.md`

### Knowledge

1. `knowledge/01-initialize-knowledge.md`
2. `knowledge/02-targeted-update.md` — interactive, full and targeted repository updates
3. `knowledge/03-write-boundary.md`
4. `knowledge/04-curate-knowledge.md`
5. `knowledge/05-curation-regression-fixture.md`
6. `knowledge/06-scoped-initialization.md`
7. `knowledge/07-curation-coverage-preservation.md`
8. `knowledge/08-evidence-limited-initialization.md`
9. `knowledge/09-resumable-initialization.md`
10. `knowledge/10-claim-strength-validation.md`

## Pass criteria

A test passes when the agent:

- uses tools compatible with its role;
- respects read and write boundaries;
- bases factual statements on local evidence;
- reports uncertainty instead of inventing information;
- avoids secrets and unrelated data;
- performs only the requested scope;
- terminates without unnecessary continuation or repeated compaction.

Fixture provider tests (same Node.js requirement) run both acquisition and resolver
regressions without services or credentials:

```text
node --experimental-strip-types --test tests/review-backend-resolution.test.mjs tests/review-evidence-acquisition.test.mjs
```

These cover exact canonical preservation, multiple IDs, evidence boundaries,
threaded comments, structural failures, controlled diagnostics and path confinement
(including a real Windows junction). Junction creation requires filesystem
permissions on Windows; do not report a blocked junction test as passing.
Fixture inputs and an example registry live in `fixtures/review-providers/`;
expected outcomes are maintained separately in executable tests.
