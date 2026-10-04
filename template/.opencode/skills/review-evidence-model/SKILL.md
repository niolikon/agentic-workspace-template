---
name: review-evidence-model
description: Define and validate provider-neutral review inputs, normalized evidence states and source provenance for work items and implementation change requests
---

# Review evidence model

Use this skill whenever review workflows need to exchange a source work item and
one or more implementation change requests without coupling downstream reasoning
to GitHub, GitLab, Bitbucket, Jira or Azure DevOps response shapes.

This skill owns the canonical normalized review-input contract, evidence-state
semantics, provenance requirements and normalization invariants. Provider-specific
adapters may retrieve and map remote data into this contract, while higher-level
review capabilities consume the normalized result.

It does not retrieve provider data, evaluate implementation quality, decide
whether requirements were implemented correctly or mutate remote resources.

## Architectural boundary

Keep provider retrieval and review reasoning separated by one normalization
boundary:

```text
provider response(s)
    ↓
provider-specific retrieval / adapter
    ↓
canonical ReviewInput
    ↓
provider-neutral review capabilities
```

Provider adapters may branch on provider APIs and provider response formats.
Ordinary review capabilities must reason from the canonical fields and evidence
states defined here instead of branching on provider names.

Provider-specific metadata may be retained for traceability, debugging or a
specialized provider capability, but it must remain opaque to ordinary review
reasoning.

## Canonical review input

A valid review input contains exactly one source work item and one or more change
requests:

```text
ReviewInput {
  schemaVersion: "review-evidence/v1"
  workItem: WorkItem
  changeRequests: [ChangeRequest, ...]
}
```

The work item and change requests are independent provider identities. Do not
require them to come from the same provider, host, project or repository.

Examples of valid compositions include:

- Jira work item + GitHub pull request;
- GitLab issue + GitLab merge request;
- Jira work item + Azure DevOps pull request;
- one work item + multiple change requests from one or several supported
  providers.

Reject an input that contains no work item, more than one source work item or no
change request. Do not silently select one item from an ambiguous collection.

## Provider identity

Represent a provider using a stable normalized identifier. Canonical identifiers
for currently supported provider families are:

- `github`;
- `gitlab`;
- `bitbucket`;
- `jira`;
- `azure-devops`.

A future adapter may introduce another stable provider identifier without changing
ordinary review semantics. Provider identity describes provenance; it is not a
branching instruction for core review analysis.

## Evidence-bearing fields

Every provider-derived semantic field must carry an explicit evidence state.
Conceptually use this contract:

```text
EvidenceField<T> =
  Available<T>
  | Partial<T>
  | Ambiguous<T>
  | Unavailable

Available<T> {
  state: "available"
  value: T
  provenance: Provenance[]
}

Partial<T> {
  state: "partial"
  value: T
  reason: PartialReason
  provenance: Provenance[]
}

Ambiguous<T> {
  state: "ambiguous"
  candidates?: T[]
  reason: string
  provenance: Provenance[]
}

Unavailable {
  state: "unavailable"
  reason: UnavailableReason
  provenance: Provenance[]
}
```

Do not use an omitted key, empty string, empty list, `null`, placeholder text or
model inference as a substitute for an explicit evidence state.

An empty value can be genuine provider data only when provenance establishes that
the provider explicitly returned that value. For example, an issue with zero
labels is `available` with `[]`; labels that were never retrieved are
`unavailable`.

### Available evidence

Use `available` only when the normalized value is supported by retrieved provider
evidence and is complete for the semantic field being represented.

### Partial evidence

Use `partial` when useful evidence was retrieved but is known to be incomplete.
Typical reasons include:

- `truncated`;
- `pagination-incomplete`;
- `provider-limit`;
- `retrieval-interrupted`.

A partial diff remains usable within its observed boundary but must never be
presented as the complete implementation change.

### Ambiguous evidence

Use `ambiguous` when evidence exists but does not justify one normalized semantic
value. This is especially important for acceptance criteria that may be mixed into
a description without a reliable structural boundary.

Do not choose a candidate merely to make the downstream model easier to consume.
A review capability may explain the ambiguity or mark an affected conclusion as
not verifiable.

### Unavailable evidence

Use `unavailable` when the semantic field could not be obtained. Canonical reasons
include:

- `not-provided` — the provider resource does not expose a value;
- `not-retrieved` — the adapter intentionally did not fetch the field;
- `permission-denied` — access was refused;
- `not-found` — the referenced resource or evidence was not found;
- `unsupported` — the adapter/provider cannot currently supply the evidence;
- `redacted` — the value was intentionally removed for safety;
- `retrieval-failed` — retrieval failed without more specific classification.

Preserve a more precise adapter-observed reason when available. Never convert a
retrieval failure into an empty or inferred value.

## Provenance

Every `available`, `partial`, `ambiguous` or `unavailable` state must remain
traceable to the provider evidence or retrieval event that established it.

Conceptually represent provenance as:

```text
Provenance {
  provider: ProviderId
  sourceReference: SourceReference
  retrieval: RetrievalMetadata
  sourceLocator?: string
}
```

`sourceLocator` identifies the provider-response field, JSON path, page, patch,
response section or equivalent location that supports the normalized field. It
must be specific enough to explain where a value came from without forcing core
review skills to understand the provider schema.

An unavailable field still needs provenance for the retrieval attempt or source
resource that established the gap. `permission-denied`, for example, should point
to the attempted resource rather than appearing as an unsupported bare assertion.

When one normalized field combines multiple provider observations, retain all
material provenance entries instead of collapsing them into one synthetic source.

## Source references and retrieval metadata

A source reference identifies the external resource independently of the display
text returned by the provider. Preserve, when applicable:

- provider;
- stable external resource ID;
- human-facing issue/PR/MR/work-item key or number;
- canonical or sanitized provider URL;
- host or server identity when needed to disambiguate self-hosted providers.

Retrieval metadata should preserve enough run-local context to understand how the
evidence was obtained, such as:

- adapter or retrieval capability identity;
- live, fixture, cached or equivalent retrieval mode;
- retrieval timestamp when supplied by the retrieval layer;
- page/cursor/completeness information when relevant;
- response/request correlation identifiers only when safe and useful.

Do not place authorization headers, credentials, access tokens, signed query
parameters, cookies or secret-bearing request metadata in source references,
retrieval metadata, provider extensions or final review output.

## Work item

Normalize one source work item with this semantic shape:

```text
WorkItem {
  provider: ProviderId
  externalId: string
  title: EvidenceField<string>
  description: EvidenceField<string>
  acceptanceCriteria: EvidenceField<AcceptanceCriterion[]>
  labels: EvidenceField<string[]>
  type: EvidenceField<string>
  status: EvidenceField<string>
  sourceReference: SourceReference
  retrieval: RetrievalMetadata
  providerExtensions?: ProviderExtensions
}
```

`externalId` is the stable provider identity used to distinguish the work item,
not a title-derived or model-generated identifier.

Normalize acceptance criteria only when the provider response or the resource
content gives a defensible boundary. If a dedicated field exists, preserve that
provenance. If criteria appear to be embedded in free text but their boundaries
cannot be established reliably, use `ambiguous`. If no criteria are present or
they were not retrieved, use the applicable `unavailable` reason.

Labels, type and status are supporting review context, not mandatory review
judgments. Their absence must not invalidate the whole input when represented
explicitly as unavailable.

## Change request

Normalize every implementation change request with this semantic shape:

```text
ChangeRequest {
  provider: ProviderId
  repository: RepositoryIdentity
  externalId: string
  title: EvidenceField<string>
  description: EvidenceField<string>
  sourceRef: EvidenceField<RefIdentity>
  targetRef: EvidenceField<RefIdentity>
  commits: EvidenceField<CommitIdentity[]>
  changedFiles: EvidenceField<ChangedFile[]>
  diff: EvidenceField<DiffEvidence>
  reviewState: EvidenceField<string>
  sourceReference: SourceReference
  retrieval: RetrievalMetadata
  providerExtensions?: ProviderExtensions
}
```

The repository identity must remain stable across provider display-name changes
where the provider exposes a durable repository/project ID. Preserve the useful
human-readable repository name or path as supporting identity, not as a
replacement for a stronger provider ID.

`sourceRef` and `targetRef` identify the compared refs as reported by the provider.
Where commit IDs are available, preserve exact commit identifiers rather than
reconstructing them from branch names.

`changedFiles` and `diff` are separate evidence surfaces. A provider may return a
changed-file inventory while diff hunks are unavailable, truncated or subject to a
provider limit. Preserve those states independently.

A changed-file entry should preserve at least the current path and, when supplied,
previous path/rename identity and provider-reported change kind. Additions,
deletions, patch fragments or per-file commit metadata may be retained when
observed, but do not invent them from other fields.

## Repository and ref identity

Represent repository identity independently from the work-item provider:

```text
RepositoryIdentity {
  provider: ProviderId
  stableId: string
  name: string
  fullName?: string
  sourceReference: SourceReference
}

RefIdentity {
  name: string
  commitId?: string
}
```

For providers where repository identity belongs to a project/repository hierarchy,
preserve enough normalized identity to distinguish repositories deterministically.
Do not infer repository equivalence from matching short names alone.

## Diff evidence

Diff evidence represents only content actually returned or materialized by the
retrieval layer. It may contain unified diff text, structured hunks, per-file
patches or an adapter-defined canonical equivalent.

The evidence state, not the presence of some patch text, determines completeness:

- complete retrieved diff -> `available`;
- known truncation or incomplete pagination -> `partial`;
- permission/provider/API limitation -> `unavailable` with the matching reason.

Never fill missing hunks by reading the target repository unless a higher-level
review workflow explicitly performs separate repository evidence acquisition and
records that provenance as a distinct evidence source.

## Provider extensions

Adapters may preserve sanitized provider-specific metadata in an opaque,
namespaced extension bag when that evidence is useful for traceability and has no
canonical field yet.

Provider extensions must obey these rules:

- canonical fields remain the normal review interface;
- ordinary review skills must not branch on provider extensions for routine
  analysis;
- an extension must not override or contradict a canonical field silently;
- sensitive authentication material must never be retained;
- extension provenance must remain attributable to the provider response;
- a future canonical field may replace an extension without changing unrelated
  review reasoning.

Do not copy the entire raw provider response into the normalized model merely to
avoid deciding what is relevant.

## Normalization validation

Treat normalization as invalid rather than guessing when identity boundaries are
not trustworthy.

Reject or surface a normalization error for:

- malformed source references that cannot identify the intended resource;
- a declared provider that contradicts the parsed/adapter-owned source provider;
- missing stable external ID for the source work item;
- missing stable external ID or repository identity for a change request;
- zero or multiple source work items;
- zero change requests.

Do not treat provider mismatch as permission failure or missing evidence. It is an
input/normalization error and should remain distinguishable from retrieval gaps.

A normalization failure must not be converted into a partially invented
`ReviewInput` merely so a downstream review can continue.

## Multi-change-request semantics

One implementation review may contain multiple PRs or MRs. Preserve each change
request as an independent evidence object with its own repository identity, refs,
commits, diff state and provenance.

Do not merge multiple diffs into an unattributed synthetic patch at the
normalization boundary. A higher-level review may reason across the union of
changes, but findings must remain traceable to the contributing change request or
requests.

The order of change requests must not imply priority, completeness or merge order
unless that relationship is explicitly supplied by provider evidence.

## Read-only and credential boundary

Normalization and review evidence handling are read-only. They must never edit,
comment on, transition, approve, merge or otherwise mutate provider resources.

Credentials are transport concerns, not review evidence. Provider adapters may use
credentials to retrieve data, but normalized inputs and review outputs must never
persist or display them.

Before retaining a URL or provider-specific metadata, remove secret-bearing query
parameters, embedded credentials, authorization values and equivalent sensitive
material. If safe retention is impossible, represent the affected evidence as
`unavailable` with reason `redacted` rather than leaking the value.

## Consumer contract

A provider-neutral review capability consuming this model must:

1. operate on canonical fields and evidence states rather than provider response
   shapes;
2. preserve work-item, change-request, repository, ref and source identities in
   findings where they matter;
3. treat `partial`, `ambiguous` and `unavailable` as evidence boundaries rather
   than prompts to invent missing content;
4. keep findings attributable to the contributing normalized evidence;
5. allow work-item and change-request providers to differ;
6. allow multiple change requests to contribute to one review;
7. consult opaque provider extensions only through an explicitly specialized
   capability, never as routine provider branching.

This skill defines the boundary contract. Provider adapters own retrieval and
mapping into it; review skills own analysis after it.
