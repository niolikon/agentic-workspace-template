---
name: review-evidence-acquisition
description: Acquire canonical work-item and change evidence through selected Review backends, including deterministic filesystem fixtures
---

# Review evidence acquisition

Use for retrieving work-item or change evidence. Load `review-backend-resolution`
and resolve each resource independently, then invoke `review_evidence_acquire`
with the exact `family`, resolved `backendId`, stable `externalId` and optional
exact `repository`. Load `review-evidence-model` to interpret the returned evidence.
Do not read fixture files manually as a substitute for this provider interface.

## Provider contracts

Both domains share the executable `acquireEvidence(workspace, request)` interface
in `acquire.ts`, exposed by `review_evidence_acquire`:

```text
EvidenceRequest {
  family: "workItemBackends" | "changeBackends"
  backendId: string
  externalId: string
  repository?: string
}
EvidenceResult =
  {status: "acquired", evidence: WorkItem | ChangeRequest}
  | {status: "unavailable" | "invalid-request" | "invalid-config" | "invalid-evidence", reason: string}
```

The family determines the canonical evidence type. Successful results carry only
canonical evidence, with no fixture-specific wrapper inside the evidence object.
Future live adapters must use this same interface and normalization boundary.
No live adapter is installed yet; other backends return controlled `unavailable`.
Acquisition is read-only. It never evaluates findings, connects to a service,
modifies project files or repairs malformed evidence. Retrieval modes and provenance
remain visible for traceability; consumers must not branch on them for review logic.

## Fixture backend

Declare `adapter: "fixture"` and `fixturePath` on an ordinary backend entry.
`provider` remains the represented source provider (for example `github`), while
`id` identifies the fixture backend. Keep `baseUrl` as the represented HTTPS
source root for normal backend selection; it is never contacted. Omit credentials.
`fixturePath` is a workspace-relative JSON file path with forward slashes, no
empty, `.` or `..` segments, drive or absolute paths. Resolved symlinks/junctions
must stay inside the workspace. An existing workspace must supply its own registry
and test fixtures: the updater deploys tools/skills and preserves root configuration.

Catalog format (collections may be empty):

```text
{schemaVersion: "review-fixtures/v1", workItems: WorkItem[], changeRequests: ChangeRequest[]}
```

Each collection supports multiple stable external IDs. Changes with the same
provider-local number in different repositories must use distinct stable IDs, as
in the canonical model. A review still composes one selected work item with one or
more independently acquired changes; do not select an arbitrary source work item.

Fixtures contain normalized input evidence only. Never encode expected findings,
violations, verdicts or other review conclusions. Keep test oracles outside fixture
evidence. See `tests/fixtures/review-providers/` in the development repository.

The executable fixture profile uses string acceptance criteria, string commit IDs
and unified-diff strings, consistent with existing canonical examples. Each
EvidenceField supports available/partial/ambiguous/unavailable, including explicit
empty values. Preserve all states, reasons, identities, relationship kinds,
provenance and retrieval metadata byte-for-value after JSON parsing. No timestamps,
origins, missing relationships, comments or diff hunks are synthesized. Each field
requires provenance identifying this backend with fixture mode; additional upstream
origins are retained. Canonical object fields are allowlisted; provider extensions
remain opaque sanitized source metadata under the evidence-model contract.

Validate the complete requested family before returning any member: malformed or
duplicate entries fail closed. Duplicate comments, self-parenting and known parent
cycles are invalid; a parent outside the retrieved collection is allowed. Parent
and thread remain independent typed relationships. Missing originating backends,
provider mismatches and malformed evidence fields are normalization errors.

## Controlled failures

- Missing file or resource ID: `unavailable`, without fabricated evidence.
- Invalid JSON, catalog, canonical shape, duplicate identities or comment cycles:
  `invalid-evidence`.
- Invalid backend configuration or escaping resolved fixture path: `invalid-config`.
- Invalid selectors or resource/repository conflict: `invalid-request`.
- Other unreadable files: `invalid-evidence` with a fixed diagnostic.

Never echo parser errors, raw fixture data or filesystem exception messages in a
failure. Never convert normalization failures into partially invented ReviewInput
objects. Canonical partial/ambiguous/unavailable fields are successful acquisitions
with explicit evidence boundaries, independent of transport failure. Stop the
affected acquisition on failure; no network fallback or backend substitution.
