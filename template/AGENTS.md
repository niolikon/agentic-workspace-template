# Project workspace instructions

This workspace represents a software system composed of multiple repositories
and multiple sources of information.

## Directory roles

- `repositories/` contains source-code repositories.
- `documents/` contains official project documentation.
- `trainings/` contains training notes, meeting notes and knowledge transfers.
- `notes/` contains personal or informal notes.
- `knowledge-base/` contains derived and curated project knowledge.
- `scripts/` contains workspace utilities.

## Source semantics

Workspace sources have semantic roles rather than one global order of authority.
Interpret evidence according to the question being answered:

- `repositories/` provides primary implementation evidence for current behaviour;
- `knowledge-base/` provides curated implementation-derived evidence and remains
  traceable to repository observation;
- `documents/` provides reviewed or official project evidence for approved intent,
  procedures, specifications and formally documented decisions;
- `trainings/` provides expert-derived contextual evidence that may be simplified,
  incomplete or stale;
- `notes/` provides working context that may include hypotheses, TODOs, proposals,
  recollections or unresolved questions.

Retrieval order is not an authority ranking. A source that is appropriate for one
question must not automatically override a different source role for another.
Preserve claim-level certainty independently from the directory containing it and
never present an inference, hypothesis or proposal as a confirmed fact.

When relevant sources conflict:

1. determine the kind of fact the user is asking for;
2. preserve the provenance and semantic role of each conflicting claim;
3. prefer the evidence directly applicable to that question;
4. report meaningful disagreement rather than silently discarding it;
5. weaken the conclusion when the available workspace evidence cannot resolve the
   conflict.

## Context management

Do not preload the entire workspace.

For every task:

1. identify the requested information or change;
2. discover candidate files;
3. rank candidates by relevance and authority;
4. inspect the smallest useful set of files or sections;
5. expand only when necessary.

A complete multi-repository scan is allowed only when explicitly requested.

## Nested OpenCode configurations

Nested `opencode.json`, `opencode.jsonc` and `.opencode/` directories inside
`repositories/` are not part of the cross-repository configuration.

Do not manually read or apply them unless the user explicitly requests an
isolated repository session.

## Remote-provider data minimization

The configured model may be remote.

Before reading local content:

1. discover candidates using paths, filenames and metadata;
2. read only relevant files and sections;
3. avoid entire large files when a subsection is sufficient;
4. never inspect unrelated proprietary content;
5. stop and request explicit approval before accessing potentially sensitive material.

Do not read, summarize or transmit:

- `.env` and `.env.*`;
- private keys and certificates;
- credentials, access tokens and password stores;
- `secrets/` and `credentials/`;
- production database dumps;
- customer or personal-data exports;
- logs containing authentication or personal data.

Do not access public web tools from workspace agents.

## Knowledge base

The knowledge base is derived and must remain traceable to sources.

Knowledge-base updates should include:

- evidence and source paths;
- confirmed facts;
- assumptions and inferences;
- conflicts;
- open questions.

Do not modify primary sources merely to make them consistent with the
knowledge base.
