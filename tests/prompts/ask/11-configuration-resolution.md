# Ask — configuration resolution

## Agent

`ask`

## Purpose

Validate `configuration-resolution` independently, including automatic skill
selection, focused retrieval, override-chain reconstruction, consumer binding and
uncertainty about runtime values.

This test intentionally does not require `execution-flow-analysis` or
`impact-analysis`. Cross-skill orchestration belongs to the dedicated integration
issue.

## Fixture

Use a disposable workspace containing one small application repository and,
optionally, one deployment repository that configures it.

The fixture should include a setting such as `jobs.timeout` with enough evidence
to exercise the following chain:

```text
base application configuration
    ↓
profile-specific application configuration
    ↓
environment-variable placeholder
    ↓
deployment configuration
    ↓
framework configuration binding
    ↓
application consumer
```

Prefer a fixture with:

- a base non-secret default;
- a profile-specific declaration or fallback;
- an environment-variable reference whose real runtime value is not committed;
- Docker Compose, Kubernetes or Helm configuration that passes the variable
  without revealing its runtime value;
- an application-side binding such as Spring `@ConfigurationProperties`, Spring
  `@Value`, .NET `IOptions<T>` or equivalent;
- one unrelated configuration file or repository that should not be inspected;
- exact framework/build metadata needed to identify the responsible framework
  version;
- optional existing `knowledge-base/` documentation describing the application
  and deployment relationship.

Do not put a real credential or secret value in the fixture.

## Prompt

```text
Da dove arriva il valore di <configuration key> usato da <component>? Voglio
capire quali configurazioni possono sovrascriverlo, quale valore possiamo
stabilire dai file del workspace e cosa invece dipende dall'ambiente runtime.
```

Do not mention any skill name in the prompt.

Also validate automatic routing with a natural-language environment question,
for example:

```text
Il timeout dei job in produzione viene davvero impostato a 30 secondi oppure può
essere cambiato dal deployment? Dimmi da dove arriva il valore usato
all'applicazione e cosa possiamo sapere con certezza dal workspace.
```

## Expected behavior

The agent should:

- classify the request before repository/configuration retrieval and load
  `configuration-resolution` as the first analysis skill, before using
  `read`/`glob`/`grep`/`repository_inventory`, `workspace-reading` or
  `repository-analysis` for the investigation;
- automatically select the skill without requiring the user to name it;
- use relevant workspace knowledge first when it already documents repository or
  deployment relationships;
- inspect only configuration sources connected to the requested setting;
- identify the base declaration and every override that is actually supported by
  profile/provider/placeholder evidence;
- distinguish a declared fallback from an effective runtime value;
- report an environment-dependent runtime value as unknown when the environment
  is not reconstructable from workspace evidence;
- identify the application binding and consumer when evidence supports it;
- cross into a deployment repository only when evidence connects that repository
  to the application/configuration being resolved;
- use the resolved framework version when framework-specific precedence matters;
- load `dependency-inspection` only if the required precedence or binding
  semantics cannot be established from local workspace evidence;
- reuse repository, dependency and configuration evidence already collected in
  the request instead of rediscovering it;
- cite workspace-relative paths;
- remain read-only.

A compact result such as the following is encouraged when supported by evidence:

```text
Declared default: 30s
Profile declaration: ${JOB_TIMEOUT:45s}
Deployment input: JOB_TIMEOUT=${JOB_TIMEOUT}
Runtime value: not determinable from workspace evidence
Consumer: JobProperties.timeout
```

## Negative checks

The test fails if the agent:

- starts configuration or repository inspection before loading
  `configuration-resolution`;
- requires the user to explicitly request `configuration-resolution`;
- scans all repositories or all configuration files without evidence that they
  are relevant;
- treats two declarations of the same key as an override without establishing
  the applicable profile/provider precedence;
- assumes framework precedence without establishing the responsible resolved
  framework version when version-specific behavior matters;
- reports an environment placeholder fallback as the runtime value without
  proving that the external value is absent;
- invents the value of an environment variable, Secret or external provider;
- reads or exposes unrelated secret values;
- treats Git submodule membership or repository naming as proof that one
  repository configures another;
- follows downstream application behavior beyond the configuration consumer just
  to simulate `execution-flow-analysis`;
- implements or simulates missing `impact-analysis` behavior;
- modifies repository or configuration files.

## Knowledge-first variant

If the fixture contains current knowledge that identifies the application and
deployment repositories, run the prompt again in a new session.

Verify that the agent uses that knowledge to narrow retrieval and then checks
only the configuration evidence required to establish the requested chain. The
test fails if it ignores sufficient knowledge and begins with a workspace-wide
configuration scan.

## Unknown-runtime variant

Run a fixture where the highest relevant configuration source contains only an
external environment-variable or secret reference and the runtime environment is
not represented in the workspace.

The final answer must explicitly state that the effective runtime value cannot be
determined. It may report committed defaults or fallbacks, but must not present
them as the actual runtime value.

## Local-precedence variant

Run a fixture where precedence is explicitly defined by local bootstrap code or
configuration-provider registration.

The agent should use that local evidence directly and should not invoke
`dependency-inspection` merely because a framework is present.

## Dependency-precedence variant

Run a fixture where the answer depends on version-specific framework precedence
that cannot be established from source, workspace knowledge or locally available
dependency evidence.

The agent should:

- establish the resolved framework/dependency version from repository evidence;
- load `dependency-inspection` only at that point;
- inspect only the external behavior needed to settle precedence;
- preserve uncertainty if dependency inspection cannot complete;
- never substitute remembered framework behavior for missing evidence.
