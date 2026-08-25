# Ask — impact analysis

## Agent

`ask`

## Purpose

Validate `impact-analysis` independently, including automatic skill selection,
knowledge-first scoping, direct/transitive classification, cross-repository
analysis, textual-reference discipline and uncertainty handling.

This test intentionally does not require `execution-flow-analysis` or
`configuration-resolution`. Cross-skill orchestration and shared-evidence reuse
across the three advanced analysis skills belong to the dedicated integration
issue.

## Fixture

Use a disposable workspace containing at least two small repositories and
optional current `knowledge-base/` repository-relationship documentation. Build
a fixture around one concrete change surface, for example an API, interface or
shared library contract.

The fixture should include:

- one owning repository containing the changed element;
- one confirmed direct consumer in the same repository;
- one evidence-backed transitive consumer;
- one confirmed consumer in another repository;
- one interface implementation or dependency-injection relationship that can be
  resolved from local wiring;
- one directly affected test;
- one plain textual occurrence of the changed identifier that is not a runtime
  dependency, such as documentation, a comment, log text or unrelated fixture;
- one plausible but intentionally unresolved candidate dependency so potential
  impact can be observed;
- one unrelated repository or component that should not be scanned without an
  evidence-backed reason.

Prefer a fixture where existing workspace knowledge identifies the owning
repository and at least one cross-repository relationship so knowledge-first
scoping can be observed.

## Prompt

```text
Sto pensando di modificare <changed element or contract>. Prima di farlo, dimmi
quali componenti e repository potrebbero essere coinvolti, quali dipendenze sono
confermate e quali invece richiedono ancora verifica. Voglio capire anche gli
eventuali effetti indiretti e i test da ricontrollare. Usa solo le evidenze del
workspace e non modificare file.
```

Do not mention any skill name in the prompt.

Also validate routing with a shorter natural-language question that does not use
"impact analysis", for example:

```text
If I change the response contract of GET /api/foo, what could break in this
workspace and what should I verify before making the change?
```

## Expected behavior

The agent should:

- classify the request before repository retrieval and load `impact-analysis` as
  the first analysis skill, before using `read`/`glob`/`grep`,
  `repository_inventory`, `workspace-reading` or `repository-analysis` for the
  investigation;
- automatically select it because the question asks about consequences,
  consumers, dependencies or change risk without requiring the user to name the
  skill;
- identify the concrete changed surface before broad consumer discovery;
- consult structural repository-relationship/integration knowledge before any
  workspace-wide repository `glob`/`grep` when relevant knowledge exists;
- read relationship/overview knowledge because it defines workspace structure,
  even when the changed feature term is absent from those documents;
- not treat `glob knowledge-base/**/*<changed-term>*` (or an equivalent
  feature-keyword search) as sufficient completion of the knowledge-first gate;
- treat that knowledge lookup as a required scoping gate for cross-repository
  questions, not as an optional optimization;
- use that knowledge to establish the initial repository scope, then validate the
  relevant relationships from focused source/configuration evidence;
- expand to another repository only when knowledge, a confirmed dependency or an
  unresolved boundary justifies doing so;
- identify confirmed direct consumers from real dependency evidence rather than
  name matching alone;
- follow transitive impact only while the change remains relevant and preserve
  the dependency chain that supports it;
- resolve interface/implementation or dependency-injection relationships only
  from actual wiring or equivalent local evidence;
- identify the cross-repository consumer and state the concrete relationship
  type;
- include directly affected tests without using test-only references as proof of
  production runtime impact;
- classify the intentionally ambiguous candidate as potential or unknown impact
  and state what evidence is missing;
- treat negative searches as bounded evidence only: failure to find a migration,
  consumer, configuration source or deployment artifact must not become a
  categorical claim that it does not exist;
- when the exact proposed change is underspecified, make the top-level result
  explicitly separate invariant impact from consequences that only apply if a
  specific contract dimension also changes; API, persistence, serialization and
  client breakage must not be summarized as definite without that condition;
- avoid classifying the plain textual occurrence as confirmed impact;
- obey a findings-only output contract when only impact analysis was requested:
  after confirmed/conditional/potential/unknown findings and their bounded
  verification notes, stop the answer;
- do not produce an implementation checklist, redesign, migration recipe,
  generic recommended-next-steps section, per-file modification list, ordered
  implementation instructions or offers to prepare implementation artifacts
  unless the prompt explicitly asks for them;
- cite workspace-relative paths for important evidence;
- remain read-only.

A compact impact summary is encouraged when useful, for example:

```text
Confirmed direct impact
├── repository-a / FooService
└── repository-b / FooClient

Confirmed transitive impact
└── repository-b / BarWorkflow

Test impact
└── repository-b / FooContractIT

Potential impact
└── repository-c / candidate reference
    └── runtime dependency not established
```

## Evidence checks

For every confirmed impact item, verify that the answer exposes enough evidence
to understand why the component depends on the changed surface. Valid evidence
may include:

- a direct call or changed API use;
- an implementation relationship;
- dependency-injection wiring;
- a matching HTTP client and endpoint;
- a producer/consumer contract;
- a build dependency plus actual changed API use;
- a persistence or configuration consumer relevant to the selected fixture.

A grep/text match alone is not sufficient for a confirmed runtime dependency.

## Negative checks

The test fails if the agent:

- starts reference searches, repository inventory or generic retrieval before
  loading `impact-analysis`;
- requires the user to explicitly request `impact-analysis`;
- performs a workspace-wide repository `glob`/`grep` before consulting relevant
  workspace relationship/integration knowledge when that knowledge exists;
- searches the knowledge base only for the changed identifier/feature term and
  then proceeds to broad repository search without reading structural relationship
  knowledge that is available;
- uses generic `glob repositories/**/*` as the initial repository discovery step
  when workspace knowledge or explicit paths can establish a narrower scope;
- scans every repository before consulting sufficient workspace relationship
  knowledge;
- treats every import, identifier occurrence, comment, documentation mention or
  string literal as confirmed impact;
- reports a repository as runtime-affected only because it is a Git submodule or
  deployed alongside the changed repository;
- chooses an interface implementation only from naming conventions;
- marks an unresolved runtime relationship as confirmed;
- expands a transitive call graph after the proposed change is no longer relevant
  to those callers;
- states that no other impact exists merely because targeted searches found no
  additional references;
- infers that migrations, configuration mechanisms, clients or deployment
  artifacts do not exist merely because they were not discovered;
- presents a conditional consequence as unconditional by assuming an
  underspecified change also alters API, persistence or serialization contracts,
  describes such conditional impact as definitely breaking, or states in the
  top-level summary that those dimensions are definitely affected without the
  corresponding condition;
- turns the answer into implementation design, generic recommended next steps or
  a per-file change checklist when only impact analysis was requested;
- ends by offering to produce a patch, migration plan, implementation checklist,
  exhaustive modification list or other implementation artifact when the prompt
  requested only impact analysis;
- continues with an implementation/change plan after all impact findings and
  bounded uncertainty-verification notes have already answered the question;
- modifies repository files;
- implements or simulates missing `execution-flow-analysis` or
  `configuration-resolution` behavior merely to complete this independent test.

## Textual-reference variant

Add several misleading textual matches of the changed identifier in comments,
documentation, logs and unrelated test data.

The answer may mention them as inspected or non-runtime references when useful,
but it must not promote them to confirmed production impact without stronger
dependency evidence.

## No-consumer variant

Use a fixture where targeted searches within the evidence-backed repository scope
find no consumer of the changed contract.

The answer must report the bounded result without claiming that nothing depends
on the element. It should preserve the possibility of unavailable, generated,
dynamic or external consumers unless the workspace provides authoritative
closed-world evidence.

## Interface/DI variant

Use a fixture with one interface, two implementations and explicit local wiring
that selects only one implementation for the affected consumer.

The analysis should:

- identify both implementations as structurally affected if the interface
  contract itself changes;
- distinguish the implementation selected for the relevant runtime consumer when
  local wiring proves it;
- avoid claiming that the unselected implementation participates in that runtime
  path merely because it implements the same interface.

This variant validates impact classification only. It should not require a full
`execution-flow-analysis` trace.

## External-dependency variant

Use a fixture where the proposed change is an upgrade of an external dependency
and local code clearly uses one API whose compatibility cannot be determined from
workspace source alone.

The agent should:

- identify the local consumers first;
- establish the dependency version from repository evidence to the extent needed
  by the question;
- load `dependency-inspection` only when external version-specific API or behavior
  evidence is actually required;
- retain the evidence and safety discipline defined by `dependency-inspection`;
- preserve uncertainty if external behavior cannot be verified.

## Composition boundary

Do not make this feature test depend on a question whose correct answer requires a
full execution trace plus configuration-resolution chain. Such scenarios belong
to `[Integration] Validate composition of Ask advanced analysis skills`.

The independent test passes when `impact-analysis` remains focused, exposes
reusable evidence and is ready to compose without duplicating the other skills.
