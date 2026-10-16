---
name: work-item-evidence-acquisition
description: Acquire canonical read-only work-item evidence for one or more references from the backend already selected by the Review caller
---

# Work-item evidence acquisition

Use when a Review Agent or another caller supplies a selected `backendId` and a
non-empty ordered list of stable work-item references. This capability owns
work-item acquisition, not backend selection, provider transport or review
judgments. It can be composed before a Review Agent exists.

`review-evidence-model` owns the canonical contract. `WorkItemEvidence` means
the existing canonical `WorkItem` defined there; it is not a second schema.
Multiple acquired items are independent evidence, not a `ReviewInput` containing
multiple source work items. The caller chooses the source item for a review.

## Acquisition

1. Before the first `review_evidence_acquire` call, invoke the `skill` tool with
   `name: "review-evidence-model"` and wait for its completed result. If that skill
   was already loaded in this session, reuse it. This is a required prerequisite:
   this acquisition procedure and a provider's canonical output do not replace
   loading the model contract. If it cannot be loaded, report acquisition blocked
   rather than bypassing it.
2. Require the selected backend identifier and at least one stable reference.
   If either is missing or a reference cannot identify a stable work item, report
   the missing input to the caller. Do not guess an ID, parse provider URLs or
   discover a replacement backend. Backend selection belongs to
   `review-backend-resolution`, invoked by the caller before this skill.
3. For each supplied reference, invoke `review_evidence_acquire` with
   `family: "workItemBackends"`, the exact selected `backendId`, and that reference
   as `externalId`. Use only an exact repository scope supplied by the caller,
   when present. The tool/provider implementation owns access, normalization,
   validation, pagination and transport-specific failures. Do not manually read
   fixture catalogs or retrieve provider responses through shell or web tools.
4. Return one attributable result per reference in request order:

   ```text
   {reference: string, status: "acquired", evidence: WorkItemEvidence}
   | {reference: string,
      status: "unavailable" | "invalid-request" | "invalid-config" | "invalid-evidence",
      reason: string}
   ```

   Preserve the tool's status and diagnostic for each failed acquisition. Continue
   the other requested references; a missing item must not erase acquired evidence
   or silently remove a result. Never fabricate an evidence object for a failure,
   retry with another backend, or substitute a change-request acquisition.
5. For acquired evidence, return the complete canonical object unchanged,
   including title, description, comments, supporting fields, field states,
   reasons, provenance, source identities and retrieval metadata. Canonical
   partial or unavailable fields are successful acquisition with explicit limits,
   not transport failure. Keep provider extensions opaque.

When the caller requests JSON, return a complete valid JSON array using two-space
indentation, with each property on its own line. Do not compress nested evidence
or the result array into a single line. Every result
wrapper and its nested `evidence` object must close independently before the array
closes. Preserve all fields even for large results; never abbreviate, elide or
truncate objects. Check the final array's structure and reference/result pairing
before returning it. For example, two acquired results have this nesting (the
empty objects here illustrate nesting only, not valid evidence):

```json
[
  {
    "reference": "item-1",
    "status": "acquired",
    "evidence": {}
  },
  {
    "reference": "item-2",
    "status": "acquired",
    "evidence": {}
  }
]
```

## Discussion and chronology

Keep comments as separate identified evidence items, independently attributable
to their content, authors, source references and field provenance. Never append
them to the description or promote discussion to acceptance criteria.

Preserve exact creation and update timestamps, timezone offsets, collection order
and collection coverage. A chronological presentation, if requested, may compare
known creation instants without rewriting the canonical evidence: identify ties
and unknown/uncomparable dates explicitly, and never manufacture dates or infer
chronology from retrieval time. Provider collection order alone does not prove
creation order. An update timestamp is not a creation timestamp.

Preserve parent and thread independently, including references outside the
retrieved page. Unavailable or unsupported relationships do not invalidate the
work item or its retrieved comments. Do not infer a parent from chronology, shared
thread, indentation or quoted content. Retain unavailable relationships without
`value`; confirmed absence is the distinct canonical `{kind: "none"}` value.

Keep partial pagination and missing comments explicit. An unavailable comment
collection is not an empty collection, and partial comments are not complete.
Do not invent missing comments, authors, replies, threads or relationship metadata.

## Provider and read-only boundary

Use the same tool contract for fixture and future service providers. Adapter
configuration and provider-specific parsing belong to the implementation behind
`review_evidence_acquire`, documented in `review-evidence-acquisition`. This skill
contains no endpoint knowledge and does not interpret provider response formats.

Acquisition never creates, edits, deletes, comments on, transitions or approves a
work item. Do not modify workspace files, repair evidence, access credentials or
evaluate findings. Return evidence and its limits to the caller.
