# Curate the knowledge base

**Agent:** Knowledge

## Prompt

```text
/knowledge-curate
```

## Expected behavior

- Inventories and inspects every Markdown document in the requested
  `knowledge-base/` scope before claiming complete curation coverage.
- Does not read repositories, documents, trainings or notes unless the prompt
  explicitly requests source validation.
- Reduces obvious duplicate or overlapping knowledge without losing supported
  facts or evidence paths.
- Before removing or replacing evidence-backed content, preserves every unique
  evidence path, confidence qualifier, conflict, assumption and unresolved
  question in a canonical target; preserving only representative evidence is a
  failure.
- Improves repository and workspace navigation where needed.
- Repairs resolvable broken internal relative Markdown links.
- Splits or merges documents only when responsibility and navigation clearly
  improve.
- Re-reads every modified document after writing and verifies Markdown/content
  integrity before considering the write complete.
- After a failed patch/edit, re-reads the affected file before retrying and
  verifies the recovery write; continuing from stale content is a failure.
- Writes only under `knowledge-base/`.
- Does not regenerate the knowledge base from scratch.
- Reports unresolved ambiguous links, uninspected files, failed verification or
  other curation blockers instead of claiming full completion.
