# Knowledge-base update

Use `knowledge-update` after meaningful development in a repository that already
has a validated knowledge baseline.

For a guided update:

```text
/knowledge-update
```

Select the canonical repository first, then choose `Full repository update` or a
specific knowledge concern.

For a complete repository refresh:

```text
/knowledge-update TaskBoard.Service.Boot
```

The Knowledge agent should inspect existing validated knowledge, acquire current
implementation evidence in sufficient depth, identify materially affected
knowledge artifacts and preserve unaffected artifacts.

For a targeted refresh:

```text
/knowledge-update TaskBoard.Service.Boot execution-flows
/knowledge-update TaskBoard.Service.Boot business-rules
/knowledge-update TaskBoard.Service.Boot configuration
```

The concern narrows the primary analysis scope but does not prevent inspection of
supporting source/configuration needed to validate it correctly.

`knowledge-update` may use Git changes to find likely impact, but the authoritative
comparison is existing validated knowledge versus current repository evidence.
Historical provenance in existing knowledge must remain distinct from evidence
actually acquired during the current update run.
