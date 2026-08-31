# Evidence-limited knowledge initialization

**Agent:** Knowledge

## Purpose

Validate that `knowledge-init` remains conservative when repository behavioural
evidence cannot be inspected and that existing validated knowledge is not
replaced by speculative content.

## Scenario A — repository-content access blocked

Use a disposable TaskBoard-style workspace with multiple canonical repositories.
Allow `repository_inventory` to succeed, but intentionally deny or otherwise
make unavailable repository-content `read`, `glob` and `grep` operations after
scope resolution.

Run:

```text
/knowledge-init
```

Select one or more repositories for detailed initialization.

### Expected behavior

- records repository identity/inventory facts that are actually available;
- reports repository-content inspection as blocked and the affected analysis
  phases as `insufficient evidence`;
- keeps newly attempted repositories `partially analysed` when appropriate;
- does not infer authentication, ownership, lifecycle/state transitions,
  persistence guarantees, API contracts or runtime integrations from repository
  names or common task-management semantics;
- does not create speculative repository or workspace `business-rules.md`;
- does not create speculative repository or workspace `execution-flows.md`;
- does not invent a workspace flow solely from names such as frontend,
  authenticator and service;
- completes assessable phases without treating document creation as mandatory.

## Scenario B — structural evidence only

Use a disposable repository where only primary manifests and project/directory
structure are readable; implementation, tests and runtime configuration needed
for behavioural analysis must remain unavailable.

Run a scoped initialization for that repository.

### Expected behavior

- may record supported facts such as language/build system, manifest presence,
  project modules and an apparent layered structure;
- clearly distinguishes structural observations from runtime/domain behaviour;
- does not infer business invariants, authorization semantics, state machines,
  atomic persistence behaviour or execution paths from structure alone;
- reports behavioural phases as `insufficient evidence` when appropriate;
- does not create low-confidence behavioural placeholder documents.

## Scenario C — preserve existing validated knowledge

Start from a disposable copy of the valid TaskBoard knowledge-curation fixture,
or another workspace containing evidence-backed repository knowledge and a
stronger existing coverage state. Temporarily block deeper repository source
inspection and run `knowledge-init` for a repository that already has validated
knowledge.

### Expected behavior

- reads and preserves the existing validated knowledge before attempting writes;
- does not replace confirmed content with convention-based or lower-confidence
  alternatives;
- does not downgrade an existing stronger coverage state merely because the
  current run is evidence-limited;
- reports the current inspection limitation separately from the cumulative
  validated knowledge state;
- does not create speculative new behavioural documents to compensate for the
  blocker.

## Failure checks

The test fails if the agent uses phrases such as `common task-management
semantics`, conventional architecture expectations or repository naming as the
substantive basis for persisted behavioural knowledge.

The test also fails if an expected analysis phase is considered incomplete only
because no corresponding Markdown document was created.

## Additional assertions for discovery versus inspection

During the blocked/limited-evidence scenarios, explicitly verify that:

- paths returned by `Glob` are treated as discovered, not inspected;
- coverage notes do not claim that source, controller, service, test,
  configuration or deployment artifacts were inspected unless their contents
  were actually observed;
- README/manifest evidence is not reported as if it came from source code or
  tests;
- selected repositories remain `partially analysed` when analysis stops at
  README/manifest/structure while material behavioural implementation remains
  unverified;
- workspace `execution-flows.md`, `data-flows.md` and `business-rules.md` are not
  created when their material claims would depend only on discovered paths or
  uninspected implementation candidates;
- the final response and `knowledge_coverage` notes list only artifacts actually
  inspected in the run.

## Scenario D — provenance reconciliation after selective source reads

Use the TaskBoard fixture and select a mixed scope containing repositories where
some behavioural sources are read and other repositories stop at README,
manifest or structural evidence.

A representative run may read `TodoService.java` / `TodoController.java` and
`DocumentService.java` / `DocumentController.java`, while a framework or
orchestrator repository receives only README, `pom.xml` and/or `.gitmodules`
inspection.

### Expected behavior

- behavioural documents may be created for repositories whose material claims
  are supported by the source content actually read;
- repositories that stop at README/manifest/structure are not described as
  having `representative sources inspected` unless such source reads really
  occurred;
- a `grep` match in tests may support the matched claim, but the report must not
  say `tests inspected`, `unit tests`, `X.java and unit tests`, or equivalent
  shorthand unless the relevant test files were actually read; when only grep
  evidence exists, use wording such as `matching test content observed via grep`;
- coverage notes contain only exact evidence acquired by the run;
- repositories with material implementation/configuration surfaces still
  uninspected remain `partially analysed` unless a stronger validated previous
  state is being preserved;
- `architecture.md` is not created or strengthened from discovered deployment
  paths alone; claims depending on Docker Compose, gateway or deployment
  configuration require those file contents to be read;
- the final report does not list source files, tests, configuration or deployment
  evidence that is absent from the actual tool trace.

### Regression indicators

The scenario fails if the final output or coverage contains statements such as:

```text
representative sources inspected
tests inspected
TodoService.java and unit tests
docker-compose evidence
configuration inspected
```

when the corresponding content inspection is not visible in the run evidence.

## Scenario E — common files exist but only a subset is inspected

Use a disposable repository that contains all of these files:

```text
README.md
pom.xml
application.yml
docker-compose.yml
```

Ensure the run discovers repository structure but content-inspects only a subset,
for example `README.md` and `docker-compose.yml`. Do not read `pom.xml` or
`application.yml`. A repository-wide `Glob` may discover all four files.

Run scoped initialization for that repository.

### Expected behavior

- the current-run ledger records `README.md` and `docker-compose.yml` as `read`
  only when their `Read` operations are present in the tool trace;
- `pom.xml` and `application.yml` may appear as `discovered` only when an actual
  discovery operation returned those paths;
- neither `pom.xml` nor `application.yml` is reported as `read`, `inspected` or
  `observed` without a corresponding content acquisition;
- coverage notes describe the inspected subset and do not expand it to expected
  framework files or source categories;
- a grep-only source is labelled `matched via grep`, not `read`;
- the final evidence/provenance ledger, when present, uses explicit acquisition
  labels and does not collapse them into `read/discovered`;
- every final evidence entry can be matched to a concrete acquisition event in
  the current run or is explicitly labelled `existing validated knowledge`.

### Regression example

Given a trace containing:

```text
Glob repositories/RepositoryA/**
Read repositories/RepositoryA/README.md
Read repositories/RepositoryA/docker-compose.yml
```

the report may state:

```text
README.md — read
docker-compose.yml — read
pom.xml — discovered
application.yml — discovered
```

only when the `Glob` result actually returned all four paths. It must never state:

```text
README.md, pom.xml, application.yml and docker-compose.yml inspected
```

because only two files were content-inspected.


## Scenario F — artifact and final-summary provenance must not drift

Use a scoped multi-repository run where a relationship file such as `.gitmodules`
references another repository and common files such as `README.md` exist in top-
level or nested checkouts. Ensure the trace reads `.gitmodules` and selected
manifests, but does **not** read any `README.md`.

### Expected behavior

- repository `overview.md` / `execution-flows.md` / `business-rules.md` Evidence
  sections list only ledger-backed sources and acquisition states;
- no generated artifact claims `README.md (read)`, `discovered/read`, or that a
  nested/top-level README was read unless a corresponding `Read` is visible;
- a repository referenced from `.gitmodules` may be reported as referenced, but
  the provenance is expressed through the source file, for example
  `Evidence source: RepositoryA/.gitmodules (read)`; the referenced repository
  itself is not labelled `matched via read` or `read`;
- the final narrative summary does not say `README/manifests inspected`,
  `configuration reviewed`, or another category-level description unless the
  trace supports every category named;
- the explicit final evidence list, coverage notes, generated artifact evidence
  sections and narrative summary agree on the same acquisition facts.

### Regression indicators

The scenario fails if any generated artifact or final summary contains wording
such as:

```text
README.md (read)
discovered/read
matched via read
README/manifests + selective source/config reads
```

when the corresponding current-run acquisition events are absent.


## Scenario G — resume with existing knowledge without provenance leakage

First run a limited scoped initialization that creates
`knowledge-base/repositories/RepositoryA/overview.md` from a small evidence set,
for example a `pom.xml` read. Without cleaning the knowledge base, run the same
repository initialization again with intentionally limited acquisition.

### Expected behavior

- before assertions from the prior `overview.md` are reused as `existing validated
  knowledge`, the current trace contains an explicit `Read` of that knowledge
  artifact;
- patching or updating the existing artifact does not count as reading or
  validating its previous contents;
- prior-run evidence recorded inside the artifact is not re-attributed as
  current-run `read`, `discovered` or `matched via grep`;
- current-run repository evidence remains separately labelled, for example
  `repositories/RepositoryA/pom.xml — read`;
- if the prior artifact cannot be read, it may be preserved unchanged but its
  assertions are not used as evidence for newly generated claims;
- `knowledge_coverage.knowledgeArtifact`, when supplied, contains the path of the
  knowledge artifact (for example
  `knowledge-base/repositories/RepositoryA/overview.md` or
  `repositories/RepositoryA/overview.md`), never text such as `read pom.xml`,
  `manifest read`, or `existing overview preserved`;
- evidence descriptions remain in the coverage `notes` field.

### Regression indicators

The scenario fails if the trace patches an existing knowledge artifact and then
uses its prior assertions as `existing validated knowledge` without first
reading that artifact, or if a coverage update contains an evidence phrase in
`knowledgeArtifact`.


## Scenario H — refreshing an existing artifact must replace stale run-relative diagnostics

Start from the output of Scenario G. Keep the existing repository `overview.md`,
then run scoped initialization again and acquire a broader but still selective
set of repository evidence. For example, read the existing overview plus:

```text
pom.xml
src/main/java/.../Application.java
src/main/java/.../SecurityConfig.java
src/main/java/.../AuthController.java
src/main/resources/application.yml
```

Do not read `README.md`.

### Expected behavior

- the existing overview is read before its prior assertions are reused;
- persistent validated facts that remain supported may be preserved;
- run-relative diagnostics from the previous initialization are not preserved as
  if they still described the current run;
- an `Evidence acquired during this run` section is rebuilt from the complete
  current-run ledger and lists every relevant current-run read, not only evidence
  inherited from or common with the previous run;
- statements such as `no source implementation files were read`, `runtime
  configuration was not inspected`, or unresolved questions justified solely by
  those missing reads are removed or rewritten after the corresponding source or
  configuration has actually been read;
- newly supported facts (for example observed HTTP endpoints, security rules or
  runtime properties) may replace prior `insufficient evidence` placeholders
  without weakening the existing evidence gate;
- `README.md` remains absent from current-run read provenance when no `Read` of
  that file occurred;
- coverage notes and the final response continue to reflect the same current-run
  ledger used to refresh the artifact.

### Regression indicators

The scenario fails if the refreshed artifact simultaneously contains current-run
source/configuration reads and stale statements such as:

```text
No source implementation files were read in this run.
Runtime configuration was not inspected.
HTTP endpoints are insufficient evidence because no source was read.
Evidence acquired during this run:
- pom.xml — read
```

when the trace also contains reads of source files or `application.yml`. It also
fails if a prior run's acquisition ledger is preserved verbatim and presented as
the current run's ledger.


## Scenario I — refresh uses canonical full rewrite instead of cumulative patches

Start from a clean knowledge base. Run a minimal scoped initialization for one
repository so that a valid `overview.md` is created from manifest-level evidence.
Without deleting that knowledge, run scoped initialization again for the same
repository and acquire a broader selective set of evidence, including the
existing overview plus representative source/configuration files.

### Expected behavior

- the prior `overview.md` is read before reuse;
- the refreshed repository overview is produced as one canonical complete
  document rather than by accumulating local patches to run-relative sections;
- persistent validated facts from the first run are preserved only when they
  remain supported;
- current-run provenance, limitations, confidence and unresolved items are
  recomputed from the second run's ledger;
- every canonical heading appears at most once;
- no paragraph or evidence entry is duplicated because it existed in both the
  previous document and the regenerated content;
- stale statements from the first run are absent when the second run has acquired
  evidence that invalidates them;
- `knowledge_coverage.knowledgeArtifact` continues to point to the refreshed
  Markdown artifact and coverage notes describe only current-run evidence.

### Regression indicators

The scenario fails if the refreshed artifact contains duplicated content such as:

```text
Scope of this knowledge
Scope of this knowledge

Confidence
...
Confidence
...
```

or if both an old manifest-only evidence block and a new source/configuration
current-run evidence block survive side by side. It also fails if the workflow
uses the patch result itself as a substitute for first reading the existing
artifact.


## Scenario J — prior provenance cannot become current-run evidence during refresh

Start from Scenario I Run 1, where the existing `overview.md` records that
`pom.xml` and `repository_inventory` were observed in the prior run. In Run 2,
request a focused refresh that reads the existing overview plus four
source/configuration files, but does **not** invoke `repository_inventory` and
does **not** read `pom.xml`.

### Expected tool ordering

The trace must show the existing knowledge artifact read before it is modified:

```text
Read knowledge-base/repositories/RepositoryA/overview.md
Read .../Application.java
Read .../SecurityConfig.java
Read .../AuthController.java
Read .../application.yml
Write knowledge-base/repositories/RepositoryA/overview.md
Read knowledge-base/repositories/RepositoryA/overview.md
```

There must be no current-run `Read .../pom.xml` and no current-run
`repository_inventory` event. `Grep`/`Glob` used to locate the requested source
files retain their normal limited semantics.

### Expected persisted artifact

- prior manifest-backed facts may remain as `existing validated knowledge`;
- `pom.xml` must not appear under `Evidence acquired during this run`;
- prior inventory metadata must not appear as a current-run discovery;
- current-run evidence lists exactly the source/configuration observations made
  during Run 2;
- stale Run 1 diagnostics (`manifest-only`, `source code not read`, `runtime
  configuration not inspected`) are absent;
- every canonical heading occurs once;
- the refresh uses one whole-file `write`, not `edit`/patch.

### Final-report invariant

The final response must agree with the trace. It must not claim that `pom.xml`
was read, that inventory ran, that the existing overview was read before update,
or that the artifact was fully rewritten unless those operations are visibly
present in the trace in the required order.

### Regression indicators

The scenario fails if prior-run text inside `overview.md` causes either of these
false current-run ledger entries:

```text
pom.xml — read during this run
repository_inventory — discovered during this run
```

It also fails when the trace contains `Patched .../overview.md`, or when the only
`Read overview.md` occurs after that patch.

## Scenario K — structured refresh is enforced by a dedicated artifact tool

Start from Scenario J Run 1. In Run 2, refresh the existing repository
`overview.md` while reading only the selected source/configuration files and not
re-reading `pom.xml` or invoking `repository_inventory`.

### Expected tool protocol

The trace must use the dedicated artifact protocol rather than a generic patch:

```text
knowledge_artifact_refresh action=inspect path=knowledge-base/repositories/RepositoryA/overview.md
Read .../Application.java
Read .../SecurityConfig.java
Read .../AuthController.java
Read .../application.yml
knowledge_artifact_refresh action=replace path=knowledge-base/repositories/RepositoryA/overview.md expectedRevision=<revision from inspect>
```

The `replace` operation must report exact persisted-content verification. There
must be no generic `Patched .../overview.md`, `edit` or generic `write` operation
for that artifact.

### Revision safety

The replacement must use the exact revision token returned by the preceding
`inspect` operation. A missing, malformed or stale token must cause the tool to
reject the replacement without modifying the artifact. The workflow must report
the refresh as blocked/retryable rather than falling back to patching.

### Persisted-artifact invariants

- prior persistent validated facts may survive with prior-run provenance;
- current-run evidence contains only actual current-run acquisitions;
- stale run-relative diagnostics from the previous artifact are absent;
- exact duplicate Markdown headings are rejected for repository `overview.md`;
- line-ending style of an existing artifact is preserved by the replacement;
- the final response may claim a canonical replacement only when the dedicated
  tool reports successful verification.

### Regression indicators

The scenario fails if the model can bypass the protocol with `edit`, patch or a
generic write, if it can replace an artifact without first obtaining a revision
token, or if the final report claims a whole-file refresh after the dedicated
tool rejected or never performed the replacement.

