---
description: Curate and improve the existing knowledge base
agent: knowledge
subtask: false
---

Optional curation focus supplied by the user:

$ARGUMENTS

Execute the existing-knowledge curation workflow defined by
`knowledge-curation`.

Load `knowledge-curation` before starting. The skill owns curation inventory,
source-analysis boundaries, preservation ledgers, consolidation safety,
artifact refresh, link validation and completion accounting. Load
`knowledge-generation` before any persistent knowledge write, as required by
the agent-level persistence invariant.

The command owns only curation intent and the optional focus. Do not reimplement
curation procedures in this command prompt.

## Final report

Report the outcome using the completion and reporting contract defined by
`knowledge-curation`. Do not restate or reinterpret that contract here.
