---
name: change-evidence-acquisition
description: Acquire canonical read-only implementation evidence for one or more PR or MR references from an already selected change backend
---

# Change evidence acquisition

Use when a Review caller supplies a selected `backendId` and a non-empty ordered
list of stable PR/MR references, each optionally carrying an exact repository
scope. This skill owns acquisition, not backend selection, provider transport,
work-item retrieval or review judgments. `ChangeEvidence` is the canonical
`ChangeRequest` in `review-evidence-model`, not a second schema.

## Acquisition

1. Before the first acquisition, load `review-evidence-model` with the `skill`
   tool and wait for its completed result; reuse it if already loaded. If the
   contract cannot be loaded, report blocked rather than bypassing it.
2. Require the selected backend ID and at least one stable reference. Report
   missing input without guessing IDs, parsing provider URLs or discovering a
   replacement backend. The caller owns `review-backend-resolution` before this
   capability and selects each backend independently of the work-item backend.
3. For every reference invoke `review_evidence_acquire` with
   `family: "changeBackends"`, the exact selected `backendId`, and the stable
   reference as `externalId`. Pass only an exact `repository` supplied by the
   caller for that reference. Do not reuse the first change's repository for
   other changes. The provider tool owns access, response parsing, normalization,
   validation, pagination and transport failures. Never manually read fixture
   catalogs or retrieve provider data through shell or web tools.
4. Return one result per supplied reference in request order:

   ```text
   {reference: string, status: "acquired", evidence: ChangeEvidence}
   | {reference: string,
      status: "unavailable" | "invalid-request" | "invalid-config" | "invalid-evidence",
      reason: string}
   ```

   Set `reference` to the exact string passed to the tool as `externalId`.
   A caller request may be an object containing family, backend, external ID and
   repository scope; that entire object is never the output `reference`.
   For example, a request with `externalId: "change-17"` and
   `repository: "team/service"` produces `reference: "change-17"`.
   Check that every output reference is a string independently of its evidence.

   Preserve each failure status and diagnostic and continue other references.
   Do not fabricate evidence, silently omit failures, switch backend or substitute
   work-item evidence. Multiple backend selections are separate invocations of
   this capability; the caller composes their attributable results.
5. Return acquired canonical objects unchanged, including title, description,
   repository identity, refs, commits, changed files, diff, review state, checks,
   review discussions, all states/reasons and provenance/retrieval metadata.
   Preserve opaque provider extensions without interpreting them. Optional
   evidence boundaries are successful acquisitions with limits, not failed
   transport. Legacy objects may omit newly introduced checks/discussions;
   omission proves no availability and must never be presented as empty/passed.

When JSON is requested, return a complete valid JSON array with two-space
indentation and each property on its own line. Preserve all nested evidence;
never elide or truncate it. Close each wrapper and nested object independently
and check reference/result pairing before returning.

## Multi-change and evidence boundaries

Keep every change independent with its own repository, refs, commits and diff.
Do not flatten changes into one patch, collapse equal repository short names,
or infer priority, merge order or completeness from input order. Stable IDs must
distinguish repository-local PR/MR numbers across repositories.

Preserve changed-file inventory independently of diff coverage. Never reconstruct
missing hunks from a checkout. Keep pipeline/check status separate from review
state: a successful check is not approval or proof that requirements are met.
Preserve individual check identities and conclusions without inventing an
aggregate pipeline result. Keep discussion comments, authors, timestamps and
typed parent/thread relationships separate from description and judgments.
Do not infer unknown relationships or promote discussions to requirements.

Partial, ambiguous and unavailable evidence retain their values/candidates,
reasons and provenance exactly. Unsupported discussions are unavailable, not an
empty collection. Unexpected or malformed optional evidence is handled by the
provider tool's controlled result; never repair provider data in this skill.

## Provider and read-only boundary

Use the same `review_evidence_acquire` contract for fixtures and future service
adapters; `review-evidence-acquisition` owns its shared provider infrastructure.
No provider response shape or endpoint belongs here. Downstream review logic
uses canonical evidence states without branching on provider or retrieval mode.

Never create, edit, delete, comment on, transition, approve or merge resources.
Do not write workspace files, access credentials, repair evidence or evaluate
implementation quality. Return acquired evidence and its limits to the caller.
