# Engineering guidelines

This directory is the canonical location for project engineering rules that are
intended to guide implementation and automated review.

The guidelines are human-maintained, reviewed project documentation. They are
authoritative `documents/` evidence and must not be treated as generated or
derived `knowledge-base/` content.

## Start by reviewing, then adapt

The guidelines shipped with this workspace are a starter set, not a universal
policy that every repository must inherit unchanged.

Before using them for a project, review what is already present in this directory:

1. keep rules that are relevant as written;
2. adapt rules whose intent is relevant but whose scope or wording does not fit;
3. remove rules that are not useful or applicable to the project;
4. add project-specific rules when an important engineering expectation is not
   represented yet.

Do not keep a rule merely because it was provided by the template. A smaller,
intentional guideline set is preferable to a large set containing irrelevant or
misleading constraints. Conversely, before adding a new rule, check whether an
existing rule already covers the same concern and extend it when that preserves a
single clear source of truth.

The resulting contents of this directory should describe the engineering
expectations that reviewers can actually apply to the project.

## Precedence

Rules in this directory define the project engineering constraints within their
declared scope. More specific applicable rules take precedence over broader rules
when they address the same concern. A documented exception applies only to the
rule and scope that declares it; it does not weaken or disable unrelated rules.

If two applicable rules cannot be reconciled from their documented scope and
exceptions, report the conflict rather than inventing an implicit precedence.

## Rule format

Each enforceable rule is a level-two Markdown section whose heading contains a
stable identifier and a short title:

```markdown
## TEST-001 — Unit tests should follow Arrange / Act / Assert

- **Severity**: warning
- **Scope**: test code
- **Repositories**: *
- **Applies to**: Java, C#, TypeScript
- **Rule**: Unit tests should keep setup, action and assertions clearly separated.
- **Rationale**: Improves readability and reviewability.
- **Exceptions**: Trivial one-line assertions where explicit sections add noise.
```

Use the metadata fields exactly as documented below so that both developers and
automated review capabilities can interpret applicability without hidden prompt
knowledge.

- **Severity**: `error` for a mandatory constraint whose violation must be
  reported as a violation; `warning` for a recommendation whose violation should
  be reported as a recommendation finding.
- **Scope**: the code or artifact category governed by the rule, such as `test
  code`, `source code`, `configuration` or `documentation`.
- **Repositories**: `*` when the rule applies to every repository, otherwise a
  comma-separated list of repository names. Repository-specific rules must name
  their repositories explicitly.
- **Applies to**: `*` when technology-independent, otherwise a comma-separated
  list of languages, technologies or artifact types to which the rule applies.
- **Rule**: the normative requirement or recommendation. Use `must`/`must not`
  for `error` rules and `should`/`should not` for `warning` rules.
- **Rationale**: why the rule exists and what engineering concern it protects.
- **Exceptions**: explicit situations in which the rule does not apply. Use
  `None` when no exception is defined; absence of a documented exception must not
  be interpreted as permission to invent one.

## Stable identifiers

Rule identifiers use `<CATEGORY>-<NNN>`, with an uppercase concern prefix and a
zero-padded numeric sequence, for example `TEST-001`, `CODE-001` or `SEC-001`.

Once published, an identifier must continue to refer to the same engineering
concern. Edit the existing rule when its wording or scope evolves. Do not reuse a
retired identifier for a different rule. New concerns receive a new identifier.
Identifiers are the canonical references for review findings and traceability.

## File naming

Use one focused concern per Markdown file whenever practical. Name files using:

`<area>-<intent>.md`

The filename should make the rule's scope and purpose understandable without
opening the document. Prefer descriptive names such as:

- `testing-unit-tests-arrange-act-assert.md`
- `testing-unit-tests-given-when-then-naming.md`
- `security-credentials-and-secrets-not-hardcoded.md`
- `code-readability-self-documenting-code.md`

Do not encode the stable rule identifier in the filename. Rule identifiers are
for traceability; filenames are for human navigation and may remain meaningful
when wording evolves.

## Authoring guidelines

Keep each rule independently understandable. Prefer one rule per focused file;
combine rules only when they are inseparable parts of the same engineering
constraint. Update this index whenever files are added, renamed or removed.

Write rules so that applicability can be determined from the documented fields.
Do not rely on an agent prompt, reviewer intuition or undocumented project
knowledge to decide whether a rule applies.

Do not put passwords, tokens, private keys, environment-specific credentials or
real secret values in guideline documents, including examples. Use unmistakably
synthetic placeholders when an example needs credential-shaped data.

A developer must be able to add, change or remove a guideline by editing Markdown
only. Consumers may parse the documented structure, but the guideline source
remains this directory rather than agent prompts, generated knowledge or
tool-specific configuration.

## Starter guideline set

Review this list when adopting the template and remove entries that are not
appropriate for the project.

### Testing

- [Arrange / Act / Assert structure](testing-unit-tests-arrange-act-assert.md)
- [Given / When / Then naming](testing-unit-tests-given-when-then-naming.md)
- [Declarative assertions](testing-unit-tests-declarative-assertions.md)
- [One behavior per unit test](testing-unit-tests-one-behavior.md)

### Code design and readability

- [Centralize owned domain object creation](code-domain-object-creation-owned-static-factory.md)
- [Prefer self-documenting code](code-readability-self-documenting-code.md)
- [Do not retain dead or commented-out code](code-maintainability-no-dead-code.md)
- [Do not silently suppress failures](code-error-handling-no-silent-failures.md)

### Security

- [Do not hard-code credentials or secrets](security-credentials-and-secrets-not-hardcoded.md)
