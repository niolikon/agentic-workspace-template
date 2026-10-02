---
name: engineering-guideline-review
description: Evaluate repository changes against the smallest applicable set of canonical engineering guidelines and produce traceable, evidence-backed findings
---

# Engineering guideline review

Use this skill to evaluate a repository change against the canonical engineering
rules in `documents/engineering-guidelines/`.

The skill owns guideline discovery, applicability, interpretation and finding
semantics. A higher-level review agent may establish the review target and compose
this capability with other review capabilities, but it must not duplicate or
override the policy reasoning defined here.

This capability is strictly read-only. Never modify repository source, guideline
documents or generated knowledge while performing a review.

## Review contract

Inputs are the smallest available description of the change under review:

- affected repository or repositories;
- changed files or an equivalent bounded change scope;
- relevant language, technology and artifact type when already known;
- implementation evidence already collected by the caller.

Do not require the caller to preselect engineering rules. Rule selection and
interpretation belong to this skill.

Return a concise review containing:

1. the reviewed change scope;
2. material findings, each traceable to one stable guideline rule ID;
3. a compact summary of positive compliance for applicable rules that were
   sufficiently verified;
4. applicable rules that could not be verified when that uncertainty matters;
5. any guideline conflict or scope uncertainty that prevents a stronger result.

Do not emit one verbose finding for every passing rule. Non-applicable rules are
excluded from findings rather than reported as failures or passes.

## Canonical guideline source

Treat `documents/engineering-guidelines/` as the only canonical policy source for
this review. The directory index documents rule structure, precedence, stable IDs
and authoring semantics; individual rule files contain the enforceable metadata
and normative text.

Do not copy rule policy into this skill. Interpret the guideline documents that
exist in the active workspace so that guideline changes remain data changes rather
than prompt changes.

When the guideline directory or its index is absent, do not invent replacement
rules from general engineering knowledge. Report that guideline evaluation could
not be established from the canonical source.

## Minimal guideline discovery

Discover the smallest applicable rule set before inspecting implementation in
detail.

1. establish the repositories and changed files in the review scope from the
   caller or bounded repository evidence;
2. classify changed files only as far as needed to determine guideline metadata
   applicability, such as source code, test code, configuration or documentation;
3. determine language, technology or artifact type from file paths, extensions,
   repository metadata or already-inspected content when available;
4. inspect the engineering-guideline index to establish the canonical rule format
   and available focused guideline files;
5. use guideline filenames and narrowly inspected rule metadata to identify
   candidate rules;
6. read the normative content and exceptions only for candidate rules whose
   metadata may match the reviewed change;
7. stop discovery when every changed scope is either covered by the applicable
   candidates or has no matching rule.

Do not read every guideline merely because the directory is small. Do not scan
unrelated repositories to determine whether a repository-specific rule might
exist. Applicability must come from the canonical rule metadata and the bounded
change scope.

If a guideline file contains multiple enforceable rules, evaluate each rule
independently by its own metadata and stable ID.

## Applicability

A rule is applicable only when all of its declared dimensions match the reviewed
change:

- **Scope** matches the changed artifact category;
- **Repositories** is `*` or explicitly includes the affected repository;
- **Applies to** is `*` or matches the relevant language, technology or artifact
  type;
- no documented **Exception** covers the concrete change.

Use the metadata as written. Do not broaden a language-specific rule to another
language because the underlying practice seems generally useful. Do not treat a
repository-specific rule as workspace-wide. Do not infer an undocumented
exception.

When a more specific applicable rule and a broader applicable rule address the
same concern, follow the precedence documented by the guideline index. When two
applicable rules cannot be reconciled from their documented scope and exceptions,
report the conflict and do not invent implicit precedence.

If applicability itself cannot be determined from observed evidence, keep that
rule unresolved. Do not convert uncertainty into a violation.

## Evidence acquisition

Review evidence must remain proportional to the changed scope.

Prefer, in order:

1. implementation evidence already acquired by the caller;
2. the actual changed hunks or changed files;
3. directly related local context required to interpret those changes;
4. narrowly targeted repository evidence only when a rule cannot otherwise be
   evaluated.

A textual search match is a discovery lead, not automatically a violation. Read
enough surrounding non-sensitive evidence to establish the behavior before
classifying a confirmed finding.

Do not broaden the review into unrelated pre-existing code. A repository-wide
pattern may be useful context only when the applicable guideline requires that
context or the change directly depends on it. Findings should describe the
reviewed change, not opportunistically audit the whole repository.

## Finding semantics

Classify a material result using both the guideline severity and the strength of
implementation evidence.

### `violation`

Use `violation` only when:

- the rule is applicable;
- the observed implementation contradicts the rule;
- no documented exception covers the change; and
- the evidence is direct enough to establish the contradiction.

An `error` rule normally produces a violation when these conditions are met.
Absence of evidence is never sufficient for this status.

### `warning`

Use `warning` when an applicable recommendation is not followed, or when observed
implementation raises a guideline-relevant concern that should be surfaced but
does not justify a confirmed mandatory violation.

A `warning`-severity rule normally produces a warning when direct evidence shows
that its recommendation is not followed. Keep uncertainty explicit rather than
presenting a recommendation as mandatory.

### `compliant`

Use `compliant` only when observed implementation evidence is sufficient to show
that an applicable rule is satisfied for the reviewed change. Summarize positive
compliance compactly instead of emitting repetitive per-rule findings.

### `not-verifiable`

Use `not-verifiable` when a rule is applicable or plausibly applicable but the
available safe evidence cannot establish compliance or non-compliance. State what
is missing or what review boundary prevents verification.

Do not use `not-verifiable` for clearly non-applicable rules. Omit those rules.

## Finding shape

For each material finding provide, at minimum:

- **Rule**: stable guideline rule ID;
- **Severity**: severity declared by the guideline;
- **Status**: `violation`, `warning`, `compliant` or `not-verifiable` where useful;
- **Scope**: affected repository, file or bounded change scope;
- **Explanation**: concise relationship between the rule and implementation;
- **Implementation evidence**: concrete inspected path, changed hunk, symbol or
  other directly observed evidence;
- **Guideline evidence**: canonical guideline path and the relevant rule ID;
- **Exception / uncertainty**: applicable exception, unresolved applicability or
  verification limitation when present.

Never invent line numbers, changed hunks or implementation facts that were not
observed. Preserve the stable rule ID exactly as published in the guideline.

## Unit-test guideline evaluation

For unit-test rules, first establish that the changed artifact is test code and
that its language or technology matches the rule metadata. Evaluate only the
changed tests or the smallest directly related test context needed to understand
them.

For structural rules such as Arrange / Act / Assert, Given / When / Then naming,
declarative assertions and one behavior per test:

- judge semantic structure rather than requiring literal comments or labels;
- respect framework-native and rule-specific exceptions;
- do not infer a failure from unfamiliar test syntax without inspecting enough
  local context to understand it;
- report recommendation-level deviations as warnings when the guideline severity
  is `warning`.

Do not require a repository to adopt a testing convention that the applicable
canonical guideline does not require.

## Secret-handling review

Secret checks require a stricter evidence boundary because review must not expose
or unnecessarily inspect sensitive material.

- Restrict evaluation to changed, non-sensitive source, test, configuration and
  documentation artifacts that are in review scope.
- Do not open or scan files whose purpose is to contain real secrets or local
  credentials, such as `.env` files, credential stores, private-key files,
  keystores or equivalent sensitive artifacts.
- Do not perform workspace-wide searches for secret values, tokens, passwords or
  private-key material.
- Prefer identifying risky hard-coding from the changed expression, assignment,
  configuration entry or diff context rather than searching for credential-shaped
  values elsewhere.
- When evidence suggests a hard-coded secret, report the file, symbol or
  configuration key and the kind of secret involved. Never reproduce the
  candidate secret value in the finding.
- Distinguish real-secret risk from unmistakably synthetic fixtures and examples
  according to the guideline's documented exception.
- If safe inspection cannot determine whether a suspicious value is synthetic or
  usable against a real system, classify the result as `not-verifiable` or a
  qualified warning according to the observed evidence. Do not claim a confirmed
  violation from appearance alone.

If a changed file is itself sensitive and cannot be safely inspected, report only
the verification limitation without exposing its contents.

## Exceptions and uncertainty

Evaluate documented exceptions after establishing initial applicability and before
classifying non-compliance. An exception must be supported by concrete evidence in
the reviewed change or directly related context; do not assume that an exception
applies merely because it is possible.

When required evidence is unavailable, unsafe to inspect or outside the bounded
review scope, preserve the uncertainty. State the unresolved question and use
`not-verifiable` when the rule remains materially relevant.

Do not report missing tests, missing safeguards or missing configuration as a
confirmed violation unless an applicable guideline explicitly requires their
presence and the bounded evidence can establish the absence.

## Read-only boundary

This skill evaluates and reports. It never:

- edits implementation or tests;
- edits, generates or normalizes guideline documents;
- adds suppressions or exceptions;
- creates remediation commits;
- mutates generated knowledge to record findings.

A caller may separately request implementation work after reviewing the findings,
but that is outside this capability.

## Composition boundary

A higher-level review agent owns orchestration: obtaining the work item, selecting
pull requests or merge requests, establishing changed-file scope and composing
other review capabilities.

This skill owns only engineering-guideline evaluation. Given a bounded change, it
must be sufficient to:

```text
changed scope
    ↓
canonical guideline discovery
    ↓
applicability + exceptions
    ↓
safe implementation evidence
    ↓
finding classification
    ↓
traceable review summary
```

Do not make work-item completeness, general code quality, architectural fitness or
business-requirement correctness part of a guideline finding unless a canonical
engineering rule explicitly governs that concern. This keeps future review agents
thin and prevents policy logic from being duplicated in orchestration prompts.
