---
name: business-rule-analysis
description: Identify evidence-backed business rules, domain constraints and behavioral invariants
---

# Business rule analysis

Use this skill to identify business or domain rules that materially influence
application behaviour.

Business rules describe what the software is required to allow, prevent,
preserve or guarantee.

They are not ordinary implementation details.

## Candidate business rules

Look for:

- valid and invalid state transitions;
- domain invariants;
- validation constraints;
- authorization decisions tied to business behaviour;
- lifecycle rules;
- idempotency constraints;
- retry behaviour;
- compensation behaviour;
- atomicity requirements;
- uniqueness constraints;
- ordering requirements;
- domain-specific decision logic;
- conditions that allow or prevent an operation;
- relationships between domain entities;
- business-relevant defaults and limits.

## Evidence sources

Prefer evidence from:

1. existing knowledge and official documentation;
2. tests describing expected behaviour;
3. domain and application services;
4. validators;
5. command or request handlers;
6. domain entities and value objects;
7. persistence constraints;
8. controllers only when they contain actual behavioural rules.

Tests are particularly valuable when they explicitly describe expected domain
behaviour.

## Exclusions

Do not classify ordinary implementation details as business rules.

Examples that are not business rules by themselves:

- use of dependency injection;
- framework annotations;
- DTO mapping;
- logging;
- generic exception handling;
- serialization;
- HTTP status mapping;
- choice of programming language or framework.

A technical mechanism may support a business rule, but the rule should be
described independently from the implementation mechanism.

## Rule documentation

For every rule include:

- rule;
- trigger or context;
- preconditions when relevant;
- resulting behaviour;
- prohibited behaviour when relevant;
- affected domain concepts;
- evidence paths;
- confidence;
- unresolved edge cases.

Example:

```markdown
### Completed todos are immutable

**Context**

A todo has reached the completed state.

**Rule**

Once completed, the todo cannot be modified.

**Result**

Update operations targeting a completed todo are rejected.

**Evidence**

- `repositories/example/...`

**Confidence**

High
```

## Repository scope

Store repository-specific business rules under:

`knowledge-base/repositories/<repository-name>/business-rules.md`

Do not create the document when no meaningful business or domain rules can be
identified.

## Cross-repository rules

Some rules may span multiple applications or repositories.

Examples include:

- a workflow requiring operations in multiple services;
- cross-service consistency requirements;
- ownership rules spanning bounded contexts;
- distributed idempotency or compensation behaviour.

When a rule genuinely spans repository boundaries, document the system-level
rule under:

`knowledge-base/workspace/business-rules.md`

and link to the relevant repository-specific documents.

Do not promote a repository-local rule to workspace scope merely because
another repository consumes its API.

## Confidence

Use:

- High — directly demonstrated by tests, explicit documentation or clear domain
  logic;
- Medium — strongly supported by multiple implementation signals;
- Low — plausible interpretation requiring confirmation.

Prefer leaving a rule unresolved over documenting unsupported behaviour.
