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

Keep the final response concise.

Report:

- curated scope and inventory coverage, including canonical repository inventory
  acquisition and complementary non-repository Markdown coverage;
- knowledge files created, updated, moved, merged or removed;
- duplicate/overlap candidate accounting (`candidate_count`,
  `disposed_candidate_count`) by rendering the retained candidate-ledger records
  themselves: every candidate must show its explicit `source`, `disposition`,
  canonical `targets` or rationale, and `outcome`; do not regenerate these items
  from counters or emit empty numbered/bullet entries;
- for every destructive consolidation, render that candidate ledger's evidence
  child records and then report `evidence: verified/expected`. Every rendered
  evidence item must show the exact literal `path` and exact
  `surviving_target` retained during verification. If the concrete ledger cannot
  be rendered completely, report curation as incomplete rather than claiming a
  successful destructive consolidation from aggregate counters alone;
- duplicate or navigation problems resolved;
- broken links repaired or left unresolved;
- repository-coverage preservation status when `workspace/overview.md` was
  changed, and any coverage consistency problem observed without repair;
- any evidence-preservation concern, plus exact failed-write counts
  (`attempts`, `recovered`, `unresolved`), or explicit zero counts;
- incomplete or uninspected curation work.
