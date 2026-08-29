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
