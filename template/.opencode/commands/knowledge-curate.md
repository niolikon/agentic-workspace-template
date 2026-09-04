---
description: Curate and improve the existing knowledge base
agent: knowledge
subtask: false
---

Curate the existing knowledge base.

Optional focus supplied by the user:

$ARGUMENTS

Load:

- `knowledge-generation`;
- `knowledge-curation`;
- `safe-file-writing`.

## Source-analysis boundary

Operate primarily and by default only on `knowledge-base/`.

Do not inspect or reanalyse `repositories/`, `documents/`, `trainings/` or
`notes/` unless `$ARGUMENTS` explicitly requests source validation or source
reanalysis.

Do not invoke `repository_inventory` during ordinary curation.

Use `knowledge_inventory` as the authoritative structural inventory for persisted
repository knowledge under `knowledge-base/repositories/`. Its repository,
artifact-path and persisted-coverage results are structural state only; they do
not decide semantic correctness, duplication, consolidation safety or coverage
transitions.

Generic Markdown discovery is still required to complete the curation scope for
workspace-level and any other supported knowledge documents not represented by
`knowledge_inventory`. Never let a failed, incomplete or narrower generic glob
remove canonical repository artifacts returned by `knowledge_inventory` from
the run inventory.

For existing canonical repository artifacts returned by `knowledge_inventory`,
prefer `knowledge_artifact_refresh(action=inspect)` whenever their content must
be inspected or reused during curation. If a surviving canonical repository
artifact requires a material whole-document rewrite, use the revision returned
by that inspection with `knowledge_artifact_refresh(action=replace)` and then
apply the normal curation post-write validation. Do not route a redundant source
that is destined for deletion through artifact refresh merely to create a stub
or transitional rewrite.

Ordinary curation must not invoke `knowledge_coverage` to infer, normalize or
mutate repository coverage. Observe persisted coverage through canonical
knowledge state where available, preserve the protected workspace coverage
projection, and report apparent inconsistencies without repairing them.

Existing evidence paths must be preserved, but they do not need to be reopened
or revalidated merely because they are referenced by curated documents.

If source validation is explicitly requested, load only the additional skills
needed for that validation and inspect the smallest relevant source set.

## Workflow

1. invoke `knowledge_inventory` to acquire the authoritative canonical
   repository-knowledge inventory and persisted repository coverage observations;
   separately build the complementary Markdown inventory needed for the rest of
   `knowledge-base/`, then union both results into one complete curation-scope
   inventory and account for every inventoried path;
2. inspect every inventoried Markdown document at least enough to determine its
   responsibility, evidence metadata, outgoing internal links and overlap with
   neighboring documents; use `knowledge_artifact_refresh(action=inspect)` for
   existing canonical repository artifacts and ordinary knowledge-base reads for
   documents outside that tool's scope; do not declare curation complete while
   inventoried files remain uninspected;
3. identify repository and workspace entry points and their outgoing links;
   when `knowledge-base/workspace/overview.md` contains the exact
   `## Repository coverage` heading, snapshot that complete section as protected
   cumulative state before planning any overview edit;
4. detect duplicated or substantially overlapping knowledge, excluding
   repository-coverage rows/state from free-form duplicate or consolidation
   decisions;
5. detect unnecessarily fragmented or mixed-purpose oversized documents;
6. identify broken internal relative Markdown links;
7. identify inconsistent names or organization that materially hurt
   navigation;
8. apply the smallest high-confidence curation changes first;
9. build and maintain the candidate queue from `knowledge-curation` for every
   duplicated/overlapping document discovered during inspection; record
   `candidate_count`, keep each candidate `pending` until it receives an explicit
   disposition (`safe-to-consolidate:<target>`, `ambiguous:<reason>`,
   `must-retain:<reason>`, or `not-a-duplicate:<reason>`), and do not allow a
   candidate to disappear silently from the run; never classify a candidate as
   `ambiguous` solely because it is large, monolithic, multi-target, or requires
   a long preservation ledger—when canonical destinations are clear, execute the
   multi-target consolidation in this run;
10. when a whole document is `safe-to-consolidate`, consolidation is the
    required outcome for this run: after preservation succeeds, delete the
    redundant source file; do not patch it into a DEPRECATED/archive banner,
    redirect, consolidation note, shortened copy or other stub unless the user
    explicitly requested preservation of that source path;
11. consolidate, split, merge, move or rename documents only when this improves
    responsibility and navigation;
12. before removing, replacing or materially shortening evidence-backed
    content, execute the destructive-consolidation protocol from
    `knowledge-curation`: enumerate every preservation item from the source and
    verify each one against an explicit surviving target;
13. for every destructive-consolidation candidate, explicitly enumerate every
    distinct literal evidence path as a numbered ledger of exactly `N` items and
    record `evidence_expected = N`; do not use implicit or aggregate entries such
    as "other references". Perform a separate observable exact-text target check
    during this run for each of the `N` paths (for example exact `grep` inside
    `knowledge-base/` followed by a target `read`); previous reads, semantic
    memory, or another item's search do not count. Increment `evidence_verified`
    only after that item's own exact check and semantic target check succeed. The
    explicit ledger count, observable per-item checks, `evidence_expected` and
    `evidence_verified` must reconcile exactly; do not delete otherwise. If an
    evidence path is absent, update and verify the target before deletion;
14. do not delete a source document merely because a canonical document covers
    the same topic; deletion is allowed only after the preservation ledger has
    no unresolved items;
15. after steps 12-14 succeed for a whole-document `safe-to-consolidate`
    candidate, delete the redundant source directly without rewriting it first;
    concise summaries and relative links belong in surviving canonical/index
    documents when useful, not in a replacement stub at the old source path;
    keep preservation ledgers in working context and do not create
    `curation-*.md`, `*-consolidation.md` or equivalent bookkeeping files inside
    `knowledge-base/` unless the user explicitly requested a persistent
    audit/history artifact;
16. update affected repository and workspace indexes after structural changes;
    for `workspace/overview.md`, edit only outside the protected
    `## Repository coverage` section and never reconstruct coverage from
    repository knowledge artifacts;
17. after every successful write, re-read the complete affected file and run
    the post-write validation checklist from `safe-file-writing`; a `read`
    alone is not verification;
18. for broad structural rewrites of documents that must remain, use a
    deliberate whole-document replacement followed by full re-read and
    mechanical validation; when the surviving document is an existing canonical
    repository artifact, use `knowledge_artifact_refresh(action=replace)` with
    the exact revision from its preceding canonical inspection rather than
    generic `edit`/`write`; use generic safe-file operations only where canonical
    artifact refresh does not apply (for example workspace documents, creation,
    movement or deletion); do not structurally rewrite a whole-document
    `safe-to-consolidate` source that is destined for deletion, and never
    simulate a whole rewrite through a fragile partial patch;
19. maintain exact failed-write counters during the run; after any failed patch
    or edit, increment the failed-attempt count, re-read the full affected file
    before any retry, and increment the recovered count only after successful
    post-write validation; never assume a failed operation left the file
    unchanged;
20. for every completed whole-document `safe-to-consolidate` disposition,
    verify that the source path no longer exists; compare the final Markdown
    inventory with the initial inventory and account for every created/deleted
    file;
21. verify internal links across the complete curated scope; after repairing a
    broken link, perform an observable exact search for the old target and require
    zero remaining matches before reporting the repair successful, then verify the
    new target exists;
22. if `workspace/overview.md` was modified, extract its complete
    `## Repository coverage` section after the final write and compare it with
    the pre-write snapshot; require the section, repository states, knowledge
    artifact references and notes to remain unchanged. If an obvious coverage
    inconsistency was observed, report it without repairing or inferring a
    replacement state from curated Markdown;
23. verify that all inventoried Markdown files were inspected and that evidence
    references, conflicts, confidence and unresolved questions remain
    preserved;
24. close the candidate queue: compute `disposed_candidate_count` and require
    `disposed_candidate_count == candidate_count` before reporting curation
    complete. If any candidate remains pending, report it explicitly as
    incomplete work and do not claim completion.

## Constraints

- Never modify repositories or primary-source documentation.
- Never write outside `knowledge-base/`.
- Never regenerate the knowledge base from scratch.
- `knowledge_inventory` is authoritative for canonical repository knowledge
  membership and paths; generic discovery may supplement but must not override
  or narrow those results.
- Do not invoke `knowledge_coverage` during ordinary curation. Coverage mutation
  belongs to workflows that explicitly establish or reconcile repository
  analysis state.
- Treat `workspace/overview.md` repository coverage as protected cumulative
  state during curation. Do not directly add, remove, merge, reorder or change
  coverage rows, states, artifact references or notes with generic Markdown
  editing.
- Do not infer coverage from generated repository knowledge. In particular, a
  repository `overview.md` does not imply that repository is `analysed`.
- If coverage appears inconsistent, report the consistency problem; do not
  repair it by deriving replacement states from the knowledge base being
  curated.
- Never discard evidence-backed information.
- Preserving only representative evidence is insufficient: all unique evidence
  and its associated nuance must survive a consolidation.
- Prefer incremental improvements over broad rewrites.
- Preserve existing relative links whenever possible.
- Do not invent replacement targets for broken links when intent is ambiguous;
  leave the issue documented instead.
- Do not claim the curation scope is complete if any inventoried Markdown file
  was not inspected or if post-write validation failed.
- Do not claim that evidence was preserved unless every preservation item was
  matched to an explicit surviving target, the observable evidence count is
  closed (`verified == expected`), and any missing target content was written
  and re-validated before deletion.
- A target `read` without item-by-item comparison is not evidence-preservation
  verification.
- A whole-document high-confidence duplicate with a clear canonical target must
  not survive successful consolidation as a DEPRECATED/archive banner, pointer,
  consolidation note, shortened copy or other stub. When preservation closes,
  delete it. Retain the path only when the user explicitly requests path
  preservation, and report that exception.
- If any write attempt failed, report the exact failed-attempt, recovered and
  unresolved counts; do not collapse multiple failures into one and do not
  state that no failed writes occurred after recovery.
- Do not persist preservation ledgers, consolidation logs or curation-history
  files inside `knowledge-base/` by default; they are transient working state.
- Every duplicate/overlap candidate identified during inspection must have an
  explicit disposition and outcome before the run can be reported complete.
- The candidate queue is mandatory working state: `disposed_candidate_count`
  must equal `candidate_count`; otherwise the final report must state that
  curation is incomplete and list every pending candidate.
- Size, number of preservation items, number of canonical targets, or expected
  effort are never sufficient reasons for `ambiguous`; use `ambiguous` only for
  genuine semantic/destination uncertainty.

## Final report

Keep the final response concise.

Report:

- curated scope and inventory coverage, including canonical repository inventory
  acquisition and complementary non-repository Markdown coverage;
- knowledge files created, updated, moved, merged or removed;
- duplicate/overlap candidate accounting (`candidate_count`,
  `disposed_candidate_count`) and every candidate's disposition/outcome,
  including `evidence: verified/expected` for every destructive consolidation;
- duplicate or navigation problems resolved;
- broken links repaired or left unresolved;
- repository-coverage preservation status when `workspace/overview.md` was
  changed, and any coverage consistency problem observed without repair;
- any evidence-preservation concern, plus exact failed-write counts
  (`attempts`, `recovered`, `unresolved`), or explicit zero counts;
- incomplete or uninspected curation work.
