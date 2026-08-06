---
description: Initialize the structured workspace knowledge base
agent: knowledge
subtask: false
---

Initialize the workspace knowledge base from:

- `repositories/`;
- `documents/`;
- `trainings/`;
- `notes/`.

Load:

- `knowledge-generation`;
- `workspace-reading`;
- `safe-file-writing`;
- `repository-analysis`.

Load `execution-flow-analysis` and `architecture-analysis` only when sufficient
evidence exists for those topics.

## Workflow

1. perform an authoritative Git repository inventory;
2. collect repository identities and every workspace path for each logical
   repository;
3. identify repositories containing `.gitmodules`;
4. identify submodules, relative paths, remote URLs and pinned commits;
5. distinguish:
   - repository roots;
   - orchestrator repositories;
   - nested submodules;
   - duplicate or alternate checkouts;
6. initialize:
   - `knowledge-base/workspace/`;
   - `knowledge-base/repositories/`;
7. create one knowledge directory per logical repository;
8. create `knowledge-base/workspace/overview.md` early;
9. create one repository `overview.md` at a time;
10. create `submodules.md` for orchestrator repositories;
11. create `knowledge-base/workspace/orchestration.md` when orchestration evidence
    exists;
12. analyse explicit compile-time relationships;
13. analyse runtime integrations only from concrete evidence;
14. identify principal repository-local execution and data flows;
15. identify principal cross-repository execution and data flows;
16. persist findings incrementally;
17. validate Markdown links, duplication and relationship classification.

## Logical repository deduplication

When the same logical repository appears at multiple workspace paths:

- correlate copies using remote URL and Git identity;
- create only one canonical repository knowledge directory;
- list all known checkout paths in its `overview.md`;
- identify which checkout is referenced by the orchestrator;
- do not generate duplicate knowledge directories from directory names alone.

Do not create every possible document.
Do not generate the complete knowledge base in one large patch.

## Final report

Keep the final report concise. Summarize:

- logical repositories covered;
- orchestrators and submodules discovered;
- duplicate or alternate checkouts;
- files created or updated;
- relationship types documented;
- execution and data flows documented;
- major unresolved issues;
- the next highest-value analysis step.
