# Knowledge-base curation

Use the Knowledge agent and run:

```text
/knowledge-curate
```

The workflow improves the existing `knowledge-base/` without reanalysing
repositories or other primary sources by default.

Typical changes include consolidating duplicate knowledge, reorganizing
oversized or fragmented documents, improving indexes and repairing internal
relative links while preserving evidence references.

A focused curation can be requested with an argument, for example:

```text
/knowledge-curate focus on repository indexes and broken internal links
```

Primary sources are inspected only when the command arguments explicitly ask
for source validation or source reanalysis.
