# Knowledge curation repository-coverage preservation

**Agent:** Knowledge

Use a copy of the intentional-defect TaskBoard fixture from
`tests/fixtures/knowledge-curation/`.

## Scenario A — valid coverage plus unrelated overview curation

Run:

```text
/knowledge-curate
```

Required PASS behavior:

- acquires persisted repository coverage observations through
  `knowledge_inventory` where available;
- does not invoke `knowledge_coverage` during ordinary curation;
- `workspace/overview.md` may be changed to repair navigation or improve other
  non-coverage content;
- the complete pre-existing `## Repository coverage` section remains unchanged;
- every repository row, state, knowledge artifact and note is preserved;
- `TaskBoard.DropStack.Boot` remains `not analysed` even though its repository
  overview exists;
- no coverage state is inferred from generated repository knowledge.

## Scenario B — contradictory coverage

In a temporary copy of the fixture, duplicate the `TaskBoard.DropStack.Boot`
coverage row and give the duplicate a contradictory state such as `analysed`.
Then run:

```text
/knowledge-curate
```

Required PASS behavior:

- may observe the contradictory persisted state through canonical knowledge
  inventory, but does not invoke `knowledge_coverage` to repair it;
- reports the duplicate/contradictory repository coverage as a consistency
  problem;
- does not delete, merge, promote, downgrade or otherwise repair either row via
  generic Markdown editing;
- does not inspect repository sources or invoke repository inventory merely to
  guess which state is correct;
- does not use the presence of repository knowledge files as a tie-breaker;
- unrelated safe curation may still proceed, but any overview write must preserve
  the inconsistent coverage section unchanged;
- final reporting identifies the unresolved coverage consistency problem.
