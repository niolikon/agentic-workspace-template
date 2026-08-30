# Resumable repository knowledge initialization

**Agent:** Knowledge

## Fixture

Use a disposable workspace containing at least two immediate child repositories
under `repositories/`: `service-a` and `service-b`. Ensure `service-a` contains
README/manifest evidence plus implementation and configuration that can support
detailed repository knowledge.

## Scenario A — resume partially analysed repository

Start with source inspection for `service-a` intentionally unavailable or
blocked while inventory and limited repository evidence remain accessible. Run:

```text
/knowledge-init service-a
```

Verify that the run preserves only evidence-backed knowledge and leaves
`service-a` as `blocked` when detailed inspection cannot start at all, or
`partially analysed` when detailed analysis starts but cannot be completed.

Restore normal source access, start a new session without deleting the knowledge
base, and run the same command again:

```text
/knowledge-init service-a
```

### Expected behavior

- Reads existing repository knowledge and workspace coverage before updating it.
- Does not skip `service-a` merely because `overview.md` or another generated
  artifact already exists.
- Retries the detailed initialization surfaces that were unavailable before.
- Preserves stronger validated content from the previous run.
- Enriches or corrects knowledge only when current inspected evidence supports
  the change.
- Performs relevant cross-repository reconciliation without crossing the scoped
  read barrier.
- Invokes `knowledge_coverage` and promotes `service-a` to `analysed` when the
  completed evidence justifies that state.
- Does not require placeholder behavioural knowledge from the blocked run.

## Scenario B — re-initialize an analysed repository

With `service-a` already recorded as `analysed`, run:

```text
/knowledge-init service-a
```

### Expected behavior

- Treats the explicit selection as an initialization request, not as a no-op.
- Reads and preserves existing validated knowledge.
- Performs fresh repository discovery and content inspection for `service-a` in
  this run; inventory and existing knowledge reads alone are not sufficient.
- Inspects `service-a` to normal initialization depth as needed by the workflow.
- May report that no knowledge changes are needed only after comparing that fresh
  repository evidence with the preserved knowledge.
- When the source and existing knowledge are unchanged, produces no material
  knowledge diff: it does not rewrite, reformat or reorder existing documents.
- Does not create a new repository knowledge artifact merely because another
  analytical phase is available during the repeated initialization.
- Avoids unnecessary from-scratch regeneration of unchanged documents.
- Refines stale knowledge only when stronger current evidence supports it.
- Does not persist a newly suspected syntax/build defect unless the relevant
  language/toolchain configuration makes that conclusion evidence-backed.
- Does not downgrade the stronger existing coverage merely because the current
  run observes less evidence than the accumulated validated state.

## Scenario C — continuation guidance from coverage

Create or obtain a workspace coverage state where, after a broader initialization,
`service-a` is `analysed` and `service-b` is `blocked`, `partially analysed` or
`not analysed`. Complete the run.

### Expected behavior

- Reads back the canonical coverage persisted by `knowledge_coverage`.
- Reports the concrete repositories whose detailed initialization remains
  incomplete.
- Provides a copyable continuation command for each eligible repository, for
  example `/knowledge-init service-b`.
- Does not replace concrete coverage-derived guidance with a generic suggestion.
- Does not recommend `/knowledge-update service-b` as the continuation mechanism.

## Failure checks

The test fails if any of the following occurs:

- an existing repository knowledge artifact is treated as proof that detailed
  initialization is complete;
- a selected `partially analysed` repository is skipped;
- a selected `analysed` repository completes after only inventory/coverage and
  existing-knowledge reads, without fresh repository content inspection;
- a repeated initialization of unchanged source creates a material knowledge diff,
  reformats existing artifacts, or adds a new artifact without a material
  evidence-backed gap;
- re-inspection persists a defect or contradiction whose validity depends on
  unverified language/toolchain assumptions;
- continuation rebuilds validated repository knowledge from scratch without
  checking existing state;
- an earlier inspection blocker is treated as a permanent limitation after
  access is restored;
- final continuation guidance names repositories that are not supported by the
  persisted coverage state.
