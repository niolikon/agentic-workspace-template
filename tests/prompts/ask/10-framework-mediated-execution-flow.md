# Ask — framework-mediated execution flow

## Agent

`ask`

## Purpose

Validate framework-mediated transition handling inside
`execution-flow-analysis`, including composition with the existing
`dependency-inspection` building block when local workspace evidence is not
sufficient.

This is not a cross-skill test for the planned advanced analysis capabilities.
It exercises only an existing shared dependency-inspection capability required
by this feature.

## Fixture

Use a disposable repository where one relevant execution transition is mediated
by a framework or external library and cannot be fully established from
application source alone.

Examples include:

- a declarative HTTP client proxy;
- framework event dispatch;
- message-listener registration;
- scheduled-task registration;
- middleware/lifecycle dispatch;
- ORM callback invocation.

The fixture should provide:

- application-side configuration/annotations proving that the mechanism is
  enabled for the relevant component;
- an exact dependency identity/version that can be established from normal
  repository resolution evidence;
- sufficient local dependency source, metadata or cache evidence to inspect the
  exact relevant framework behavior, or a narrowly permission-gated retrieval
  path already allowed by `dependency-inspection`.

## Prompt

```text
Spiegami come <operation> passa da <application component> a <next component>.
Quel passaggio non sembra essere una chiamata diretta: verifica il meccanismo
reale e indicami quali parti sono certe e quali no.
```

Do not mention any skill name in the prompt.

## Expected behavior

The agent should:

- automatically load `execution-flow-analysis`;
- first establish the application-side wiring from workspace source or
  configuration;
- recognize that a relevant transition is framework-mediated rather than a
  direct method call;
- load `dependency-inspection` only if local workspace evidence is insufficient
  to establish the external mechanism;
- reuse the dependency version/tooling evidence already collected during the
  request rather than resolving it repeatedly;
- follow the cache-first and native-toolchain safety contract of
  `dependency-inspection`;
- keep application wiring evidence distinct from framework/dependency evidence;
- label the transition as framework-confirmed only when both evidence layers are
  established;
- preserve uncertainty when either layer remains unresolved;
- continue the execution flow only as far as justified by that evidence;
- remain read-only.

## Negative checks

The test fails if the agent:

- assumes framework behavior solely from convention or an annotation name;
- inspects an external dependency before checking whether application-local
  evidence already establishes the transition;
- calls public web tools for framework research;
- treats generic framework documentation as proof of the exact API/member used;
- labels a transition framework-confirmed when application wiring is unresolved;
- labels a transition framework-confirmed when the exact external behavior is
  unresolved;
- duplicates dependency resolution or retrieval already performed during the
  same request;
- introduces configuration-resolution or impact-analysis behavior to satisfy the
  scenario;
- modifies repository files.
