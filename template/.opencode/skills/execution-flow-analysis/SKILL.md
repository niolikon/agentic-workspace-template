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
