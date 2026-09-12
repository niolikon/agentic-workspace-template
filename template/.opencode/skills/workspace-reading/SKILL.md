---
name: workspace-reading
description: Retrieve workspace evidence with minimal context loading; supports specialized analysis without replacing it
---

# Workspace reading

Use this skill for ordinary local retrieval and as a supporting evidence-retrieval
capability for specialized analysis skills.

Do not treat the need to read local files as a reason to select this skill instead
of a more specific analysis capability. When the user's question is primarily an
execution-flow, repository, architecture, dependency-analysis or evidence-semantics
question, the matching specialized skill should govern the analysis and may use
this retrieval strategy as needed. Questions scoped to official or approved
information, current implementation truth, expert or onboarding knowledge, or
working context depend on source-role semantics even when the user does not
explicitly ask to compare evidence classes.

## Retrieval workflow

1. identify the requested information;
2. determine the semantically applicable evidence role with `evidence-semantics`
   when source role affects the answer;
3. determine the smallest useful source scope for that role;
4. use `workspace_evidence_search` for deterministic candidate discovery when
   the scope is `documents/`, `trainings/`, `notes/` or `knowledge-base/`;
5. rank candidates by relevance within the applicable role, not by a global
   workspace authority order;
6. inspect the smallest useful set of files or sections;
7. expand to supporting or conflicting source roles only when useful or required;
8. stop reading when sufficient evidence exists;
9. answer using explicit workspace-relative evidence paths.

## Contextual source selection

Do not apply one default cross-directory retrieval order. Choose the initial source
scope from the semantic question:

- existing persisted knowledge -> `knowledge-base/`;
- official or approved project information -> `documents/`;
- current implementation truth -> relevant `knowledge-base/` for efficient context
  and/or `repositories/` for direct verification as required;
- onboarding or expert explanation -> `trainings/`;
- current investigation, proposal or working context -> `notes/`.

These mappings express contextual applicability, not a global authority ranking.
After inspecting the primary applicable role, acquire supporting or contradictory
evidence from other roles only when the requested outcome benefits from it.

Candidate search does not determine evidence authority. `workspace_evidence_search`
returns relevant files and observable content matches inside the role already
selected by `evidence-semantics`; it must not be used to derive a global source
ranking. A file reported as unsearched or unsupported remains a candidate and must
not be treated as evidence that the requested information is absent.

When the user explicitly asks for an answer according to existing workspace
knowledge, persisted knowledge is the requested primary evidence: discover and
inspect the relevant knowledge artifact before acquiring repository evidence.
Repository reads may then confirm, challenge or complete the knowledge claim, but
must not silently replace the requested knowledge-first perspective.

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
- Treat a source as current-run evidence only after it has actually been
  inspected during the current run. A persisted artifact may be known to exist,
  but it must not be described as read, corroborating, confirming or supporting
  a claim unless its relevant content was observed in this run.
- When comparing persisted knowledge with repository evidence, keep their
  provenance explicit: first report what the inspected knowledge states, then
  identify which parts are confirmed, contradicted or unresolved by repository
  evidence acquired in the current run.
- Report conflicts between sources.
- Distinguish confirmed facts, likely interpretations and unresolved questions.
- Do not invent missing information.
- Do not recursively inspect the entire workspace before candidate discovery.
- Do not inspect external dependencies by default. Escalate to
  `dependency-inspection` only when repository-local evidence is insufficient.

## Workspace access discipline

Keep retrieval anchored to the current workspace and use each tool for the target
it owns:

- use `read` only for a concrete file path, never for a directory or repository
  root;
- use `repository_inventory` when repository identity or workspace repository
  structure is required;
- use `workspace_evidence_search` to discover and search candidates inside
  `documents/`, `trainings/`, `notes/` and `knowledge-base/`; this is preferred
  over generic `glob`/`grep` discovery for those evidence collections because it
  inventories files directly and can search supported container formats such as
  DOCX and PPTX plus extractable text from PDFs; PDFs without extractable text
  remain visible as candidates rather than being treated as absent;
- use `glob` when candidate paths must be discovered outside those evidence
  collections;
- use `grep` to locate symbols, configuration keys, endpoint paths or other
  textual evidence in repositories or already narrowed textual scopes.

Prefer workspace-relative paths returned by successful retrieval. Do not invent
filesystem-root variants such as `/repositories/...` for workspace paths reported
as `repositories/...`.

A failed read caused by a directory, malformed path or missing target is not, by
itself, evidence that workspace access requires additional permission. Recover
with the appropriate inventory, glob or grep strategy and continue from evidence
already collected.

Never replace failed discovery with guessed repository names or generic paths.
Repository and file identities must come from workspace evidence. If valid
workspace-relative retrieval remains insufficient, report the observed boundary
instead of inventing a likely structure.

The agent's configured read-only permissions authorize inspection inside the
workspace. Do not request additional conversational permission merely to perform a
read that is already allowed by the active agent configuration.
