---
name: impact-analysis
description: Use for questions about what depends on, consumes or may be affected by a component or proposed change; identify evidence-backed direct, transitive, cross-repository and potential impact across the workspace
---

# Impact analysis

Use this skill when the question requires estimating the consequences or blast
radius of changing a component, contract, configuration, persistence structure,
shared library or external dependency.

This is the primary analysis strategy for impact questions. Workspace knowledge,
repository analysis, source inspection, execution-flow analysis, configuration
resolution and dependency inspection are supporting capabilities rather than
substitutes for loading this skill.

Typical subjects include changes to:

- classes, methods and interfaces;
- APIs and client contracts;
- events, messages and subscriptions;
- configuration properties and environment inputs;
- database entities, tables and schemas;
- shared libraries and produced artifacts;
- dependency versions and externally provided APIs.

The objective is to identify the smallest evidence-backed set of affected
components and boundaries needed to answer the question. Do not generate an
exhaustive workspace reference graph.

## Responsibility boundary

This skill owns impact-oriented reasoning:

- identifying the concrete change subject and changed contract or behavior;
- locating confirmed direct consumers or dependents;
- following dependency edges transitively only when they remain relevant to the
  proposed change;
- identifying cross-repository, runtime, configuration, persistence and test
  impact when supported by evidence;
- distinguishing structural references from dependencies that participate in
  relevant runtime behavior;
- classifying impact according to evidence strength;
- preserving unknowns when available evidence cannot establish or exclude an
  impact.

Do not absorb responsibilities that belong to another analysis capability merely
because they may contribute evidence.

In particular:

- use workspace/repository capabilities for repository discovery and documented
  relationships rather than recreating them here;
- use `execution-flow-analysis` when a suspected dependency is behavioral and the
  question requires proving whether it participates in the affected runtime path;
- use `configuration-resolution` when the proposed change concerns a configurable
  value, its overrides, effective source or consumers;
- use `dependency-inspection` when an external dependency upgrade or API change
  requires version-specific evidence that is not available locally;
- if another specialized capability is unavailable, keep that part explicitly
  unresolved rather than embedding a replacement implementation in this skill.

Skill composition is contextual. No other analysis skill is a mandatory
prerequisite and this skill must not impose a fixed invocation sequence.

## Evidence reuse

Treat evidence already collected during the current request as shared evidence.

Before discovering repositories, relationships, configuration chains, execution
transitions or dependency versions, check whether another loaded capability has
already established the fact with sufficient evidence. Reuse the finding and its
source reference instead of rediscovering it.

Evidence gathered by this skill should remain reusable by other capabilities in
the same request. Associate findings with:

- the changed subject or contract;
- source and target component or repository;
- relationship type;
- source path or inspected artifact;
- whether the edge is structural, runtime, configuration, persistence or test
  related;
- confidence and unresolved assumptions.

Do not create parallel, skill-specific copies of facts already established.

## Retrieval strategy

Prefer the least expensive evidence source that can establish the requested
impact.

For questions that may cross repository boundaries, knowledge-first scoping is a
required retrieval gate, not merely a preference. Before any workspace-wide
repository `glob`/`grep` or equivalent broad source search, inspect structural
workspace knowledge when it exists. In particular, read the workspace overview,
repository relationships/integrations and equivalent ownership/deployment
knowledge that can establish repository boundaries. Do this even when the changed
identifier or feature term does not occur in those documents.

Do not satisfy the knowledge gate by searching `knowledge-base/` only for the
changed identifier (for example `*status*`, `Foo`, or an endpoint name). Structural
knowledge is useful because it describes repositories and relationships, not
because it repeats the symbol being changed. If the knowledge layout is not yet
known, discover the knowledge structure narrowly, then read the relevant
relationship/overview documents before broad source retrieval.

Use this order as the normal strategy:

1. relevant workspace knowledge, especially repository relationships,
   integrations and ownership hints;
2. repository metadata or evidence already collected in the current request;
3. focused searches for the concrete changed surface and its consumers inside
   the owning/initially relevant repositories;
4. progressive expansion to additional repositories only when an established
   relationship, confirmed dependency edge, contradictory evidence or explicit
   unresolved boundary justifies it;
5. another specialized analysis skill only when its evidence is required to
   classify an impact correctly;
6. dependency inspection only when external version-specific behavior cannot be
   established from workspace evidence.

A broad workspace search is acceptable only after the knowledge gate has been
performed and one of these conditions applies:

- relevant knowledge is absent or insufficient to identify the owning/consumer
  repositories;
- a dependency edge points outside the current scope but the target cannot be
  resolved more narrowly;
- contradictory evidence requires wider verification.

The fact that the owning symbol has been found is not by itself sufficient reason
to immediately grep the entire workspace. First inspect its local callers,
contracts and known relationship targets. Expand workspace-wide only when one of
the conditions above remains true after that focused analysis.

When a broad search is necessary, search for dependency semantics rather than a
generic word such as `status`, `config` or the changed identifier alone whenever
a more specific selector is available.

Existing knowledge is a scoping aid and reusable evidence. It does not override
contradictory implementation evidence. When current source conflicts with
knowledge, report the conflict and prefer the stronger/current evidence for
claims about present impact.

## Knowledge-first workspace scoping

For an impact question that may cross repository boundaries, consult structural
workspace knowledge before broad repository searches when that knowledge exists.
Repository relationships, integrations, workspace overview and deployment or
ownership documentation should be used to establish the initial search scope.

When conventional workspace knowledge files are available, prefer reading them
directly (for example `knowledge-base/workspace/overview.md` and
`knowledge-base/workspace/repository-relationships.md`) or discover their
equivalents by structure. Do not search the knowledge base only for the changed
feature term and treat a negative match as proof that knowledge is irrelevant.

Do not begin with generic repository enumeration such as `glob repositories/**/*`
or a workspace-wide textual search merely because the changed identifier could
appear anywhere. First determine the owning repository and known consumers or
integration boundaries from knowledge, explicit paths or already-established
evidence. Generic repository enumeration is a fallback discovery mechanism, not
the default first source-analysis step.

Broaden beyond the knowledge-derived scope only when:

- relevant knowledge is missing or incomplete;
- a confirmed dependency points to another repository;
- source evidence contradicts the documented relationship;
- the requested change cannot be evaluated within the scoped repositories.

When broadening scope, explain the dependency edge or uncertainty that justified
the expansion.

## Identify the change surface

Before looking for consumers, normalize the user's proposal into a concrete
change surface whenever possible. Examples include:

- method signature or semantics;
- interface member or implementation contract;
- HTTP method, route, request/response field or status behavior;
- event/message name, schema, routing key or payload field;
- configuration key, type, default or precedence behavior;
- table, column, entity field, constraint or migration;
- library artifact, exported type or shared API;
- external dependency coordinate and old/new version.

Separate distinct change surfaces when a request includes more than one. A
consumer affected by one surface is not automatically affected by the others.

If the proposed change is underspecified, separate invariant impact from
scenario-dependent impact:

- **invariant impact**: components that must be reviewed because they directly
  depend on the current representation or contract regardless of the exact new
  design;
- **scenario-dependent impact**: consequences that occur only if the change also
  alters an exposed type, field name, persistence representation, serialization
  format, runtime semantics or other specific contract dimension.

State the condition for each scenario-dependent conclusion. Do not silently
assume that an internal representation change also changes an HTTP contract,
persistence schema or client payload. Do not invent a specific breaking change
merely to produce a larger impact set.

When the proposal is abstract (for example "change how status is represented"),
do not summarize conditional API, persistence or cross-repository consequences as
"definite" or "breaking". A confirmed consumer of the current representation may
be an invariant review target, while actual breakage remains conditional on which
contract dimension changes.

## Dependency evidence

A confirmed dependency requires evidence that connects the consumer to the
changed subject through a meaningful relationship. Useful evidence includes:

- direct method or constructor calls;
- interface implementation plus actual selection/wiring when runtime impact is
  claimed;
- dependency injection bindings;
- imports together with use of the changed API;
- build-manifest dependencies for shared libraries;
- HTTP clients, routes and matching API contracts;
- message producers/consumers, topics, queues, routing keys or subscriptions;
- event publication and handlers;
- shared database entities, queries, migrations or schema references;
- configuration bindings and consumers;
- integration or contract tests that exercise the changed boundary.

Use the relationship that actually matters to the proposed change. An import of
a package does not prove that the changed member is consumed. A client class does
not prove that a particular endpoint is called. A repository dependency does not
prove that every application path uses the changed API.

## Textual-reference rule

A textual match is a discovery lead, never sufficient evidence of confirmed
runtime impact by itself.

Examples that remain unconfirmed without stronger context include:

- comments and documentation;
- test data or sample payloads unrelated to execution;
- log messages;
- class or method names appearing as plain strings;
- generated, vendored or copied source whose runtime ownership is not established;
- configuration keys mentioned without a binding or consuming deployment;
- endpoint paths mentioned without a client invocation or routing relationship.

After a textual match, inspect enough surrounding evidence to classify the
relationship. If that cannot be done, report it as potential or unresolved
impact, not confirmed impact.

## Direct impact

Classify an item as confirmed direct impact when the proposed change reaches it
through one established dependency edge and the changed surface is relevant to
that edge. Examples include:

- a caller of the changed method;
- a class implementing a changed interface member;
- a client invoking the changed endpoint or consuming the changed response field;
- a handler consuming the changed event/message contract;
- code binding or reading the changed configuration property;
- a query/entity directly relying on the changed database structure;
- a test directly exercising the changed contract.

Direct impact does not imply failure. It means the component must be evaluated
against the proposed change.

## Transitive impact

Follow transitive dependencies only when the direct impact can propagate in a
way relevant to the requested change.

For each transitive step, preserve the chain of evidence. For example:

```text
changed interface
  -> implementation [direct]
  -> injected service using implementation [transitive]
  -> API operation depending on service behavior [transitive]
```

Do not classify every caller of every direct consumer as impacted. Stop when the
change no longer affects the contract or behavior relevant to the question.

If propagation depends on runtime conditions, framework behavior or unresolved
wiring, downgrade the corresponding edge to potential or unknown impact.

## Interface and dependency-injection impact

For interface changes, distinguish compile-time and runtime evidence.

A concrete implementation of the changed interface is a direct structural impact
when source evidence establishes the implementation relationship. Runtime impact
on a consumer requires evidence that the implementation can actually be selected
or injected for that consumer.

Useful wiring evidence includes:

- explicit constructors or providers;
- dependency-injection modules/configuration;
- framework annotations plus unambiguous local registration evidence;
- factories or selectors;
- tests/configuration that establish the selected implementation.

Do not choose an implementation solely from naming conventions or because it is
the only textual match found.

## Cross-repository impact

When an established dependency crosses repository boundaries, report the target
repository explicitly and classify the relationship. Possible evidence includes:

- an HTTP client matching a producer API;
- a message producer and consumer sharing the same destination/contract;
- a compile-time dependency on a library produced by another repository;
- deployment configuration connecting services;
- shared schema or database ownership;
- integration tests spanning repositories.

A Git submodule, aggregate checkout or co-deployment relationship alone does not
prove runtime impact. Use it only as repository/deployment evidence until a more
specific dependency is established.

## Runtime integration impact

When a suspected impact depends on whether a component participates in actual
behavior, distinguish structural evidence from runtime-path evidence.

Load `execution-flow-analysis` when proving the relevant path is necessary to
answer the question. Reuse any entry points, transitions and boundaries it
establishes.

Examples where execution-flow evidence is useful include:

- multiple implementations exist but only one participates in the affected
  operation;
- an event consumer exists but may not lie on the business path being changed;
- a shared service is called by many code paths but only one path depends on the
  changed behavior;
- a framework-mediated transition cannot be classified from references alone.

Do not reconstruct a full execution path when a direct structural dependency is
already sufficient for the user's question.

## Configuration impact

When the changed surface is configuration, use `configuration-resolution` if
answering the impact question requires identifying producers, overrides, effective
sources, bindings or deployment consumers.

Reuse the configuration chain it establishes and classify impact from concrete
consumers and deployment dependencies.

Do not treat every occurrence of a property name as a consumer. Do not assume a
committed default is the effective runtime value when higher-priority external
configuration may exist.

## Persistence impact

For changes to entities, tables, columns or schemas, distinguish:

- application mappings;
- direct SQL/query usage;
- migrations and schema management;
- other repositories or services using the same persistence structure;
- serialization/export contracts derived from persistence models;
- tests and fixtures depending on the schema.

Shared database access is a cross-component dependency only when evidence shows
that multiple components actually read or write the same structure. Similar
entity names are not sufficient.

For destructive or incompatible schema changes, explicitly identify consumers
whose compatibility depends on rollout order or migration state when such
evidence exists.

## Test impact

Tests are impact evidence, not noise. Include tests when they directly exercise a
changed contract, implementation, configuration chain, schema or integration.

Distinguish:

- unit tests coupled to a changed signature or implementation contract;
- integration tests covering runtime wiring;
- contract/API tests covering external interfaces;
- fixtures or migrations coupled to persistence/schema changes.

Do not infer production runtime impact solely because a test mentions an element.
A test can be directly impacted while the corresponding production dependency
remains unresolved.

## External dependency impact

For dependency-version changes, first establish from repository evidence:

- dependency identity;
- declared and, when needed, resolved version;
- locally used APIs or behavior relevant to the proposed upgrade;
- repositories or modules consuming the dependency.

Load `dependency-inspection` only when version-specific external API or behavior
must be verified and local workspace/cache evidence is insufficient. Its evidence
and safety rules remain authoritative for external artifacts.

Do not infer compatibility or breakage from version-number magnitude alone. Do
not substitute remembered release behavior for evidence when the question
requires verification.

## Impact classification

Classify each finding according to the strongest evidence actually available.
Keep impact category and evidence confidence separate when useful.

### Confirmed direct impact

Use when a single established dependency edge connects the changed surface to the
consumer and the proposed change is relevant to that edge.

### Confirmed transitive impact

Use when an evidence-backed chain of two or more relevant dependency edges shows
how the change can propagate. Preserve the chain in the explanation.

### Potential impact

Use when evidence suggests a plausible dependency but one or more required facts
are unresolved, for example:

- runtime implementation selection is ambiguous;
- an endpoint string is present but invocation is not established;
- an event contract appears shared but producer/consumer matching is incomplete;
- deployment/runtime state is external to the workspace;
- framework behavior required to connect two edges is not established.

State what evidence would confirm or reject the potential impact.

### Unknown impact

Use when available evidence is insufficient even to classify a plausible
dependency confidently. Explain the missing boundary rather than converting it
into either impact or no impact.

## Absence-of-evidence rule

Failure to discover a consumer, migration, configuration source, deployment
artifact or other expected evidence is not proof that it does not exist.
Negative search results are bounded evidence about what was inspected, not
positive evidence about the whole system.

When targeted searches find no dependency, report the bounded result precisely,
for example:

```text
No direct consumer was found in the repositories scoped by the current workspace
evidence. External, generated, dynamically discovered or unavailable consumers
are not excluded.
```

Apply the same rule to supporting mechanisms. For example, if no Flyway or
Liquibase migration is discovered, do not conclude that the project has no schema
migration mechanism and do not conclude that a migration file "must be added".
Instead say that the migration/provisioning mechanism was not established from
the inspected evidence and identify what would need verification.

Do not write categorical statements such as "nothing depends on this", "there
are no migrations", "no other client exists" or equivalent claims unless the
workspace evidence genuinely provides an authoritative closed world for the
requested boundary.

## Search discipline

Search for semantic dependency evidence rather than only the changed identifier.
Depending on the subject, useful targeted selectors may include:

- method/type names and signatures;
- interface declarations and implementation syntax;
- constructor/provider bindings;
- API route plus HTTP client method;
- message destination plus producer/consumer configuration;
- schema/table/column name in mappings and queries;
- configuration key plus binding type/environment form;
- artifact/module coordinate plus imported/used API;
- test names and fixtures covering the changed contract.

Group related searches when practical. Avoid repeating equivalent workspace-wide
searches with slightly different spellings.

Inspect enough context around each candidate to classify it before expanding the
scope further.

## Stop conditions

Stop expanding the analysis when:

- the requested direct consumers and relevant transitive consequences have been
  established;
- all known repository boundaries justified by evidence have been checked;
- additional searches would only enumerate unrelated textual references;
- the remaining uncertainty depends on unavailable runtime/external evidence;
- another specialized capability has established the required boundary and no
  further impact edge is indicated.

Do not scan the entire workspace simply to increase confidence after sufficient
evidence has already answered the question.

## Reporting

For a pure impact-analysis request, the response contract is findings-only. The
answer MUST stop after reporting impact, evidence and any uncertainty that still
requires verification. Do not append implementation guidance merely because it
would be useful.

Unless the user explicitly asks for implementation planning, do not include:

- recommended next steps;
- files or source areas to modify;
- implementation/change checklists;
- migration or rollout plans;
- redesign suggestions or replacement designs;
- ordered coding/build/test instructions;
- offers to produce patches, migrations, checklists or implementation plans.

Verification needed to resolve an uncertainty remains in scope, but it MUST stay
attached to that specific unresolved finding and describe only the missing
evidence, for example `verify whether these services share the same schema`.
Do not turn that verification note into a procedural plan.

When the proposed change is underspecified, the top-level summary MUST separate
what is invariant from what is conditional. Do not summarize API, persistence,
serialization, client or cross-repository breakage as definite unless the
proposed change explicitly alters that contract dimension or the evidence proves
that it necessarily follows.

Prefer a shape such as:

```text
Invariant impact
└── code branching directly on the current representation

Conditional impact — if the HTTP representation changes
└── API clients consuming that representation

Conditional impact — if the persisted representation changes
└── schema/migration consumers
```

Direct/transitive confidence labels may then be applied within those sections.
For example, distinguish `TodoService directly branches on the current Boolean`
from `TaskBoard.App.Ng is affected if the HTTP JSON representation also changes`.

If all findings and uncertainties have been reported, end the answer. Do not add
a generic conclusion that restates a change plan and do not ask which
implementation follow-up the user wants.

Adapt presentation to the question, but keep evidence strength visible. A useful
shape is:

```text
Confirmed direct impact
├── repository-a / FooService
│   └── calls ChangedApi#doWork
└── repository-b / FooClient
    └── consumes GET /api/foo

Confirmed transitive impact
└── repository-b / BarWorkflow
    └── depends on FooClient response semantics

Potential impact
└── repository-c / FooUpdatedHandler
    └── matching event name found; producer/consumer contract not fully resolved
```

Where relevant, distinguish impact dimensions such as:

- direct code impact;
- transitive impact;
- cross-repository impact;
- runtime integration impact;
- configuration impact;
- persistence impact;
- test impact;
- potential or unknown impact requiring verification.

For important findings include workspace-relative paths and the concrete evidence
that supports the dependency. State unresolved assumptions separately.

Avoid presenting every textual occurrence as an impact item. Prefer a smaller set
of meaningful dependencies over a larger unclassified reference list.

## Read-only constraint

Impact analysis is strictly read-only.

Never modify repository, configuration, knowledge or test files as part of an
analysis request. Temporary dependency-inspection artifacts, when required, must
follow the staging and safety rules of `dependency-inspection` and must never be
written into repositories.
