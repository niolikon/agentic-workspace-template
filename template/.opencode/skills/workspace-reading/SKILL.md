---
name: workspace-reading
description: Retrieve workspace evidence with minimal context loading; supports specialized analysis without replacing it
---

# Workspace reading

Use this skill for ordinary local retrieval and as a supporting evidence-retrieval
capability for specialized analysis skills.

Do not treat the need to read local files as a reason to select this skill instead
of a more specific analysis capability. When the user's question is primarily an
execution-flow, repository, architecture or dependency-analysis question, the
matching specialized skill should govern the analysis and may use this retrieval
strategy as needed.

## Retrieval workflow

1. identify the requested information;
2. determine the most likely source scope;
3. discover candidate files;
4. rank candidates by relevance and authority;
5. inspect the smallest useful set of files or sections;
6. stop reading when sufficient evidence exists;
7. answer using explicit workspace-relative evidence paths.

## Source order

Use this order when applicable:

1. `knowledge-base/workspace/`;
2. `knowledge-base/repositories/`;
3. `documents/`;
4. repository documentation and manifests;
5. repository configuration and public interfaces;
6. implementation source code;
7. external dependency evidence through `dependency-inspection`, only when the
   question requires information unavailable from repository evidence;
8. `trainings/`;
9. `notes/`.

This is a retrieval strategy, not an absolute authority ranking.

## Repository reading order

Inside a repository inspect:

1. README and repository documentation;
2. build and dependency manifests;
3. configuration;
4. schemas, API definitions and public interfaces;
5. application entry points;
6. implementation only when required.

## Evidence handling

- Cite workspace-relative paths.
- Report conflicts between sources.
- Distinguish confirmed facts, likely interpretations and unresolved questions.
- Do not invent missing information.
- Do not recursively inspect the entire workspace before candidate discovery.
- Do not inspect external dependencies by default. Escalate to
  `dependency-inspection` only when repository-local evidence is insufficient.
