# Ask — cross-repository execution flow

## Agent

`ask`

## Purpose

Validate that `execution-flow-analysis` can continue a single execution path
across repository boundaries without turning the request into a workspace-wide
relationship scan.

## Fixture

Use a disposable workspace with two small repositories participating in one
operation. The boundary should be supported by concrete evidence, for example:

- service A HTTP client -> service B matching route; or
- service A message producer -> service B matching consumer.

Include one unrelated repository in the workspace so focused scope can be
verified.

Prefer a fixture where one side of an additional possible integration is only
partially evidenced, allowing uncertainty handling to be tested.

## Prompt

```text
Quando <operation> parte da <service A>, come prosegue fino al risultato prodotto
nell'altro servizio? Ricostruisci solo il percorso rilevante e indicami le prove
per ogni passaggio importante.
```

Do not mention any skill name in the prompt.

## Expected behavior

The agent should:

- automatically load `execution-flow-analysis`;
- use `repository-analysis` only as needed for authoritative repository discovery
  or relationship evidence, not as a substitute for flow tracing;
- follow the outbound side of the requested operation;
- establish the transport/boundary evidence;
- identify the matching inbound entry point in the destination repository;
- continue tracing there until the requested observable result;
- avoid inspecting the unrelated repository unless evidence makes it relevant;
- distinguish a fully supported boundary from a one-sided/inferred integration;
- cite evidence from both repositories for a confirmed boundary;
- remain read-only.

## Negative checks

The test fails if the agent:

- stops merely because the flow leaves the first repository despite evidence of
  a matching workspace destination;
- treats Git submodule membership or repository naming as runtime integration
  evidence;
- claims a confirmed cross-repository transition from only one side when the
  receiving side is not established;
- turns the request into a complete workspace dependency/relationship analysis;
- traces unrelated branches after the requested result has been reached;
- modifies repository files.
