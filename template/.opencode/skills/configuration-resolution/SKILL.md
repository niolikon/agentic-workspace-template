---
name: configuration-resolution
description: Use for questions about configuration declarations, overrides, profiles, environment variables, effective values and configuration consumers across the workspace
---

# Configuration resolution

Use this skill when the question requires tracing a configuration value from
its declaration through relevant override mechanisms to the value or state that
can be established from workspace evidence.

This is the primary analysis strategy for configuration questions. Workspace
knowledge, repository analysis, source inspection and dependency inspection are
supporting capabilities rather than substitutes for loading this skill.

Typical subjects include:

- application properties and settings;
- environment variables and `.env` files;
- profiles and environment-specific configuration;
- Docker Compose, Kubernetes and Helm configuration;
- build-tool properties and command-line arguments;
- framework-specific configuration binding;
- configuration shared across repositories;
- the code that consumes a configured value.

The objective is to reconstruct only the configuration chain relevant to the
question and to distinguish what is declared, overridden, externally supplied
and actually knowable.

## Responsibility boundary

This skill owns configuration-resolution analysis:

- locating declarations relevant to the requested configuration;
- identifying repository-defined and deployment-defined overrides;
- establishing applicable precedence when evidence supports it;
- distinguishing defaults, overrides, environment-dependent values and effective
  values;
- identifying configuration binding or entry points into application code when
  useful to the question;
- following configuration across repository boundaries when evidence shows that
  one repository configures another;
- preserving uncertainty when runtime state is unavailable.

Do not absorb responsibilities that belong to another analysis capability merely
because they may be adjacent to a configuration question.

In particular:

- use existing workspace/repository capabilities for repository discovery and
  relationships rather than recreating them here;
- use `execution-flow-analysis` when the question also requires following runtime
  behavior beyond the configuration consumer, if that skill is available;
- use `dependency-inspection` when external framework, library, runtime, build-tool,
  container/orchestration or configuration-processor semantics must be verified and
  workspace evidence is insufficient;
- if another specialized capability is not available, keep that part explicitly
  unresolved rather than implementing a replacement inside this skill.

Skill composition is contextual. No other analysis skill is a mandatory
prerequisite and this skill must not impose a fixed invocation sequence.

## Evidence reuse

Treat evidence already collected during the current request as shared evidence.

Before searching for a declaration, override, repository relationship,
dependency version or consumer, check whether another loaded capability has
already established it with sufficient evidence. Reuse the finding and its
source reference rather than rediscovering it.

Evidence gathered by this skill should remain usable by other capabilities in
the same request. Associate findings with:

- the configuration key or logical setting;
- repository and workspace-relative source path;
- source type;
- declared expression or non-secret value when safe;
- precedence or override relationship when established;
- consumer or binding point when established;
- confidence and unresolved runtime dependencies.

Do not create parallel, skill-specific versions of facts already established.

## Retrieval strategy

Prefer the least expensive evidence source that can answer the question.

Use this order as a default, not as a rigid pipeline:

1. existing workspace knowledge relevant to the requested configuration;
2. repository metadata or relationships already established in the request;
3. focused inspection of configuration and source files relevant to the key;
4. dependency inspection only when version-specific external semantics are
   required to establish precedence, binding or default behavior.

### Knowledge-first repository scoping

For any question that may cross repository boundaries, workspace knowledge is a
mandatory scoping step when relevant knowledge exists. Consult repository
relationships and configuration/deployment knowledge before broad repository
discovery.

For cross-repository questions, inspect repository-relationship knowledge before
performing workspace-wide repository or configuration discovery. Avoid broad
workspace `grep`, `glob` or equivalent discovery before consulting available
relationship knowledge, except for the minimal lookup required to locate that
knowledge itself.

Use that knowledge to establish the initial repository scope, then inspect source
only within that scope to validate and enrich the documented relationships. Do not
rediscover repository relationships from source before consulting available
workspace knowledge.

Broaden discovery beyond the knowledge-derived scope only when one of the
following is true:

- relevant workspace knowledge is missing;
- the documented relationship is ambiguous;
- implementation evidence contradicts the documented relationship;
- the requested configuration cannot be resolved within the scoped repositories.

When broadening scope, preserve the knowledge-derived relationship as prior
evidence and explain why additional discovery was necessary.

Existing knowledge is reusable evidence and a retrieval lead. If current source
or deployment configuration contradicts it, report the conflict and prefer the
stronger/current implementation evidence for claims about effective behavior.

Do not scan every repository or every configuration file. Expand scope only when
a declaration, placeholder, deployment reference, repository relationship or
consumer provides evidence that another source is relevant.

Prefer canonical repository sources over embedded, vendored, generated or aggregate
copies when repository metadata or workspace knowledge can establish which source is
canonical. Treat duplicate copies as corroborating or deployment-specific evidence,
not as independent declarations, unless evidence shows that the copy is intentionally
owned and configured separately.

When both a canonical application repository and an aggregate/deployment repository
contain the same application sources, analyze the canonical source for declarations
and consumers, and inspect the aggregate repository only for configuration that is
specific to that deployment boundary.

## Identify the requested setting

Normalize the user's subject into one or more concrete selectors before broad
retrieval when possible, for example:

- property key such as `jobs.timeout`;
- environment variable such as `JOB_TIMEOUT`;
- configuration object field;
- Helm value path;
- command-line option;
- class or component that consumes the setting.

Account for common transformations only when supported by the framework or local
code, such as a property key being mapped to an environment-variable form. Do
not assume a transformation rule if the responsible framework and version are
not established.

If multiple unrelated settings match the same short name, keep them separate
until evidence proves that they represent the same logical configuration.

When the user asks for an example configuration without naming a specific key,
select a candidate only after establishing that it participates in an actual
configuration mechanism.

A candidate should have evidence of at least one configuration characteristic,
such as:

- declaration in a configuration source;
- environment-variable mapping;
- profile-specific value;
- deployment substitution or override;
- framework configuration binding;
- command-line or build-time configuration input.

Do not treat an arbitrary hard-coded application literal as a configuration
value merely because its semantic meaning matches the user's search term.

If no suitable configurable setting can be established from the inspected
workspace, report that no appropriate configuration example was found rather
than converting an application constant into a configuration chain.

When the request names a logical area but not a concrete key, keep the selected
analysis anchored to one coherent configuration chain. For a singular request
such as one service, provider or operation:

- select one concrete service and operation when evidence permits;
- select the configuration setting or closely related setting group required by
  that operation;
- do not merge parallel configuration mechanisms merely because they concern
  the same technology or provider;
- mention adjacent chains only when they are required to explain the selected
  chain or when the user explicitly asks for comparison.

For example, client configuration used for login and resource-server
configuration used for validating inbound JWTs are separate chains unless
evidence shows that the requested operation requires both.

## Configuration sources

Inspect only source types relevant to the requested setting. Possible sources
include:

- `.properties`, YAML and JSON configuration;
- profile- or environment-specific variants;
- `.env` files and environment-variable declarations;
- Dockerfiles and Docker Compose files;
- Kubernetes manifests, ConfigMaps and workload environment declarations;
- Helm values and templates;
- Maven, Gradle, npm, MSBuild or equivalent build configuration;
- command-line arguments and startup scripts;
- application bootstrap code;
- framework-specific configuration providers;
- shared configuration contracts or defaults in libraries;
- workspace knowledge documenting deployment or repository relationships.

The presence of a possible source is not proof that it participates in the
requested configuration chain. Include it only when a key, placeholder,
transformation, profile, template expression or other evidence connects it.

## Build the configuration chain

Reconstruct the chain incrementally from evidence. A useful representation is:

```text
source declaration
    ↓ [override/binding evidence]
repository or deployment override
    ↓ [precedence evidence]
environment-dependent source
    ↓ [binding evidence]
application configuration consumer
```

For each transition establish, when relevant:

- the source and target setting names;
- whether the transition is a declaration, substitution, override, precedence
  relationship or binding;
- the artifact that proves the relationship;
- whether the relationship is unconditional or depends on a profile,
  environment, deployment input or runtime argument.

Do not infer an override merely because two files contain the same key. The
applicable profile/provider and precedence relationship must be supported by
local or dependency evidence before the later value is called an override.

Distinguish a configuration source from the mechanism that supplies it. For
example, a Docker Compose `environment` entry may define the process environment
variable that a Spring placeholder reads. In that case Compose is provenance for
the environment value, not a separate precedence layer that sits above the
environment variable. Represent the relationship as supply/substitution, not as
`Compose > environment variable > fallback`.

### Edge validation protocol

Before traversing any transition in the configuration chain, classify that edge.
Do not derive the target value first and justify the transition afterward.

Each edge must be classified as exactly one of:

- **directly evidenced**: the relationship is explicit in workspace source, such as
  a property placeholder directly referencing an environment variable or a
  configuration binder explicitly reading a named key. Workspace documentation may
  corroborate the intended relationship, but it is not semantic proof when external
  framework or tool behavior is required to make that relationship effective;
- **externally semantic**: the relationship depends on behavior of a framework,
  runtime, build tool, shell, orchestrator or configuration processor;
- **runtime-dependent**: the relationship depends on state unavailable from the
  workspace, such as the actual process environment, launch arguments or external
  deployment inputs;
- **unresolved**: available evidence is insufficient to classify or establish the
  transition.

Apply the following gate before deriving any downstream value:

```text
source value/expression
    ↓
classify edge
    ├─ directly evidenced → traverse
    ├─ externally semantic → verify semantics first
    │      ├─ concrete evidence obtained → traverse
    │      └─ evidence unavailable → mark unresolved and stop this branch
    ├─ runtime-dependent → keep value conditional/unknown
    └─ unresolved → stop this branch
```

For an **externally semantic** edge, invoke `dependency-inspection` or another
appropriate evidence source before using the relationship in a derivation. The
edge remains closed until concrete evidence for the required behavior is produced.

Semantic validation applies to structural relationships as well as propagated
values. A declaration can directly prove that a configuration mechanism is
configured without proving the external runtime semantics that connect two
sources or components.

An edge is externally semantic whenever external framework/tool behavior is
needed to establish either:

- the value propagated across the edge; or
- the fact that the source and target participate in the same effective
  configuration chain.

For example, declarations such as:

- `spring.config.import=configserver:...`;
- `spring.cloud.config.server.git.uri=...`;
- Helm value references;
- Kubernetes `ConfigMap` or `Secret` injection;
- build-tool property propagation;

prove that those mechanisms are declared. They do not, by declaration alone,
prove the runtime behavior that imports, serves, injects, merges or propagates
configuration across the edge. Verify that semantic relationship before
presenting the cross-source connection as established.

If the semantic relationship cannot be verified, keep the declarations as
confirmed evidence but mark the structural edge unresolved and stop that branch
according to the unresolved-edge hard stop.

### Structural semantic evidence gate

Workspace knowledge, naming conventions, matching files, dependency declarations
and configuration declarations may identify or corroborate an expected relationship
between components, but they do not replace verification of external framework or
tool semantics.

When an edge is classified as externally semantic:

- keep it externally semantic even when workspace knowledge explicitly describes
  the intended architecture;
- treat knowledge as corroborating context and repository-scoping evidence, not as
  proof of the runtime/configuration-processing semantics;
- do not promote the edge to directly evidenced merely because repository names,
  filenames, dependencies, annotations or configuration keys line up with the
  expected design;
- verify the required framework or tool behavior before presenting the edge as an
  established propagation path.

If verification is unavailable, report only:

- the declarations that are confirmed;
- the workspace knowledge that describes or expects the relationship;
- the externally semantic edge that remains unverified;
- the last established point in the chain and the evidence required to continue.

Do not present downstream configuration sources, merged values, selected profile
files or consumers as reached through that unresolved structural edge.

This gate applies even when no concrete value is being derived. Establishing that
two configuration sources or components are connected at all can itself depend on
external semantics.

For example:

```text
spring.config.import=configserver:...
```

directly proves that a Config Server import is declared. It does not by itself prove
which remote property sources are fetched, merged or selected.

Likewise:

```text
spring.cloud.config.server.git.uri=...
```

directly proves that a Git backend URI is configured. It does not by itself prove
how the Config Server resolves application/profile files from that backend.

This validation is mandatory even when adjacent files make the intended result
look obvious. In particular, for Docker Compose:

```text
env_file: .env
        +
environment value containing ${DB_NAME}
```

does not establish `.env -> Compose interpolation of ${DB_NAME}` by workspace
proximity alone. That transition is externally semantic and must be verified before
a concrete expanded value is derived. If it cannot be verified, preserve the known
Compose expression literally and report the interpolation input as unresolved.

Never use an unverified semantic edge in the answer and then offer to verify it
afterward. Verification must precede any conclusion that depends on the edge.

Once an edge is classified as unresolved, stop reasoning across that edge.
Do not provide hypothetical, probable, typical, expected or example downstream
values based on general knowledge or on what the external tool would usually do.
An unresolved branch may state the known upstream expression and the evidence
required to continue, but it must not speculate about the result that evidence
would likely produce.

### Unverified structural edge boundary

An externally semantic structural edge that has not been verified is a hard
boundary for configuration propagation.

Sources, declarations and consumers on both sides of the boundary may still be
inspected and reported independently, but do not state or imply that a
configuration value crosses the edge.

Workspace knowledge may describe the expected topology and source declarations
may show the intended mechanism. Until the external semantics are verified, report
them separately as:

- expected relationship from workspace knowledge;
- declared configuration mechanism;
- externally semantic propagation edge — unverified.

Do not use corroborating knowledge, matching names, compatible dependencies or
adjacent declarations to continue propagation beyond the boundary. In particular:

- a value in a remote configuration repository remains a declared candidate
  source until remote propagation is verified;
- a profile-specific file remains a profile-specific candidate source until the
  framework semantics selecting and merging it are verified;
- do not state that a candidate value reaches an application property binding or
  consumer across an unverified structural edge;
- do not classify one candidate source as an effective override of another across
  that edge.

When a structural propagation edge is unresolved, apply the unresolved-edge hard
stop exactly as for value-transformation edges. Do not add conditional scenarios
such as what would happen with no active profile or with default environment
values when those scenarios require crossing the unresolved edge.

For example, when Spring Cloud Config propagation has not been semantically
verified:

```text
demo-service.yml       -> declared candidate source
demo-service-dev.yml   -> profile-specific candidate source
demo-service-prod.yml  -> profile-specific candidate source

Config repository -> Config Server -> client application
                    externally semantic — unverified
```

It is valid to report the expected topology and independently identify the
downstream `@ConfigurationProperties` binding and consumer. It is not valid to
claim that `30s`, `10s` or `60s` reaches that binding until the unresolved
propagation edge is closed with evidence.

## Value classification

Keep these states distinct.

### Declared default

A value explicitly declared as part of a configuration mechanism, such as a base
configuration source, configuration binding declaration or explicit defaulting
expression.

A hard-coded value used directly by ordinary application logic is not, by
itself, a declared configuration default. Do not classify arbitrary source-code
constants or literals as configuration merely because they influence runtime
behavior.

### Repository-defined override

A value or expression in repository-controlled configuration that is shown to
supersede another declaration under established conditions.

### Deployment-defined override

A value or expression supplied by deployment configuration such as Compose,
Kubernetes, Helm or startup scripts.

### Environment-dependent value

A placeholder or external input whose concrete value is supplied outside the
available workspace evidence.

### Effective value established from workspace evidence

A concrete non-secret value may be called effective only when the complete
relevant chain and applicable precedence are supported by available evidence and
no unresolved higher-precedence source remains relevant.

A concrete value declared by a repository-owned deployment artifact may be
reported as the value defined by that deployment configuration. Do not promote
it to the unconditional runtime-effective value unless the actual launch context
is established and no relevant runtime override path remains unresolved. Prefer
wording such as `deployment-defined value` or `effective when launched with this
Compose definition` when execution context is conditional.

### Runtime value not determinable

Use this state whenever a relevant value depends on an environment variable,
secret, external configuration provider, launch argument, active profile or
other runtime state that cannot be reconstructed from the workspace.

A useful summary is:

```text
Declared default: 30s
Deployment override: ${JOB_TIMEOUT}
Runtime value: not determinable from workspace evidence
```

Never promote a possible, example or fallback value to an effective runtime value
without evidence that the full relevant chain selects it.

## Precedence and framework semantics

Configuration precedence is evidence, not a universal assumption.

Prefer, in order:

1. explicit local bootstrap/provider ordering;
2. repository documentation that is consistent with the implementation;
3. dependency declarations that establish the exact responsible framework or
   library version plus locally available dependency evidence;
4. `dependency-inspection` when the resolved version's external behavior must be
   verified.

Do not rely on remembered framework defaults when precedence, relaxed binding,
profile activation, provider ordering or default values may vary with the
resolved framework version.

Resolving the framework version is necessary but is not, by itself, evidence for
framework behavior. When a conclusion depends on semantics that are not explicit
in workspace source or local documentation -- for example placeholder
resolution, property-source precedence, relaxed binding or profile ordering --
use `dependency-inspection` to verify the behavior for the resolved dependency
version. Do not cite the dependency version alone as proof of those semantics.

When dependency inspection is necessary, reuse the repository-native toolchain
and safety contract defined by `dependency-inspection`. Inspect only the
framework behavior needed for the requested configuration question.

Invoking `dependency-inspection` is not itself evidence. When behavior specific to
an external framework, library, runtime, build tool, container/orchestration tool
or configuration processor is required to support a configuration conclusion, do
not report that behavior as verified unless dependency inspection or another
available evidence source produced concrete evidence for it.

Treat transformations performed outside the application as semantic steps that
require evidence when they affect the resolved value. Examples include:

- Docker Compose interpolation, `environment` and `env_file` behavior;
- Kubernetes `env`, `envFrom`, ConfigMap and Secret projection semantics;
- Helm values merging and template evaluation;
- Maven or Gradle property resolution and build-time filtering;
- shell or command-wrapper variable expansion;
- framework configuration binding and property-source precedence.

Do not infer a relationship between two configuration sources merely because they
appear in the same deployment file or use the same variable name. For example,
the presence of `env_file: .env` alongside a Compose expression such as
`${DB_NAME}` does not by itself establish that `env_file` supplies the value used
for Compose interpolation. Establish that relationship from processor semantics
or leave the interpolation input unresolved.

After invoking dependency inspection:

- reuse the evidence it returned rather than falling back to remembered behavior;
- cite or summarize the inspected artifact, metadata, source or documentation
  that establishes the relevant semantics;
- distinguish verified dependency behavior from general background knowledge.

If dependency inspection cannot establish the required behavior, preserve the
uncertainty instead of presenting assumed external-tool semantics as verified. Do
not claim that a framework, runtime, build-tool or orchestration rule has been
verified merely because its version was identified or the dependency-inspection
skill was loaded.

When an unresolved external semantic step blocks full resolution, keep the chain
partially resolved. Report the exact expression or template that is known, identify
the unresolved input, and do not promote a possible expanded value to
`deployment-defined effective` or `runtime effective`.

Treat each external semantic transformation as an evidence gate in the chain.
A downstream value may be derived only when every semantic edge required for that
derivation is established by concrete evidence.

Loading or invoking `dependency-inspection` does not open that gate by itself. If
inspection does not produce evidence for the required behavior:

- keep the edge explicitly unresolved;
- do not resolve variables across that edge;
- do not derive downstream configuration values from it;
- do not classify downstream values as deployment-effective or runtime-effective;
- do not describe the external behavior as standard, expected, implicit or
  otherwise established.

This gate applies even when the candidate result looks obvious from nearby files.
For example, if Compose declares `env_file: .env` and separately contains
`${DB_NAME}`, the presence of `DB_NAME` in that file is not enough to derive an
expanded Compose value until evidence establishes that the file participates in
Compose interpolation for that expression.

### Unresolved-edge hard stop

An unresolved edge is terminal for that configuration branch. Once an edge is
classified as unresolved, stop reasoning across it in every subsequent stage of
the analysis and final answer.

After an unresolved edge, do not:

- calculate, derive or display any downstream value;
- provide hypothetical, conditional, illustrative or example resolutions;
- use wording such as `if`, `assuming`, `probably`, `typically`, `expected`,
  `would become` or equivalent to describe values beyond the blocked edge;
- use general knowledge to show what the downstream result would likely be;
- reintroduce a possible downstream value in summaries, diagrams, examples,
  recommendations or conclusions.

For a blocked branch, report only:

- the last verified upstream value or expression;
- the unresolved edge and why it is unresolved;
- the concrete evidence required to continue.

This is a hard invariant. Later reporting or summarization must not reopen or
continue a branch that analysis marked unresolved.

When reporting precedence, distinguish between the framework's general
precedence model and the concrete precedence chain demonstrated for the
requested setting.

If the concrete configuration chain can be established without relying on the
framework's complete precedence model, prefer the narrower evidence-based
conclusion. For example, when a configuration value explicitly contains a
placeholder such as `${ENV_VAR:default}` and workspace evidence shows that a
deployment artifact supplies `ENV_VAR`, report that concrete relationship
without expanding into the framework's complete property-source precedence
model unless the question requires it.

This is a stop condition for precedence analysis: once the requested setting's
concrete declaration, supplied inputs, demonstrated overrides and remaining runtime
uncertainty are sufficient to answer the question, do not inspect, reconstruct or
report the framework's broader precedence model merely for completeness.

If `dependency-inspection` was invoked to verify a framework-specific claim but did
not return concrete supporting evidence, remove that claim from the conclusions.
Report only the narrower workspace-supported relationship and, if relevant, state
that the broader framework rule was not established. Do not offer the unverified
claim as an optional extension in the same answer.

Do not include a configuration source in the concrete chain merely because the
framework supports that source type. A profile-specific file, command-line
source, environment provider or other potential source belongs in the concrete
chain only when setting-specific evidence shows that it declares, supplies or
influences the requested value.

For example, an active `application-prod.yml` is not an override for the
requested property if it does not declare that property or another value that
participates in its resolution. Framework precedence may be reported separately
when useful, but do not present theoretical sources as observed override steps.

If precedence cannot be established, report the competing declarations without
choosing an effective value.

## Configuration consumers

When useful to the user's question, identify where the setting enters the
application and where it is consumed.

Examples include:

- Spring `@Value`;
- Spring `@ConfigurationProperties`;
- .NET `IConfiguration`;
- .NET `IOptions<T>` and related options binding;
- direct environment-variable access;
- dependency-injection registration or bootstrap configuration;
- explicit configuration parsing or mapping code.

Connect a consumer to the configuration chain only when key mapping, binding
metadata, constructor/property wiring or equivalent evidence supports it.

Stop at the consumer when the question is about configuration resolution. If the
question also asks what behavior the consumer triggers, allow the agent to
compose the appropriate execution or impact capability rather than extending
this skill into general execution tracing.

## Cross-repository configuration

Configuration may originate outside the application repository.

Use existing workspace knowledge and previously established repository
relationships before broad source inspection. Cross a repository boundary when
evidence indicates, for example:

- a deployment repository defines variables for an application service;
- Helm charts or Kubernetes manifests deploy a workspace application;
- a Compose repository supplies environment variables to another repository's
  artifact;
- a shared library defines a configuration contract consumed by applications;
- a shared configuration repository is referenced by deployment or bootstrap
  code.

Confirm the relationship from configuration, manifests, artifact identity,
repository metadata or matching configuration contracts. Repository proximity,
name similarity or Git submodule membership alone is insufficient proof that one
repository configures another.

## Secrets and sensitive configuration

Never expose, reproduce or infer secret values.

Classify sensitivity from the role of the configuration key, not from whether its
current value appears harmless, synthetic, local-only or committed to the
repository. Values for credential-bearing keys remain sensitive even when they are
examples or declared defaults.

Never reproduce values for configuration keys or fields representing:

- passwords or passphrases;
- secrets or client secrets;
- tokens or API keys;
- private keys;
- access credentials or equivalent authentication material.

For such keys, report only that a value or default is declared, where it comes
from and how it participates in the configuration chain. Do not print the value,
including when the user supplied a broader request to show defaults, unless the
user explicitly asks for that exact sensitive value and applicable policy allows
it.

If relevant configuration is supplied through a secret mechanism, report only
non-sensitive metadata needed for the chain, such as:

- secret or variable name when it is already part of configuration structure;
- the fact that a Secret, credential provider or protected environment variable
  supplies the value;
- the consumer that receives it, when safe and evidenced.

Do not open unrelated secret files merely to determine the concrete value. For
secret-prone sources such as `.env` files, prefer a targeted key-name search or
other metadata-level evidence before reading the whole file, and inspect content
only when it is necessary to establish the non-secret configuration chain. Do
not decode secret payloads. Do not infer a missing credential from naming,
examples or neighboring environments.

### Credential output gate

Before returning the final answer, perform a second, output-level sensitivity pass
over every configuration value that would be reproduced. This pass is mandatory
and independent from earlier retrieval-time or analysis-time redaction decisions.

Never reproduce a value belonging to a credential-bearing key anywhere in the
answer. This applies globally to:

- evidence excerpts and quoted configuration fragments;
- configuration chains and diagrams;
- examples and hypothetical branches;
- summaries, tables and conclusions;
- recommendations or suggested follow-up commands.

When a credential-bearing key must be shown, preserve the key or source name only
when useful and replace its value with a neutral marker such as `<redacted>` or
state only that a value is defined.

If any credential value appears in a draft response, remove it before returning
the answer, even when the value is a repository default, development credential,
example, placeholder or synthetic test value.

When the requested configuration does not require credential-bearing values, omit
those keys entirely instead of reproducing them with redacted values.

## Mandatory final-answer validation

Immediately before returning the answer, validate the complete proposed output.
This validation is mandatory and applies after all summarization, examples,
diagrams, recommendations and follow-up suggestions have been drafted.

### Credential scan

Inspect every configuration value appearing anywhere in the proposed answer,
including quoted source excerpts, evidence sections, chains, diagrams, examples,
summaries, conclusions and follow-up suggestions.

If a key is credential-bearing, remove its value regardless of whether the value
is a default, placeholder fallback, example, fixture, development value or
repository-defined value. This includes keys or fields representing or containing
concepts such as:

- `password`, `passwd` or `pwd`;
- `secret`;
- `token`;
- `api-key` or `apikey`;
- `client-secret`;
- `private-key`;
- credentials or access credentials.

Do not reproduce the sensitive value even inside an otherwise useful configuration
snippet. If the key is necessary to explain the chain, show only the key and a
neutral marker such as `<redacted>` or state that the value is defined. If the key
is not necessary to the requested configuration, omit it entirely.

### Unresolved-branch scan

For every branch containing an unresolved edge, scan the complete proposed answer
for any value downstream of that edge. Remove every such value from analysis,
examples, summaries, conclusions, recommendations and follow-up options.

Do not offer to assume, approximate or apply the missing semantics as an
alternative. Do not include the downstream value merely to illustrate what a
verification might produce.

The only valid continuation for an unresolved edge is to identify the concrete
evidence or verification that could establish the edge and allow the branch to be
reopened in a future analysis.

## Uncertainty discipline

For every important conclusion classify it as one of:

- confirmed by explicit declaration or binding;
- confirmed override/precedence relationship;
- conditional on a profile, environment or runtime input;
- inferred but not established;
- unavailable from workspace evidence.

State exactly what additional evidence would be required to resolve an important
unknown, such as the active profile, environment variable value, deployment
parameter or resolved framework behavior.

Do not silently choose the most likely environment or deployment.

## Reporting

Prefer a compact answer centered on the requested setting.

When useful, report:

1. the logical configuration key and relevant aliases;
2. the concrete configuration chain with each non-trivial edge labeled as directly
   evidenced, externally verified, runtime-dependent or unresolved;
3. declared defaults and demonstrated overrides, redacting credential-bearing
   values regardless of whether they are examples or repository defaults;
4. the effective value, only if every required semantic edge is established;
5. unresolved runtime inputs;
6. the binding/consumer location;
7. repository boundaries crossed;
8. framework/dependency evidence used only when a reported conclusion actually
   depends on verified external semantics;
9. workspace knowledge used for repository scoping, while clearly distinguishing
   documented architecture from verified external semantics;
10. limitations and conflicting evidence.

Do not add a general framework-precedence section when the concrete chain already
answers the question. If broader precedence was not verified with concrete dependency
evidence, omit it from the report rather than presenting it as background knowledge.

For an unresolved branch, report the last established value or expression, label the
blocked edge as unresolved, and state what evidence is missing. Treat that branch as
terminal in the final answer: do not include any hypothetical, conditional, probable,
typical or illustrative downstream value in any section of the response.

Before returning the answer, apply the credential output gate to the complete
response and remove any reproduced credential-bearing value that escaped earlier
redaction.

A compact chain is encouraged:

```text
application.yml: jobs.timeout=30s
    ↓ [profile override established]
application-prod.yml: jobs.timeout=${JOB_TIMEOUT:45s}
    ↓ [environment may override fallback]
JOB_TIMEOUT: runtime value unavailable
    ↓ [binding confirmed]
JobProperties.timeout
```

If the environment variable is not available, do not report `45s` as the
runtime value unless evidence establishes that the variable is absent in the
actual runtime environment.

## Stop conditions

Stop when:

- the requested declaration-to-consumer chain is sufficiently established;
- the concrete setting-specific override/supply chain already answers the precedence
  question, even if the framework supports additional theoretical property sources;
- a relevant runtime boundary makes the effective value unknowable;
- further inspection would require unrelated repositories or configuration;
- required external semantics cannot be established with available evidence;
- the question has been answered without needing broader execution or impact
  analysis.

Always remain read-only.
