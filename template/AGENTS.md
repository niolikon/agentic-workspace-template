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

## Source reliability

Use this order of authority:

1. executable code and active configuration;
2. current official documentation;
3. official reports and procedures;
4. training and meeting notes;
5. personal notes;
6. agent inference.

Never present an inference as a confirmed fact.

When sources conflict:

1. report the conflict;
2. identify the conflicting files;
3. explain which source appears more current or authoritative;
4. never silently choose one.

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
