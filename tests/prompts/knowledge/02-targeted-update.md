# Repository knowledge update

**Agent:** Knowledge

## Fixture

Use a disposable previously analysed repository `Demo.Service` with existing
repository knowledge and canonical coverage. The fixture should contain at least:

- one public entry point/controller;
- service/application logic;
- one explicit business rule;
- runtime configuration;
- one integration or dependency boundary;
- tests that can provide behavioural evidence.

Record the initial repository knowledge, then create controlled source changes so
expected deltas are known.

## Scenario A — interactive update

Run:

```text
/knowledge-update
```

### Expected behavior

- Invokes canonical repository inventory before repository-local inspection.
- Offers repository selection first, with `Select repository` as the recommended
  path.
- Does not inspect repository-local source before the repository is selected.
- Resolves the selected identifier canonically.
- Offers a second-stage aspect selection for the selected repository.
- Includes `Full repository update` and makes it the recommended/default aspect.
- Includes focused concerns for overview/responsibilities, execution flows,
  business rules, public interfaces/APIs, configuration/runtime wiring and
  dependencies/integrations.

## Scenario B — full repository update

Modify meaningful repository behaviour, then run:

```text
/knowledge-update Demo.Service
```

### Expected behavior

- Inspects existing validated repository knowledge before reconciliation.
- Treats prior knowledge as a baseline, not as current repository evidence.
- Acquires fresh current implementation evidence at enough depth to revalidate
  affected responsibilities and behaviour.
- Does not complete from existing knowledge, coverage, inventory, Git diff or
  discovered filenames alone.
- May use Git diff/history to identify likely areas of interest but does not rely
  on Git as the sole source of truth.
- Uses impact analysis to identify materially affected knowledge concerns.
- Adds newly supported stable knowledge and removes, corrects or qualifies stale
  claims when current evidence requires it.
- Preserves unrelated validated artifacts when they have no material delta.
- Uses `knowledge_artifact_refresh` inspect -> replace for each materially
  refreshed structured artifact instead of generic incremental patching.
- Applies claim-strength validation before deciding the material delta and before
  persistence.
- Updates coverage only through `knowledge_coverage` and preserves monotonic
  current state.

## Scenario C — targeted execution-flow update

Run:

```text
/knowledge-update Demo.Service execution-flows
```

### Expected behavior

- Focuses acquisition on the execution-flow concern.
- Reads supporting controllers/services/persistence/integration code when needed
  to validate the flow correctly.
- Does not treat the aspect as a repository path.
- Does not rewrite unrelated knowledge merely because supporting files were read.
- Preserves behavioural knowledge outside the requested concern unless current
  evidence reveals a contradiction that must be reconciled for correctness.
- Reports any necessary spillover beyond the requested artifact explicitly.
- Does not downgrade an existing `analysed` coverage state merely because this
  run intentionally inspected a narrow concern; if current evidence suggests a
  pre-existing coverage inconsistency, reports it instead of manually patching
  the canonical table.

## Scenario D — targeted configuration update

Run:

```text
/knowledge-update Demo.Service configuration
```

### Expected behavior

- Loads configuration-resolution when effective configuration/runtime wiring is
  material to the update.
- Inspects the minimum configuration definitions, overrides, bindings and runtime
  consumers necessary to establish the current effective behaviour.
- Keeps unresolved configuration precedence explicit when the evidence cannot
  establish it.
- Refreshes only materially affected knowledge artifacts.

## Scenario E — no material change

Without modifying the relevant implementation, repeat a full or targeted update.

### Expected behavior

- Inspects the existing knowledge baseline.
- Acquires fresh repository evidence appropriate to the requested scope.
- Reports no material knowledge delta when current evidence still supports the
  persisted claims.
- Preserves unchanged artifacts without replacement, reformatting or regenerated
  run-history prose.
- Keeps coverage stable unless independent current evidence justifies a stronger
  canonical state.

## Scenario F — provenance isolation

Seed existing knowledge with historical source/provenance entries, then run an
update that does not read every historically named repository file.

### Expected behavior

- Maintains a run-local ledger for the update.
- Distinguishes repository inventory, discovered paths, focused grep matches,
  content reads and existing validated knowledge.
- Never reports a repository source as read/discovered in the current run merely
  because old knowledge names it.
- Does not reconstruct current-run evidence from artifact contents, expected
  repository structure, Git diff or previous coverage notes.
- Recomputes run-relative evidence/provenance sections when a refreshed artifact
  contains them.
- Final reporting names only acquisition events visible in the current tool trace.

## Scenario G — repository without established baseline

Choose or invoke a canonical repository that has no existing validated knowledge.

### Expected behavior

- Does not silently turn maintenance into first-time initialization.
- Explains that `knowledge-init <repository>` is the appropriate workflow for
  establishing the baseline, unless the repository is part of an explicit
  supported all-update mode with an already established baseline.

## Failure checks

The test fails if any of the following occurs:

- `/knowledge-update <repository>` still behaves as a generic topic update;
- interactive mode asks for a free-form topic before canonical repository
  selection;
- a repository argument is not resolved through canonical inventory;
- existing knowledge or Git diff is treated as sufficient current evidence;
- a full update performs no fresh repository content inspection;
- a targeted update rewrites unrelated artifacts without a material reason;
- historical provenance becomes a current-run read/discovery event;
- an unchanged artifact is replaced solely because it was re-inspected;
- generic patch/edit/write is used where canonical artifact refresh is required;
- a targeted update downgrades coverage because its evidence scope was narrow;
- unsupported behavioural or toolchain-dependent claims bypass claim-strength
  validation.
