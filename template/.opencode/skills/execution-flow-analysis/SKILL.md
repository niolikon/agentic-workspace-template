---
name: execution-flow-analysis
description: Identify repository-local and cross-repository execution and data flows
---

# Execution flow analysis

Use this skill to understand how requests, commands, jobs, events and data move
through the software.

Do not generate exhaustive call graphs.

Repository-local analysis and cross-repository analysis are independent.

A repository may have meaningful internal execution and data flows even when no
relationship with another repository is demonstrated.

Always evaluate repository-local flows for each repository in scope.

Evaluate cross-repository flows separately and only when boundary-crossing
evidence exists.

Not every repository has a meaningful standalone execution flow.

Libraries, SDKs, shared frameworks, schema repositories and support tools may
instead expose:

- reusable components;
- extension points;
- public APIs;
- middleware;
- abstractions;
- integration helpers.

When no meaningful repository-local execution flow exists, do not invent one.

Document the repository using the knowledge documents that best represent its
actual role.

## Repository coverage workflow

When execution or data-flow analysis is requested for multiple repositories,
process repositories one at a time.

For each repository:

1. identify its role;
2. identify candidate entry points;
3. identify principal internal processing paths;
4. identify candidate business rules and, when business-rule analysis is in
   scope, validate them using the `business-rule-analysis` skill;
5. identify data transformations;
6. identify persistence and external systems;
7. identify outbound runtime interactions;
8. write repository-local findings before moving to the next repository;
9. mark the repository as:
    - analysed;
    - partially analysed;
    - no meaningful execution flow;
    - unresolved.

Do not move to the final report until every repository in scope has one of
these states.

## Flow categories

### Repository-local execution flow

A processing path whose meaningful stages remain inside one repository.

Examples:

- HTTP controller → application service → domain logic → persistence;
- scheduled job → reader → transformation → writer;
- event consumer → validation → processing → persistence;
- frontend action → state management → API service.

Document repository-local flows under:

```text
knowledge-base/repositories/<repository-name>/execution-flows.md
```

### Cross-repository execution flow

A processing path that crosses application, service or repository boundaries.

Examples:

- frontend → HTTP API → persistence;
- service → message broker → consuming service;
- gateway → backend service;
- application → document service → object storage.

Document cross-repository flows under:

```text
knowledge-base/workspace/execution-flows.md
```

### Data flow

A data flow describes how a relevant data object changes location, format,
ownership or state.

Examples:

- credentials becoming an access token;
- an HTTP payload becoming a domain entity;
- an uploaded file becoming object-storage content plus database metadata;
- a domain event becoming a materialized view.

Document repository-local data flows under:

```text
knowledge-base/repositories/<repository-name>/data-flows.md
```

Document cross-repository data flows under:

```text
knowledge-base/workspace/data-flows.md
```

## Important distinction

A Git submodule relationship is not an execution or data flow.

An orchestrator may establish workspace composition and selected repository
versions, but runtime flows require separate evidence from configuration, code,
API definitions, messaging or deployment descriptors.

## Discovery workflow

For each candidate flow:

1. identify an externally observable or operational entry point;
2. identify the principal internal processing stages;
3. identify relevant data inputs and transformations;
4. identify persistence or messaging;
5. identify outbound calls or events;
6. locate the destination component when possible;
7. continue tracing inside the destination repository;
8. stop at an observable result;
9. preserve evidence for every important transition.

## Candidate entry points

Look for:

- HTTP or REST controllers;
- frontend routes, actions and API services;
- message consumers;
- scheduled jobs;
- command handlers;
- CLI commands;
- file watchers or import jobs;
- application startup orchestration.

## Cross-boundary evidence

Look for:

- base URLs and service names;
- HTTP clients;
- Feign, RestClient, WebClient, HttpClient or equivalent clients;
- frontend API clients;
- OpenAPI definitions;
- gateway routes;
- message topics, queues and event names;
- producers and consumers;
- Docker Compose service names and environment variables;
- shared schemas;
- shared storage;
- file exchanges.

A cross-repository transition should ideally have evidence for the outbound
side, protocol or mechanism, and receiving side.

When only one side is known, classify the transition as probable or unresolved.

## Flow documentation

For every flow include:

- name;
- scope: repository-local or cross-repository;
- business or operational purpose;
- entry point;
- input data;
- ordered processing stages;
- important decisions;
- data transformations;
- repository or application boundaries crossed;
- transport mechanisms;
- persistence and external systems;
- observable outcome;
- evidence paths;
- confidence;
- unresolved questions.

Prioritize principal business and operational flows. Do not attempt exhaustive
coverage.

## Cross-repository reconciliation

After repository-local analysis has completed:

1. collect all outbound interactions discovered in repository-local flows;
2. match them with corresponding inbound interfaces in other repositories;
3. identify confirmed boundary transitions;
4. reconstruct principal end-to-end flows;
5. store confirmed cross-repository flows under
   `knowledge-base/workspace/execution-flows.md`;
6. store cross-repository data movement under
   `knowledge-base/workspace/data-flows.md`.

Only create flows supported by evidence from both sides when possible.

When only one side of an interaction is supported by evidence, document the
relationship as probable or unresolved instead of presenting it as confirmed.
