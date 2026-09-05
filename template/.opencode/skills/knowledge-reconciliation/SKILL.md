---
name: knowledge-reconciliation
description: Deeply reconcile existing repository knowledge with current repository evidence
---

# Knowledge reconciliation

Use this skill when validated repository knowledge already exists and must be
reconciled with current repository evidence, either for a full repository
refresh or a targeted knowledge concern.

The invoking command supplies the repository and optional aspect through its
command arguments. Apply the workflow contract below exactly. Existing
knowledge is a comparison baseline rather than current evidence, while shared
claim validation, persistence and deterministic artifact/coverage safeguards
remain owned by their dedicated skills and tools.

Repository and optional knowledge aspect supplied by the user:

$ARGUMENTS

Use `knowledge-update` as the primary maintenance workflow for repositories that
already have validated knowledge and have changed meaningfully since that
knowledge was established.

The semantic distinction is:

```text
knowledge-init
    establish or extend a reliable knowledge baseline

knowledge-update
    deeply reconcile existing knowledge with repository changes
```

`knowledge-init` may still reconcile existing repositories and remains the
continuation mechanism for incomplete initialization. Do not use
`knowledge-update` merely to finish a repository that has never reached the
required initialization depth.

Load before starting:

- `knowledge-generation`;
- `workspace-reading`;
- `safe-file-writing`;
- `repository-analysis`;
- `impact-analysis`.

`knowledge-generation` is mandatory for every persistent write. Existing
validated knowledge is a baseline, not an exemption from claim-strength
validation and not current-run repository evidence.

Load concern-specific skills according to the resolved update concern. For a
targeted aspect, loading the skill that covers that concern is mandatory rather
than optional. Preserve the full semantic scope of each skill:

- `execution-flow-analysis` for execution flows, processing paths, data movement
  and transformation;
- `business-rule-analysis` for business rules, lifecycle, validation,
  authorization, idempotency, retry/compensation and other behavioural rules;
- `configuration-resolution` for configuration, profiles, environment
  overrides, runtime wiring, effective configuration resolution and
  configuration consumers;
- `dependency-inspection` only when an update depends on external package,
  framework or toolchain semantics that repository evidence cannot establish
  efficiently;
- `architecture-analysis` only when a material architecture concern is in scope
  and sufficient current evidence exists.

For a full repository update, load concern-specific skills as the current
knowledge baseline and acquired repository evidence make those concerns
material. Do not load `execution-flow-analysis` as a generic substitute for a
different targeted concern.

## Invocation parsing

Interpret `$ARGUMENTS` as one of these modes:

```text
/knowledge-update
/knowledge-update <repository>
/knowledge-update <repository> <aspect>
```

A repository argument must resolve to exactly one canonical immediate child of
`repositories/` returned by `repository_inventory`.

An aspect is a knowledge concern, never a repository path. Normalize reasonable
aliases to the supported concern set below:

- `full` -> Full repository update;
- `overview`, `responsibilities` -> Overview / responsibilities;
- `execution-flows`, `flows` -> Execution flows;
- `business-rules`, `rules` -> Business rules;
- `interfaces`, `apis`, `public-interfaces` -> Public interfaces / APIs;
- `configuration`, `runtime-wiring`, `config` -> Configuration / runtime wiring;
- `dependencies`, `integrations` -> Dependencies / integrations.

Reject an unknown repository or unsupported aspect explicitly. Do not reinterpret
an aspect as a file or directory path.

Always invoke `repository_inventory` before repository-local source inspection so
repository identity is resolved against the canonical workspace inventory.
Use `knowledge_inventory` as the authoritative structural inventory of persisted
repository knowledge. `glob` may support non-authoritative exploration, but it
must never decide baseline eligibility or which repository knowledge artifacts
exist.

## Interactive mode

When `$ARGUMENTS` is empty, use the built-in `question` tool when available.

The pre-selection phase is discovery-only. Before a repository is selected, do
not read, glob, grep or otherwise inspect `repositories/<repo>/**` and do not
write repository knowledge.

Ask the first question with mutually exclusive options:

- `Select repository` (recommended/default);
- `Cancel`.

When `Select repository` is chosen, invoke `knowledge_inventory` and intersect
its repository entries with the canonical identifiers returned by
`repository_inventory`. Ask the repository-selection question with exactly one
option for each canonical repository whose knowledge inventory contains at least
one repository artifact. Use exact canonical identifiers as labels and allow one
repository selection.

Persisted analysed/partially-analysed coverage may be shown as supporting state,
but coverage alone does not make a repository eligible when no inspectable
repository artifact exists. If no canonical repository has repository knowledge,
report that `knowledge-init` is required rather than using `glob` as a fallback
eligibility check.

After a single repository is selected, ask the next question for the update
aspect with these mutually exclusive options:

- `Full repository update` (recommended/default);
- `Overview / responsibilities`;
- `Execution flows`;
- `Business rules`;
- `Public interfaces / APIs`;
- `Configuration / runtime wiring`;
- `Dependencies / integrations`.

After interactive selection, normalize the answers to the same canonical
`repository` and `aspect` values used by argument parsing and continue through
the same baseline-eligibility, evidence-acquisition and reconciliation workflow.
Interactive mode only resolves missing input; it must not introduce a separate
maintenance path or weaker full-update semantics.

If the `question` tool is unavailable or fails before selection is obtained, do
not retry it repeatedly. Report the canonical repositories and provide directly
executable examples for repository-full and repository-aspect invocation, then
stop without repository-local source inspection or knowledge writes.

## Baseline eligibility

`knowledge-update` requires an established repository knowledge baseline. After
canonical repository resolution, invoke:

```text
knowledge_inventory(repository="<canonical-repository>")
```

Use its returned canonical artifact list to determine structural baseline
existence. The repository is eligible for maintenance only when at least one
repository knowledge artifact exists and at least one relevant existing artifact
can be content-inspected before its claims are reused. Artifact existence is not
semantic validation.

Do not use `glob`, directory enumeration, conversational/session memory or
persisted coverage as substitutes for `knowledge_inventory`. Persisted coverage
may describe canonical state but does not substitute for an inspectable knowledge
artifact.

If the repository has no existing validated repository knowledge, stop before
repository-local maintenance writes and recommend:

```text
/knowledge-init <repository>
```

Do not silently convert update into first-time initialization. A partially
analysed repository may still be updated when it has an actual validated
baseline; `knowledge-init <repository>` remains the preferred command when the
user's purpose is to complete missing initialization depth rather than reconcile
post-development changes.

## Existing knowledge baseline

Before deciding what changed for a selected repository:

1. use the selected repository entry returned by `knowledge_inventory` as the
   canonical artifact inventory, then inspect the relevant existing repository
   knowledge through `knowledge_artifact_refresh(action=inspect)`;
2. inspect relevant workspace knowledge that contains validated relationships or
   flows involving the repository;
3. read its persisted coverage state from the workspace overview when present;
4. separate persistent validated claims from historical/run-relative provenance;
5. identify the claims and knowledge concerns that require current revalidation.

For structured repository artifacts that may be refreshed, use
`knowledge_artifact_refresh(action=inspect)` as the canonical inspection path
before relying on their claims or replacing them.

Historical evidence recorded in an existing artifact is never promoted to
current-run discovery, grep or read evidence. A repository source named in old
knowledge is current evidence only after a corresponding current-run acquisition
operation actually observes it.

## Change and relevance analysis

The authoritative comparison is:

```text
existing validated knowledge
vs.
current repository evidence
```

Use `impact-analysis` to determine which existing responsibilities, behaviours,
interfaces, configuration relationships, integrations and knowledge artifacts
are likely to require revalidation.

Git information may be used as an optimization when a reliable baseline is
available. `git status`, `git diff`, history or changed-file lists may narrow the
likely source set, but they are never the sole source of truth and never replace
current evidence acquisition.

The workflow must remain valid when Git history is absent, the baseline revision
is unknown, several changes accumulated, or knowledge came from a different
revision.

Do not require the user to identify changed files.

## Full repository update

For an explicit repository-only invocation or an interactive selection resolved
to `Full repository update`:

```text
/knowledge-update <repository>
```

perform the same detailed repository refresh. Use the artifact list returned by
`knowledge_inventory(repository="<canonical-repository>")` as the authoritative
repository knowledge inventory. Before deciding that any existing repository
knowledge artifact is unaffected, canonically inspect every artifact in that
inventory. Do not rediscover or narrow this inventory with `glob`.

The inventory defines the validated concerns that the full update must reconcile;
do not inspect only `overview.md` and infer that other persisted artifacts remain
valid.

### Persisted-concern routing barrier

Immediately after the persisted artifact inventory has been inspected, resolve
the owning capabilities for every persisted concern artifact and invoke those
capabilities before continuing with repository-local evidence acquisition for the
full update. This is a workflow barrier, not a relevance hint.

Apply this sequence in order:

1. inspect every persisted artifact returned by `knowledge_inventory`;
2. derive the required concern-capability set from those persisted artifact
   identities;
3. invoke every capability in that set through the `Skill` mechanism;
4. only after those invocations complete, acquire repository evidence and
   reconcile the concerns;
5. only after concern-owned evidence acquisition may an artifact reach the
   preserve/replace decision.

Do not start a generic repository evidence pass between steps 2 and 3. Do not
defer a required concern capability until after generic reads have already made
the concern appear unchanged. Direct `read`, `glob`, `grep` or repository-level
reasoning cannot satisfy this routing barrier.

Use persisted artifact identity to derive the owning capability where one exists:

- `execution-flows.md` -> `execution-flow-analysis`;
- `business-rules.md` -> `business-rule-analysis`;
- `configuration.md` -> `configuration-resolution`.

For example, if `configuration.md` is present in the inspected inventory,
`configuration-resolution` must be invoked in step 3 even when generic source
reads have not yet exposed a configuration change. The capability then owns the
configuration evidence surface and may invoke deterministic discovery tools such
as `repository_config_inventory`.

Other artifacts may remain under repository-level analysis when no dedicated
concern capability exists. This mapping is capability routing, not file-format or
technology-specific evidence discovery.

A full update that reaches repository evidence acquisition or a preserve/replace
decision while an owning capability required by the inspected persisted artifact
set has not been invoked is incomplete and must not report successful
reconciliation.

A full update must normally acquire enough current implementation evidence to
revalidate the repository knowledge more deeply than a broad baseline
initialization. Selectively inspect relevant current surfaces such as:

- manifests and entry points;
- controllers, handlers or other public interfaces;
- representative service/application logic;
- domain logic and business rules;
- persistence interactions;
- runtime configuration and profile-specific wiring;
- outbound/inbound integration boundaries;
- tests that provide material behavioural evidence;
- deployment/orchestration configuration when it materially affects repository
  behaviour.

This is evidence-driven depth, not an instruction to read the whole repository.
Follow likely impacts until the existing claims can be confirmed, corrected,
qualified or removed and new stable reusable behaviour can be assessed.

Do not complete a full update after only reading existing knowledge, inventory,
Git metadata or filenames. A no-material-change result is valid only after
sufficient fresh repository content inspection for the claims being revalidated.

### Concern-owned evidence acquisition during full updates

For every persisted concern represented by the repository knowledge inventory,
acquire fresh concern-appropriate evidence before deciding that its artifact is
unaffected. Loading the owning concern skill is mandatory where such a capability
exists, and loading it is not sufficient by itself: delegate evidence acquisition
to that capability so it can inspect the current repository surfaces that can
establish or contradict the persisted claims.

In particular, when a persisted `configuration.md` artifact exists, a full
repository update must load `configuration-resolution` and let that capability
own configuration-source discovery and interpretation. Do not encode
framework-, language- or filename-specific configuration discovery rules in
this reconciliation workflow.

`configuration-resolution` may use `repository_config_inventory` to obtain a
deterministic repository-local candidate inventory before selectively reading
and interpreting relevant configuration sources and consumers. The inventory is
discovery evidence only: the configuration capability remains responsible for
deciding which candidates participate in the configuration chain.

Do not infer that a configuration declaration or concrete repository-defined
value is absent merely because consumer code was inspected and no configuration
file happened to be read. Before preserving `configuration.md` with a
no-material-change result, require the configuration capability to establish
that relevant current configuration sources were inspected or that deterministic
repository-local discovery produced no plausible source for the documented
configuration concern.

Apply the same principle to other persisted concern artifacts: the full update
must obtain evidence through the capability that owns that concern rather than
reusing a generic set of source files for every artifact.

## Targeted aspect update

For:

```text
/knowledge-update <repository> <aspect>
```

focus evidence acquisition and reconciliation on that knowledge concern.

The aspect narrows the primary concern, not the supporting evidence boundary.
Read supporting implementation/configuration outside the obvious artifact when
it is necessary to validate the requested concern correctly.

Examples:

- `execution-flows` may require controllers, services, persistence calls and
  integration clients;
- `business-rules` may require validators, domain/service logic and behavioural
  tests;
- `configuration` requires `configuration-resolution` and may require manifests,
  configuration files, binding code and runtime consumers;
- `dependencies` may require manifests plus the repository code that actually
  uses the integration.

For a targeted `configuration` update, do not stop at the configuration source
when a new, removed or changed property can reasonably be traced further inside
the selected repository. For each material changed property:

1. identify the declared key, aliases/overrides and default or profile-specific
   values from current evidence;
2. search selectively for binding or consumption of that key (for example
   configuration-properties binding, direct value injection, environment lookup,
   framework binding or another repository-local reference);
3. content-inspect the relevant binding/consumer when found;
4. distinguish a confirmed declaration, a confirmed binding/consumer and actual
   runtime use/enforcement as separate claim strengths;
5. keep downstream runtime behaviour unresolved when the inspected consumer does
   not establish it.

A configuration update may conclude with `binding/consumer not found` only after
a reasonable repository-local search for the changed property or its binding
mechanism. Do not infer absence merely because the configuration file itself was
read.

Do not rewrite unrelated knowledge artifacts merely because they were read as
supporting evidence. Preserve validated knowledge outside the requested concern
unless current evidence reveals a material contradiction that must be reconciled
to keep the knowledge base internally correct. Report such necessary spillover
explicitly.

## Artifact impact and refresh

After evidence acquisition:

1. map material current evidence to existing knowledge claims;
2. identify which canonical knowledge artifacts are materially affected;
3. re-apply the `knowledge-generation` claim-strength gate to every new, revised
   or preserved material claim involved in reconciliation;
4. preserve an artifact unchanged when no material evidence-backed delta exists;
5. refresh only materially affected artifacts.

For an existing structured knowledge artifact, use the canonical protocol:

```text
knowledge_artifact_refresh inspect
        ↓
reconcile existing validated claims with current-run evidence
        ↓
material delta?
        ├─ no  → preserve unchanged
        └─ yes → render complete canonical artifact
                    ↓
          knowledge_artifact_refresh replace
```

Do not use generic `edit`, `write`, patching or append-only mutation as a
substitute for canonical whole-artifact refresh where
`knowledge_artifact_refresh` applies.

A material delta includes a supported responsibility/behaviour/interface/rule or
relationship being added, removed, corrected, materially qualified or made
obsolete. Formatting-only differences, reordered prose, regenerated evidence
lists with no semantic change, or a fresh inspection that merely confirms the
existing artifact are not material deltas.

## Cross-repository reconciliation

When current evidence changes a repository boundary, inbound/outbound
interaction, data contract, cross-repository execution flow, runtime integration
or orchestration relationship, reconcile only the affected workspace knowledge
and related repository knowledge for which the evidence is sufficient.

Do not deeply inspect unrelated repositories merely because the selected
repository references them. Use evidence originating from the selected
repository, existing validated knowledge and permitted workspace-level sources
unless another repository is explicitly included in the update scope.

`knowledge-curate` remains responsible for corpus organization, duplication,
ownership, placement and stale/redundant document structure. Do not turn a
repository update into general curation.

## Evidence provenance

Maintain the same run-local evidence ledger required by `knowledge-generation`
for `knowledge-init`.

Keep these classes distinct:

- repository inventory facts;
- discovered paths;
- focused grep matches;
- content-read repository files;
- existing validated knowledge;
- historical evidence/provenance contained in previous knowledge runs.

Only completed current-run acquisition operations may populate the first four
current-evidence classes. Existing knowledge contributes claims only after its
artifact has been content-inspected in the current run and remains labelled as
existing validated knowledge.

Before artifact persistence, coverage updates and the final report, reconcile all
provenance statements against the run-local ledger. Never report a repository
file as read because it appears in prior knowledge or old provenance.

## Coverage behaviour

`knowledge-update` uses the same canonical repository coverage projection as
`knowledge-init`.

After repository reconciliation, invoke `knowledge_coverage` with only
current-run evidence-backed state changes when a coverage transition is
justified. The tool owns monotonic merge and the complete
`## Repository coverage` section; never patch that table manually.

A targeted update is not a coverage downgrade signal. Preserve a stronger
validated prior state when the current run intentionally inspected only the
requested concern. For example, an `analysed` repository remains `analysed` after a focused
business-rule update. If current evidence instead suggests that the persisted
coverage projection is inconsistent or overstated, report that consistency
problem; do not bypass the monotonic tool with a manual downgrade.

Do not strengthen coverage merely because an update command was run. Strengthen
it only when the current evidence satisfies the canonical coverage criteria.
Read the persisted workspace overview after a coverage tool call and verify the
result as required by `knowledge-generation`.

## No material change

When relevant current repository evidence is materially consistent with the
existing validated knowledge:

- preserve the affected artifacts byte-for-byte;
- do not replace them through canonical refresh merely to record that the check
  happened;
- do not introduce run-history prose into persistent knowledge;
- preserve canonical coverage unless stronger current evidence independently
  justifies an advance;
- report that no material knowledge delta was found and name the current-run
  evidence actually acquired.

## Final report

Keep the final response concise and derive it from the actual tool trace.

Report:

- canonical repository/repositories updated;
- requested aspect or full-update scope;
- current-run evidence acquired, distinguishing discovered, grep-matched and read
  sources from existing validated knowledge;
- knowledge artifacts preserved, refreshed or created;
- material findings added, removed, corrected or qualified;
- coverage changes, if any;
- unresolved blockers or evidence gaps.

Do not report files as inspected unless their content was actually observed in
this run. Do not present historical provenance as current-run evidence.
