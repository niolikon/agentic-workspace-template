# Ask — execution flow analysis

## Agent

`ask`

## Purpose

Validate `execution-flow-analysis` independently, including automatic skill
selection, incremental tracing, evidence discipline and focused retrieval.

This test intentionally does not require `configuration-resolution` or
`impact-analysis`. Cross-skill orchestration belongs to the dedicated integration
issue.

## Fixture

Use a disposable workspace containing one small application repository with a
meaningful flow. Prefer a fixture that includes:

- one externally visible entry point such as an HTTP route, command, message
  listener or scheduled job;
- at least three meaningful application stages;
- an interface with one or more implementations and explicit dependency-injection
  wiring for the implementation used by the flow;
- one persistence or outbound integration step;
- one unrelated branch or component that should not be traced;
- one transition whose runtime outcome cannot be fully proven from the available
  source, so uncertainty handling can be observed;
- optional existing `knowledge-base/` documentation describing part of the flow.

## Prompt

```text
Spiegami come viene elaborata <operation> dall'ingresso fino all'effetto finale.
Voglio capire i passaggi applicativi rilevanti e dove sono implementati, non un
call graph completo.
```

Do not mention any skill name in the prompt.

Also validate automatic routing with a natural-language frontend-to-backend
question that does not use the words "flow" or "trace", for example:

```text
Consider the projects available under `repositories/`. Starting from the Angular
frontend, choose one real user action that triggers an HTTP request toward a
backend service and explain what happens from that point until the operation
reaches a meaningful observable outcome or system boundary. Use only evidence
available in the workspace and do not modify any files.
```

## Expected behavior

The agent should:

- classify the request before repository retrieval and load
  `execution-flow-analysis` as the first analysis skill, before using
  `read`/`glob`/`grep`/`repository_inventory` to trace the operation;
- automatically select it because the question asks how an operation propagates
  through the system, without requiring the user to say "flow", "trace" or
  name the skill;
- use existing workspace knowledge first when it already contains relevant flow
  evidence;
- reuse repository evidence already collected in the current request rather than
  rediscovering it;
- identify the concrete entry point from source/configuration evidence;
- trace the operation incrementally through only the meaningful application
  stages;
- resolve interface-to-implementation transitions only from actual wiring or
  equivalent evidence;
- identify the persistence, publication, external call or other observable
  outcome relevant to the question;
- stop once the requested outcome or an unresolved system boundary is reached;
- cite workspace-relative source paths and useful classes/methods/configuration;
- clearly distinguish confirmed transitions from inferred or unresolved ones;
- remain read-only.

A compact execution diagram is encouraged when it improves readability, for
example:

```text
entry point
    ↓ [confirmed]
application service
    ↓ [confirmed]
injected implementation
    ↓ [inferred: durability not established]
observable effect
```

## Negative checks

The test fails if the agent:

- starts repository tracing with `workspace-reading`, `read`, `glob`, `grep` or
  `repository_inventory` before loading `execution-flow-analysis`;
- requires the user to explicitly request `execution-flow-analysis`;
- produces an exhaustive caller/callee graph;
- scans unrelated repositories or components without evidence that they belong
  to the requested flow;
- chooses an interface implementation only from naming conventions;
- treats a framework annotation or convention as sufficient proof of runtime
  behavior when the relevant wiring/semantics are unresolved;
- reports persistence API invocation as guaranteed durability without evidence;
- presents an inferred transition as confirmed;
- modifies repository files;
- implements or simulates missing `configuration-resolution` or `impact-analysis`
  behavior merely to complete this test.

## Knowledge-first variant

If the fixture contains an up-to-date execution-flow document, run the same
prompt again in a new session.

Verify that the agent starts from that knowledge and inspects source only where
additional evidence is required. The test fails if it immediately reconstructs
the whole flow from source despite sufficient existing knowledge.

## Empty-workspace selection variant

Run the following prompt in a disposable workspace whose `repositories/`
directory contains no application source:

```text
What happens in this workspace when an incoming HTTP request reaches one of the
application's endpoints? Choose one real endpoint and explain how the operation
propagates through the application until it reaches a meaningful outcome. Use
only evidence available in the workspace and do not modify any files.
```

Even though no real flow can be reconstructed, the trace must still show
`execution-flow-analysis` being loaded before repository inspection. The final
answer should stop with an evidence-backed insufficient-evidence conclusion and
must not invent an illustrative application flow as a substitute for workspace
evidence.
