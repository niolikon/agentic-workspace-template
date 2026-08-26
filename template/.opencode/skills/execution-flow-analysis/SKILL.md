---
name: execution-flow-analysis
description: Use for questions about what happens when a request, user action, HTTP call, command, message, event or job moves through the system; reconstruct evidence-backed execution paths across the workspace
---

# Execution flow analysis

Use this skill when the question requires understanding how an operation moves
through the system. For such questions this is the primary analysis strategy;
repository discovery and workspace retrieval are supporting capabilities, not
alternatives to loading this skill.

Typical subjects include:

- an HTTP request;
- a command;
- a message or event;
- a scheduled job;
- a background operation;
- a user action that triggers backend processing;
- an integration that crosses repository boundaries.

The objective is to explain the meaningful execution path, not to generate an
exhaustive call graph.

## Responsibility boundary

This skill owns execution-path reconstruction:

- locating relevant entry points;
- following delegation between components;
- resolving interface-to-implementation transitions when evidence supports it;
- following framework-mediated execution transitions;
- identifying persistence, publication and external calls on the relevant path;
- crossing repository boundaries when the same operation demonstrably continues
  elsewhere;
- stopping at a meaningful observable outcome or system boundary.

Do not absorb responsibilities that belong to another analysis capability merely
because they may be useful to a flow question.

In particular:

- use existing workspace/repository capabilities for discovery and repository
  relationships rather than recreating them here;
- use `dependency-inspection` when external framework or library behaviour must
  be established and workspace evidence is insufficient;
- when another specialized analysis skill is available and the question crosses
  into its responsibility, allow the agent to compose that skill with this one
  instead of reproducing its logic here;
- if such a specialized skill is not available, keep the unsupported part
  explicit rather than embedding a replacement implementation in this skill.

Skill composition is contextual. Do not require a fixed invocation order and do
not make another analysis skill a mandatory prerequisite.

## Evidence reuse

Treat evidence already collected during the current request as shared evidence.

Before searching for a fact, check whether another loaded capability has already
established it with sufficient evidence. Reuse that evidence and its source
references instead of rediscovering the same repository, configuration,
dependency or transition.

Evidence gathered by this skill should remain usable by other capabilities in
the same request. Keep findings associated with:

- the claim or transition they support;
- source path or inspected artifact;
- evidence type;
- confidence or uncertainty.

Do not create parallel, skill-specific versions of the same fact.

## Retrieval strategy

Prefer the least expensive evidence source that can answer the question.

Use this order as a default, not as a rigid pipeline:

1. existing workspace knowledge relevant to the requested operation;
2. repository metadata or previously collected repository evidence;
3. focused source-code and configuration inspection;
4. dependency inspection only when framework or external-library behaviour
   cannot be established locally.

Existing knowledge is a lead and reusable evidence source, not an excuse to
ignore contradictory implementation evidence. If source inspection reveals a
conflict with knowledge, report the conflict and prefer the stronger/current
implementation evidence for runtime claims.

Do not scan every repository merely because the workspace contains many
repositories. Expand scope only as the flow provides evidence that another
repository is relevant.

## Entry-point discovery

Start from the operation named or implied by the user's question.

Candidate entry points include:

- HTTP routes and controllers;
- message listeners and consumers;
- event subscribers;
- scheduled methods or scheduler registrations;
- command handlers;
- CLI commands;
- frontend actions or API clients when they are part of the requested path;
- file watchers, import processors or startup hooks;
- framework lifecycle callbacks.

Use concrete selectors from the question whenever available, such as:

- route or endpoint;
- command name;
- event or message type;
- queue or topic;
- job name;
- class or method;
- log-visible operation name;
- external service name.

If several entry points match, narrow them using evidence relevant to the
question. Do not trace every candidate by default.

## Incremental flow reconstruction

Follow the path one meaningful transition at a time.

For each step:

1. establish the current component or execution point;
2. identify the transition relevant to the requested operation;
3. locate evidence for the destination of that transition;
4. classify the transition by evidence strength;
5. continue only along branches that materially contribute to the question;
6. stop when the requested outcome, a meaningful observable effect or an
   unresolved system boundary is reached.

Relevant transitions may include:

- controller -> application service;
- service -> domain component;
- interface -> injected implementation;
- handler -> persistence operation;
- producer -> queue/topic -> consumer;
- scheduler -> processing service;
- client -> remote HTTP endpoint;
- middleware -> downstream handler;
- event publication -> subscriber;
- repository -> database or storage;
- component -> external system.

Do not recursively enumerate all callers or callees.

## Branch discipline

Expand a branch only when it can change the answer to the user's question.

Relevant branches commonly include:

- success versus a specifically asked failure path;
- conditional routing that changes the downstream component;
- retry or compensation logic when it affects the operation being explained;
- alternative implementations selected by verified runtime wiring.

Do not expand incidental branches such as generic logging, metrics, exception
translation or unrelated validation unless they materially affect the requested
flow.

When multiple branches remain relevant, label the condition that selects each
branch and preserve uncertainty if the selecting condition cannot be resolved.

## Interface and dependency-injection resolution

An interface call is not by itself evidence of the runtime implementation.

To resolve an interface-to-implementation transition, inspect evidence such as:

- constructor or field injection;
- explicit registration/binding configuration;
- component scanning plus unambiguous implementation evidence;
- factory/provider methods;
- qualifiers, names or keys;
- runtime configuration selecting an implementation;
- generated or framework registration metadata.

If more than one implementation remains possible, report the alternatives or
leave the transition unresolved. Never choose an implementation solely from its
name or because it appears to be the most obvious one.

## Framework-mediated transitions

Some execution transitions are not direct method calls. Examples include:

- HTTP routing;
- dependency injection;
- middleware or filters;
- message listener registration;
- event subscription;
- scheduled-task registration;
- ORM callbacks;
- framework lifecycle hooks;
- declarative clients or proxies.

Confirm these transitions using repository-local evidence first, including
annotations, configuration, registrations, generated metadata and tests.

When the transition depends on external framework behaviour that cannot be
established from workspace evidence, reuse `dependency-inspection` rather than
assuming framework conventions.

Keep the two evidence layers distinct:

- repository evidence establishes how the application configures or invokes the
  framework;
- dependency/framework evidence establishes what that external mechanism does.

A framework convention alone must not be promoted to confirmed application
runtime behaviour when application wiring is unresolved.

## Persistence and observable effects

Follow persistence only as far as needed to explain the meaningful effect.

Possible outcomes include:

- entity/document persisted;
- record updated or deleted;
- object written to storage;
- transaction committed or rolled back when supported by evidence;
- message/event published;
- remote service invoked;
- response returned;
- state exposed through a later query or notification.

Distinguish an invoked persistence API from a guaranteed durable result when
transactional or provider behaviour has not been established.

## Mandatory integration-boundary checkpoint

When an execution flow crosses a repository or deployable-component boundary, target selection is a mandatory checkpoint, not an optional refinement.

Follow this procedure in order:

1. Trace inside the currently confirmed component only until the flow reaches an external boundary such as an HTTP endpoint, gateway route, queue/topic, service name, RPC destination, scheduled hand-off, or another explicit integration contract.
2. Record the boundary contract and stop tracing implementation internals beyond that boundary.
3. Determine which deployed component actually receives that contract using the strongest available workspace evidence. Prefer, when applicable:
   - gateway, ingress, reverse-proxy, or API routing;
   - deployment and orchestration configuration;
   - message broker bindings or destination configuration;
   - repository-relationship knowledge backed by current workspace evidence;
   - explicit client-to-service integration configuration.
4. If repository inventory or workspace structure shows an orchestration/deployment repository, inspect the relevant routing or deployment evidence before selecting among implementation candidates.
5. Only after the integration evidence selects a target may the analysis continue into that target's controller, handler, service, repository, persistence, mapper, middleware, or framework internals.
6. Reuse the selected boundary and target as confirmed evidence for the remainder of the flow. Do not rediscover the same binding unless later evidence contradicts it.

A source match is not a deployment binding. Finding a controller, handler, route annotation, interface implementation, or method whose name/path matches the boundary only creates an **implementation candidate**. It does not confirm that runtime execution reaches that candidate.

If multiple candidates expose the same or compatible contract:

- do not choose the first search result;
- do not deep-inspect any candidate merely to decide which one is active;
- resolve the integration binding first;
- follow only the selected target as the confirmed flow;
- mention unselected candidates only when useful, clearly labeling them as alternatives not proven to participate in the requested flow.

If the workspace does not contain enough evidence to select a target, keep the boundary unresolved and present the plausible candidates. Do not turn one candidate into a confirmed edge by inference.

### Exploration budget at unresolved boundaries

Protect the analysis budget at cross-repository boundaries.

Before a target is selected, allowed work should be limited to evidence needed to resolve the binding: repository inventory, relationship knowledge, deployment/orchestration files, gateway/proxy/ingress configuration, message bindings, and shallow inspection of candidate entry-point declarations when necessary.

Before target selection, **do not read** candidate service implementations, repositories, persistence/database code, mappers, middleware, migrations, exception handling, framework internals, or other downstream implementation details.

For example, if an Angular client calls `/api/Todos` and both Java and .NET repositories expose `/api/Todos`, neither controller is sufficient evidence of the runtime target. Resolve the deployment edge first. If APISIX routes `/api/Todos` to `taskboard-service-boot`, continue through the Java implementation and treat the .NET implementation only as an unselected alternative.

This checkpoint applies to execution-flow analysis itself. Reading deployment, gateway, proxy, or orchestration configuration to establish a runtime edge does not by itself require `configuration-resolution`; that capability is needed only when the user's outcome requires configuration provenance, precedence, effective-value resolution, or equivalent configuration-specific analysis.

## Cross-repository target disambiguation

When the same operation or endpoint appears to have multiple candidate receiving
implementations, do not select a target repository merely because its source
contains a matching route, controller, handler, interface or contract. A matching
inbound implementation proves only that the repository can handle that shape of
request; it does not prove that the execution path being analyzed reaches it.

Before continuing into the internals of a candidate receiving repository, establish
the integration edge that selects that target when practical. Prefer evidence such
as:

1. deployment or orchestration configuration naming the receiving service;
2. gateway, ingress, proxy or service-routing configuration mapping the outbound
   address/path to a concrete target;
3. message/topic/queue bindings that select a concrete consumer;
4. repository-relationship or workspace knowledge backed by current implementation
   evidence;
5. only then, matching inbound routes or handlers as supporting evidence.

For example, finding both a Java controller and a .NET controller for `/api/Todos`
does not establish two equivalent runtime branches. If deployment or gateway
evidence routes `/api/Todos` to the Java service, trace that service as the confirmed
flow and treat the .NET implementation only as an alternative implementation
present in the workspace unless other evidence selects it.

If the selecting integration edge cannot be resolved:

- do not promote the first matching implementation to the confirmed flow;
- keep the boundary unresolved or present the candidates explicitly;
- inspect each candidate internally only when doing so materially helps answer the
  question despite the unresolved selection.

This disambiguation is part of execution-flow reconstruction and does not by itself
require configuration-resolution. Reading deployment, gateway or routing
configuration as evidence of a runtime transition remains within this skill's
responsibility.

### Disambiguate before deep inspection

Treat target selection as a hard boundary in the exploration strategy. Once more
than one receiving implementation is discovered for the same outbound operation,
route, topic, queue or contract, stop deep inspection of those candidates until
the selecting integration edge has been resolved as far as workspace evidence
allows.

Before a target is selected, do not spend exploration budget reading candidate
service layers, repositories, persistence implementations, migrations, DTO
mappings or other internal details merely to decide which implementation is
active. At this stage, inspect only the minimum inbound evidence needed to
identify the candidates, then move outward to the evidence that selects among
them.

Prefer the following exploration sequence when multiple targets are plausible:

1. record the outbound address/path/topic/contract already established;
2. identify the candidate receiving repositories using shallow evidence only;
3. inspect deployment, orchestration, gateway, ingress, proxy, service discovery,
   message binding or repository-relationship evidence that can select a target;
4. select the confirmed target, or preserve the boundary as unresolved if no
   selector can be established;
5. only then continue into the selected target's controller/handler, service,
   repository and persistence path.

A shallow candidate check should normally stop after confirming a matching inbound
route, handler, listener or contract. Reading several internal layers of a
non-selected candidate is unnecessary unless the user explicitly asks to compare
implementations or the unresolved candidates themselves materially affect the
answer.

### Exploration budget

Preserve tool-call budget for evidence that can change the reconstructed path.
Do not exhaust the analysis by exploring implementation details of branches that
have not been selected by runtime/integration evidence. In particular:

- do not follow controller -> service -> repository -> persistence for every
  matching backend candidate;
- do not inspect migrations, database internals or DTO mappings before the target
  repository is selected unless those details are directly required by the user;
- prefer one focused routing/orchestration lookup over several speculative deep
  dives;
- once a target is selected, continue only along the shortest evidence-backed path
  needed to reach the requested observable effect.

If the tool-call budget becomes constrained, prioritize completing the confirmed
end-to-end path over investigating alternative implementations, incidental
security details, serialization minutiae or unrelated anomalies.

## Cross-repository continuation

Do not stop at a repository boundary when evidence shows the same operation
continues in another workspace repository.

Boundary evidence may include:

- a concrete HTTP client target plus a matching inbound route;
- producer topic/queue plus a matching consumer registration;
- command/event contract shared across repositories;
- deployment/service configuration connecting a client to a workspace service;
- an existing workspace knowledge relationship supported by implementation
  evidence.

For a confirmed cross-repository transition, establish when practical:

1. outbound component;
2. transport or integration mechanism;
3. relevant address, route, topic, queue, event or contract;
4. receiving repository/component;
5. inbound entry point.

When only the outbound or inbound side is supported, do not invent the missing
half. Mark the boundary as inferred or unresolved and stop or continue only to
the extent justified by evidence.

A Git submodule relationship, shared organization name or similar structural
relationship is never sufficient evidence of runtime communication.

## Evidence classification

Every meaningful transition in the final reconstructed path must have an
evidence status.

Use these categories:

### Confirmed

Directly supported by inspected workspace source, configuration, tests,
generated metadata or other authoritative local evidence.

### Framework-confirmed

The application-side wiring is supported by workspace evidence and the mediated
transition is additionally supported by inspected dependency/framework
evidence.

### Inferred

The transition is plausible and supported by partial evidence, but one or more
runtime facts needed for confirmation could not be established.

Never present an inferred transition as confirmed.

If a transition cannot be supported even as a bounded inference, omit it from
the reconstructed path and state where the trace becomes unresolved.

## Evidence-strength rules

Do not claim more than the inspected evidence proves.

Examples:

- finding a method call proves delegation to that method, not that the call
  succeeds at runtime;
- finding an injected interface does not prove which implementation is active;
- finding an outbound URL does not prove which repository receives it;
- finding a producer does not prove a particular consumer processes the message;
- finding a repository `save` call does not by itself prove commit/durability;
- finding a framework annotation does not prove framework semantics that were
  not otherwise established.

If required evidence cannot be obtained, preserve the uncertainty in both the
flow diagram and the prose conclusion.

## Output

Return a concise execution narrative centered on the user's question.

When useful, include a compact flow representation such as:

```text
HTTP POST /api/jobs
    ↓ [confirmed]
JobController.create()
    ↓ [confirmed]
JobService.create()
    ↓ [confirmed]
JobRepository.save()
    ↓ [inferred: commit boundary not established]
database
```

The answer should normally include:

- the identified entry point;
- the ordered meaningful stages;
- repository boundaries when crossed;
- observable outcome or the point where evidence ends;
- source references for the important transitions;
- explicit uncertainty for inferred or unresolved steps.

Reference workspace-relative files and, when useful, classes, methods,
configuration keys, routes, topics or queue names so a developer can navigate
to the implementation.

Do not dump a raw call graph or a long inventory of unrelated files.

## Knowledge-generation compatibility

This skill is shared by read-only analysis and knowledge-generation workflows.
When a knowledge workflow asks for reusable flow documentation, keep the same
evidence and scope rules defined above.

Repository-local execution flows belong under:

```text
knowledge-base/repositories/<repository-name>/execution-flows.md
```

Repository-local data movement that materially changes location, representation,
ownership or state may be documented under:

```text
knowledge-base/repositories/<repository-name>/data-flows.md
```

Confirmed flows that genuinely cross repository/application boundaries belong
under the corresponding workspace documents:

```text
knowledge-base/workspace/execution-flows.md
knowledge-base/workspace/data-flows.md
```

Do not create a standalone execution flow for a library, SDK, schema repository
or support tool when it has no meaningful operational entry point. Describe its
role, reusable API or extension point in the knowledge document that best matches
its actual responsibility instead of inventing a runtime flow.

When documenting flows, preserve the same distinction between confirmed,
framework-confirmed and inferred transitions.

## Completion discipline

Stop when the user's requested flow has been explained to the strongest level
supported by available evidence.

Do not continue into unrelated callers, downstream systems or alternative flows
merely because they are discoverable.

Never modify repository files as part of this skill.
