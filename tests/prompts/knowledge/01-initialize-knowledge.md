# Initialize the knowledge base

**Agent:** Knowledge

## Prompt

```text
/init-knowledge
```

## Expected behavior

- Inventories repositories, documents, trainings and notes in phases.
- Creates only evidence-backed files under `knowledge-base/`.
- Does not modify primary sources.
- Cites source paths.
- Reports conflicts, gaps and unverifiable information.
- Does not create empty placeholder sections.
