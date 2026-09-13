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

1. identify the semantic information need expressed by the request;
2. determine the applicable evidence role or smallest set of roles with
   `evidence-semantics`;
3. select the smallest useful initial source scope;
4. discover candidates only inside that scope;
5. rank candidates by relevance and semantic applicability, not by a global
   workspace authority order;
6. inspect the smallest sufficient set of files, snippets or repository evidence;
7. reuse already acquired evidence before performing further discovery;
8. escalate to another source role only when an explicit escalation condition is
   met;
9. stop as soon as the requested answer is sufficiently supported;
10. answer using explicit workspace-relative evidence paths.

## Information-need driven source selection

Do not apply one default cross-directory retrieval order. Classify what kind of
information the user is asking for before candidate discovery. Useful information
needs include current implemented behaviour, official specification or procedure,
architectural intent, rationale or historical context, onboarding/training
knowledge, current investigation or working notes, explicit cross-source
comparison, and uncertainty or discrepancy investigation.

Select source roles from that information need:

- current implemented behaviour -> begin with relevant `knowledge-base/` when it
  is likely to contain the implementation concern; use `repositories/` only when
  direct implementation evidence is required by an escalation condition below;
- existing persisted knowledge -> `knowledge-base/`;
- official or approved specification, procedure, architecture or decision ->
  `documents/`;
- onboarding, training or expert explanation -> `trainings/`;
- current investigation, TODO, hypothesis, proposal or working context -> `notes/`;
- rationale or historical context -> select only the source roles plausibly able to
  carry rationale for the specific subject, commonly `documents/`, `trainings/`
  and/or `notes/`, and add implementation evidence only when the question also asks
  how that rationale is reflected in the current system;
- explicit comparison, conflict or discrepancy -> inspect the source roles named
  or materially implicated by the comparison, without turning the request into an
  all-workspace scan.

These mappings express contextual applicability, not a global authority ranking. A
source role that is applicable to one information need may be irrelevant to the
next question even when files are available there.

## Knowledge-first implementation retrieval

For implementation-oriented questions, interpret knowledge-first as:

```text
knowledge-base = preferred curated implementation view
repositories   = primary direct implementation evidence
```

### Source-specific intent precedence

Before applying the implementation retrieval gate, determine whether the question
explicitly requests the perspective of a particular workspace evidence class.

Explicit source-specific intent takes precedence over generic implementation cues
such as feature names, ticket identifiers, endpoints, components or other software
terms:

- approved, official or reviewed project material -> `documents/`;
- onboarding, training or expert-session material -> `trainings/`;
- recorded notes, working context, hypotheses, TODOs, cautions or open questions ->
  `notes/`.

Start candidate discovery in that requested evidence class. Do not search
`knowledge-base/` first merely because the subject of the document, training or note
is an implementation feature.

If the selected source-specific evidence is sufficient for the requested
perspective, stop. Escalate to another evidence class only when the question also
requires a material fact that the requested source class cannot support, or when the
user explicitly asks for comparison or verification against another source class.

### Mixed evidence intent

Before applying the generic implementation gate, determine whether the question
contains multiple semantic information needs that belong to different evidence
classes.

Decompose mixed questions into the smallest independently supportable sub-needs and
assign each sub-need to its applicable evidence class. Do not let an implementation
clause force the entire question through `knowledge-base/`.

In particular, questions that ask both why a design or behavior exists and how that
rationale is reflected in the current implementation should normally be decomposed
as:

```text
recorded rationale / intent -> notes/
current implementation      -> repositories/
```

Retrieve the rationale-bearing evidence first when the question asks for the reason,
intent, caution, hypothesis or decision context. Then inspect repository evidence
only to verify the implementation-specific sub-need.

Keep evidence roles distinct: working notes can support recorded rationale or intent
but do not prove current implementation; repository code can prove implementation
but should not be used to reconstruct or replace available recorded rationale.

For each sub-need, apply the smallest-sufficient-evidence rule independently. Do not
inspect unrelated evidence classes, and do not add corroborating repository files
once the implementation sub-need is sufficiently supported.

If a mixed question has no relevant candidate in the evidence class assigned to one
sub-need, report that absence or continue with the remaining supported sub-needs
without silently substituting a different evidence role.

### Mandatory implementation retrieval gate

Apply this gate to implementation-oriented questions whose requested perspective is
the current implementation, rather than to questions with an explicit source-specific
perspective handled above.

For those current-implementation questions, complete the following gate before any
repository grep, glob, inventory call or repository file read, unless one of the
repository-first exceptions below applies.

```text
implementation question
    ↓
focused knowledge-base candidate discovery
    ↓
relevant knowledge candidate?
    ├─ no  → repository becomes eligible
    └─ yes
         ↓
      inspect smallest useful knowledge evidence
         ↓
      requested detail sufficiently supported?
         ├─ yes → STOP
         └─ no
              ↓
           state the concrete unresolved detail
              ↓
           repository becomes eligible only for that gap
```

The mandatory first action for this gate is a focused
`workspace_evidence_search` scoped to `knowledge-base/`. Do not substitute a
repository grep, repository inventory, repository glob or source-file read for this
candidate-discovery step.

Requests for exact, concrete, current or low-level implementation details still pass
through this gate. Precision can make repository escalation necessary after knowledge
inspection; it does not make repository evidence the initial scope.

Repository-first retrieval is allowed only when:

- the user explicitly asks for direct source/code verification or explicitly asks to
  bypass generated knowledge;
- generated knowledge is already known from current-run evidence to be unavailable
  for the requested area;
- the requested outcome inherently requires primary-source reconstruction rather
  than retrieval of an implementation fact.

Loading a specialized analysis skill does not bypass this gate. A specialized skill
may determine how the requested outcome is analysed, but repository evidence remains
ineligible until the gate permits escalation.

### Knowledge evaluation and escalation

If a relevant knowledge candidate exists, inspect the smallest useful knowledge
evidence and determine which requested details it supports and which material details,
if any, remain unresolved.

If the inspected knowledge answers every material part of the question at the
requested precision, stop retrieval. Do not open repository files merely to restate,
confirm, corroborate or strengthen the same claim.

Escalate from knowledge to repository evidence only when at least one of these
conditions applies:

- relevant knowledge is missing;
- the inspected knowledge is ambiguous or internally incomplete for the question;
- the requested implementation detail is not represented precisely enough;
- the user explicitly requests direct source or code verification;
- current-run evidence gives a concrete reason to suspect the knowledge may be stale;
- another inspected source materially conflicts with the generated knowledge;
- a specialized analysis capability requires direct repository evidence to satisfy
  its own outcome.

Before the first repository acquisition after knowledge inspection, identify the
specific unresolved information need. Repository retrieval is permitted only for
that gap. If no unresolved need can be stated, repository retrieval is not permitted.

When escalating, retain and reuse the knowledge already inspected. Narrow repository
discovery from the known repository, symbol, endpoint, configuration key or
relationship whenever possible instead of restarting from workspace-wide discovery.

Repository escalation inherits the unresolved information need.

### Repository escalation budget

Treat the unresolved information need as a retrieval budget, not merely as the reason
to enter `repositories/`.

Before each additional repository acquisition, ask whether the currently inspected
repository evidence already supports the unresolved detail. If it does, stop
immediately.

When one source file establishes part of the gap and names the exact type, symbol or
artifact needed for the remaining part, follow only that direct dependency. Do not
broaden into adjacent service, mapper, model, persistence or other implementation
layers unless the unresolved detail specifically depends on them.

For example, if a controller establishes the exact HTTP status and identifies the
response DTO, and that DTO establishes the exact serialized response shape, the
original status/body gap is fully resolved. Do not continue into service logic,
mapping code or domain models merely to corroborate how that DTO was produced.

Repository discovery must also remain anchored to the repository already implied by
the inspected knowledge or unresolved symbol. Prefer the directly relevant repository
over nested, vendored, deployment-zone or duplicated copies when the canonical
repository is available.

Stop repository retrieval as soon as the unresolved detail is supported; do not
inspect additional implementation layers merely because they are reachable,
interesting or potentially corroborating.

## Candidate discovery

For `documents/`, `trainings/`, `notes/` and `knowledge-base/`, use
`workspace_evidence_search` with a focused query after selecting the semantic
scope. Search one applicable scope at a time unless the request itself requires
multiple evidence roles. Do not call the tool once for every evidence directory
merely to see what exists.

Use path and filename hints when they materially narrow discovery, but never assume
a fixed filename or one document type per directory. Use `repository_inventory`
when repository identity or structure is relevant, and use `glob`/`grep` for
focused repository discovery after the repository scope has been established.

Source role is independent of file format. Markdown, text, extracted PDF content,
DOCX/PPTX content and other supported representations keep the semantic role of
their containing source class. If the available local tools cannot inspect a
relevant format, keep the file as an observed candidate and report the limitation
instead of guessing its content.

## Escalation and stop conditions

Availability of more workspace material is not a reason to read it. Expand beyond
the current evidence set only when needed to:

- answer another explicit part of the request;
- verify a claim that cannot otherwise be supported;
- resolve a meaningful ambiguity;
- investigate a material conflict or freshness concern;
- satisfy the evidence requirements of a specialized analysis capability.

Stop retrieving once the answer requested by the user is sufficiently supported at
the required semantic level. In particular, do not inspect `documents/`,
`trainings/` or `notes/` for an implementation-only question unless one of the
conditions above makes that source role relevant, and do not inspect repositories
for a document-, training- or note-specific question merely because implementation
source is available.

Candidate search does not determine evidence authority. `workspace_evidence_search`
returns relevant files and observable content matches inside the role already
selected by `evidence-semantics`; it must not be used to derive a global source
ranking. A file reported as unsearched or unsupported remains a candidate and must
not be treated as evidence that the requested information is absent.

A `workspace_evidence_search` hit with `matchedBy: content` and returned `snippets`
is current-run observed evidence from that file. This is especially important for
container or binary-backed formats such as DOCX, PPTX and PDF, where generic `read`
or `grep` may expose less searchable text than the deterministic extractor. Use the
returned snippets to establish what the source actually states, then use `read` only
when broader surrounding context is needed. Do not require a second textual match
from `read` before accepting a deterministic content hit, and do not reinterpret a
successful content hit as absence merely because `read` does not surface the same
passage.

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
- Treat a source as current-run evidence only after its relevant content has been
  observed during the current run. Observation may come from `read` or from a
  `workspace_evidence_search` content hit with returned snippets. A persisted
  artifact may be known to exist, but it must not be described as corroborating,
  confirming or supporting a claim when only its path was observed.
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
