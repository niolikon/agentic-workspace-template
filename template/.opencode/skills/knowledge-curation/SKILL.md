---
name: knowledge-curation
description: Incremental curation rules for improving the existing knowledge base without source reanalysis
---

# Knowledge curation

Use this skill when improving the quality, organization or navigation of an
existing knowledge base without regenerating it from primary sources.

## Default scope

Operate on `knowledge-base/` only.

Do not inspect `repositories/`, `documents/`, `trainings/` or `notes/` unless
the user explicitly requests source validation or source reanalysis.

Existing evidence paths are metadata to preserve. Their presence does not by
itself authorize reopening the referenced source file during curation.

## Complete inventory before curation

Treat the Markdown inventory as a coverage obligation, not only as discovery.

Before declaring curation complete:

1. enumerate all Markdown documents under the requested `knowledge-base/`
   scope;
2. inspect every inventoried document at least enough to identify its purpose,
   evidence/confidence metadata, internal links and likely overlap with related
   documents;
3. track which inventoried files were inspected;
4. do not report the scope as fully curated when files remain uninspected.

A broad glob followed by reading only a subset is not complete curation. If
execution limits prevent complete inspection, stop conservatively and report
which files remain uninspected rather than claiming completion.


## Candidate queue and completion gate

Treat every duplicate or substantially overlapping document discovered during
inspection as a tracked curation candidate. Maintain a candidate queue in
working context from discovery until final disposition.

For each candidate, record:

- source path;
- why it is a duplicate/overlap candidate;
- candidate status: `pending`, `safe-to-consolidate`, `ambiguous`,
  `must-retain`, or `not-a-duplicate`;
- canonical target(s) or explicit rationale;
- final outcome.

The queue is a completion obligation, not a best-effort list. Before the run
may report curation complete:

1. `candidate_count` MUST equal the number of duplicate/overlap candidates
   identified during inspection;
2. every candidate MUST leave `pending`;
3. every `safe-to-consolidate` candidate MUST complete its preservation ledger
   and consolidation in the current run;
4. every `ambiguous`, `must-retain`, or `not-a-duplicate` candidate MUST have an
   explicit semantic rationale in the final report;
5. `disposed_candidate_count` MUST equal `candidate_count`.

Reading or mentioning a candidate does not count as disposition. A run MUST NOT
report "complete", "no unresolved work", or equivalent while any candidate is
`pending` or omitted from the disposition summary.

Do not stop after processing only the first or most complex candidate. Resume
the queue until all discovered candidates are disposed, unless an execution
limit prevents completion; in that case report the remaining pending candidates
explicitly and do not claim full curation.

## Curation objectives

Improve the existing knowledge base by:

- removing duplicated descriptions while preserving the strongest canonical
  version;
- consolidating documents with substantially overlapping responsibilities;
- splitting documents that have become too broad or difficult to navigate;
- merging unnecessarily fragmented documents;
- improving indexes, tables of contents and relative navigation;
- repairing broken internal Markdown links when the intended target can be
  determined from existing knowledge;
- normalizing document names and organization toward the canonical knowledge
  structure;
- replacing repeated detail with concise summaries and relative links;
- preserving evidence paths, confidence, conflicts, assumptions and unresolved
  questions.

## Evidence preservation

Never discard a supported fact merely because it is duplicated.

Before deleting, substantially shortening or replacing an evidence-backed
section or document with links, construct a preservation mapping from the
candidate source content to the canonical target knowledge. Verify that every
unique item survives:

- factual claim or meaningful qualification;
- evidence path or evidence group;
- confidence statement;
- conflict or competing interpretation;
- assumption;
- unresolved/open question;
- scope distinction that changes the meaning of the claim.

Preserving a representative subset of evidence is never sufficient.

When consolidating duplicated knowledge:

1. identify the most complete and precise formulation;
2. preserve all non-redundant evidence references;
3. preserve distinctions in scope, confidence, conflicts and open questions;
4. move or enrich the canonical formulation in the document with the clearest
   responsibility;
5. only after the preservation mapping is complete, remove redundant prose;
6. when the whole source document is classified `safe-to-consolidate` and all
   of its responsibility survives in canonical targets, delete the source file
   rather than rewriting it as a contextual summary, redirect or pointer.

If the mapping cannot be demonstrated from the already-inspected knowledge,
keep the original evidence-backed content and report the consolidation as
incomplete.

If two duplicated statements conflict, do not merge them into a single fact.
Preserve the conflict explicitly.

## Consolidation decision gate

For every duplicated or substantially overlapping document, classify the
curation outcome before editing it:

- `safe-to-consolidate`: a clear canonical target exists inside
  `knowledge-base/`, the responsibilities overlap materially, and every unique
  preservation item can be mapped or migrated into that target;
- `ambiguous`: the canonical responsibility, surviving destination, or semantic
  mapping cannot be determined confidently from the existing knowledge. A
  candidate is **not** ambiguous merely because it is large, spans several
  canonical targets, requires a long preservation ledger, or needs multiple
  verification steps;
- `must-retain`: the document contains unique responsibility, historical or
  decision context that should remain independently browsable, or preservation
  cannot be completed without source validation that was not requested.

The classification controls the allowed action:

- `safe-to-consolidate` -> execute the destructive-consolidation protocol and,
  once preservation succeeds, delete the redundant source document by default;
  do not retain a stub, redirect, consolidation note or shortened copy merely to
  preserve the old path unless the user explicitly requests path preservation;
- `ambiguous` -> keep the source intact and report the unresolved consolidation;
- `must-retain` -> keep the source as an intentional document and improve only
  navigation/organization if useful.

Do not use a `DEPRECATED` banner, archival banner, redirect stub, or similar
non-destructive wrapper as a substitute for consolidation when the document is
classified `safe-to-consolidate`. Such a banner leaves the duplicated content in
place and does not satisfy duplicate-reduction objectives.

A deprecation/archival wrapper is allowed only when the document is explicitly
classified `ambiguous` or `must-retain`, and the final report must state which
classification justified retaining it.

### Multi-target consolidation is not ambiguity

Do not classify a candidate as `ambiguous` merely because:

- it is large or monolithic;
- it spans multiple responsibilities;
- preservation requires several canonical target documents;
- its preservation ledger contains many items;
- consolidation requires multiple exact searches, target updates or validation
  steps.

If the canonical destinations are clear from the existing knowledge, perform a
multi-target preservation ledger in the current run. For each claim, evidence
reference, confidence qualifier, conflict, assumption and open question, map it
to the appropriate surviving target, migrate anything missing, re-read and
validate the affected target, and continue until the ledger has no unresolved
items.

`ambiguous` is permitted only when the responsibility boundary, canonical
destination, or item-to-target semantic mapping genuinely cannot be chosen with
sufficient confidence from the inspected knowledge base. Work size or effort is
not an ambiguity criterion.

## Destructive consolidation protocol

Deletion, replacement, or material shortening of evidence-backed knowledge is
an explicitly gated operation.

Before changing the source destructively, build a preservation ledger for that
source document or section. The ledger must enumerate, individually:

- every distinct factual claim or meaningful qualification;
- every literal evidence path (do not collapse several paths into
  "representative evidence");
- every confidence statement;
- every conflict or competing interpretation;
- every assumption;
- every unresolved/open question;
- every scope distinction that changes meaning.

Then resolve the ledger item by item against explicit canonical targets. Keep
the ledger in working context until the source operation is complete. For each
item record one of: `already-present:<target>`, `migrated:<target>`, or
`unresolved`. A destructive operation is forbidden while any item is
`unresolved`.

### Observable evidence checks

Evidence-path preservation must be demonstrated with tool-visible checks, not
only inferred from topical similarity. For each destructive-consolidation
candidate, first enumerate the literal evidence references from the source and
record the expected evidence count `N` in working context. Count distinct
literal references as individual ledger items even when several appear on the
same Markdown line.

Then:

1. build an explicit numbered ledger containing exactly the `N` distinct literal
   evidence references; `evidence_expected` MUST equal the number of explicitly
   enumerated ledger entries. Do not use aggregate entries such as "other
   references", "remaining manifests", or implicit/unlisted evidence items;
2. report/track `evidence_expected = N` before deletion;
3. for each of the `N` literal evidence paths in the source, perform its own
   observable exact-text search during the current curation run in the intended
   surviving knowledge under `knowledge-base/`; a previous read, semantic memory,
   another evidence item's search, or topical similarity does not count as this
   check;
4. read the candidate target containing the match and confirm the evidence is
   attached to the correct surviving claim/qualification;
5. mark that evidence item verified only after that item's current-run exact
   search and semantic target check both succeed;
6. if the exact evidence path is absent, update the canonical target first,
   re-read the complete updated target, and repeat that item's exact check;
7. maintain `evidence_verified` strictly as the number of explicitly enumerated
   ledger items that completed their own current-run checks above;
8. deletion or material shortening is allowed only when
   `evidence_verified == evidence_expected` **and** every non-evidence ledger
   item is resolved.

The final report for each destructive consolidation must include the observable
count in `verified/expected` form, for example `evidence: 4/4 verified`. Never
claim that every evidence path was checked when the tool-visible checks account
for fewer than `N` source references.
The report must list the same explicit `N` ledger entries used to derive the
count. The number of listed entries, the number of per-item observable exact
searches in the current run, `evidence_expected`, and `evidence_verified` must
reconcile. If they do not reconcile, preservation is unresolved and destructive
consolidation is forbidden.

A source and target discussing the same topic is not proof of preservation.
A target containing one of several source evidence paths is not proof that all
source evidence survived.

If a source contains a unique evidence path and no target file was modified to
preserve it, deletion is forbidden unless an exact search proves that path was
already present in a semantically correct canonical target.

### Required operation order

For a destructive merge, the observable operation order should be:

```text
read source
read target(s)
search/compare preservation items
[update target if any item is missing]
re-read and validate target
only then remove or materially shorten source
```

Never use this order when unique content may exist:

```text
read source
read related target
delete source
```

### Completion claims

Do not report "all evidence preserved", "merge verified", or equivalent unless
all preservation-ledger items were resolved through the protocol above and the
evidence counter closes exactly (`evidence_verified == evidence_expected`).
The final report must expose the `verified/expected` evidence count for every
destructive consolidation.
If any item is unresolved, leave the source intact and report the incomplete
consolidation. Do not hide an unresolved ledger by adding a deprecation banner
and then claiming the duplicate was addressed.

### Ledger lifetime and knowledge-base hygiene

The preservation ledger is operational working state, not knowledge content.
Keep it in the agent's working context while performing the consolidation and
summarize the result in the final report.

Do **not** create `curation-*.md`, `*-consolidation.md`, preservation-ledger,
audit, migration-log or similar bookkeeping documents inside `knowledge-base/`
merely to prove that curation occurred. Curation must reduce or improve the
knowledge surface, not replace domain duplication with curation metadata.

Create persistent curation-history/audit documentation only when the user
explicitly requests such an artifact or when the existing knowledge-base
conventions already define a canonical audit/history document that must be
maintained. Otherwise traceability is preserved by the surviving canonical
claims, their complete evidence paths, confidence/qualifications, and the final
curation report.

### Candidate disposition coverage

Every duplicate or substantial-overlap candidate identified during inspection
must receive an explicit disposition before completion:

- `safe-to-consolidate:<target>`;
- `ambiguous:<reason>`;
- `must-retain:<reason>`; or
- `not-a-duplicate:<reason>` when closer inspection disproves the candidate.

Track these dispositions in working context. No candidate may silently remain
untouched or disappear from the final reasoning. Every `safe-to-consolidate`
candidate must either complete the destructive-consolidation protocol in the
current run or be reported as incomplete with the concrete blocker.

Do not create a new knowledge document solely to hold the disposition or
preservation ledger.


### Safe-to-consolidate terminal action

For a whole document classified `safe-to-consolidate`, successful preservation
has one canonical terminal action: remove the redundant source file.

Use this decision rule:

```text
if evidence_verified < evidence_expected:
    keep source intact
else if any non-evidence ledger item is unresolved:
    keep source intact
else if unique knowledge still needs migration:
    update canonical target(s), validate them, and repeat preservation checks
else:
    delete source
```

Do **not** patch or rewrite the source before deleting it. In particular, do not
turn it into any of the following:

- a deprecation or archival stub;
- a consolidation note;
- a redirect/pointer document;
- a shortened copy of the original content;
- a document containing `Curation note` sections.

Those outcomes retain fragmentation and can make a technically successful patch
look like successful consolidation even though the redundant file still exists.
The only exception is when the user explicitly asks to preserve the source path
or the knowledge-base has an existing compatibility convention that requires a
redirect file. In that case report the exception explicitly.

For whole-document consolidation, validate success by confirming that the source
path no longer exists and that the Markdown inventory decreased accordingly.
Do not report `safe-to-consolidate` as completed while the redundant source file
still exists, unless the explicit path-preservation exception applies.

## Document boundaries

Prefer a split when a document:

- mixes multiple responsibilities that already map to canonical document
  types;
- requires substantial scrolling to locate unrelated topics;
- contains a large section that is independently useful and reusable;
- has become an overview that also contains detailed flows, rules,
  persistence, configuration or architecture.

Prefer a merge when multiple documents:

- are very small;
- describe the same responsibility;
- force readers to jump between files to understand one coherent topic;
- can be combined without creating an oversized catch-all document.

Do not use a rigid line-count threshold. Base the decision on responsibility,
cohesion and navigability.

## Naming and organization

Prefer the canonical names defined by `knowledge-generation`.

Rename or move a knowledge document only when the improvement is clear and
localized. When doing so:

- update every internal link that targets the old path;
- update repository or workspace indexes;
- preserve the document's evidence and substantive content;
- avoid renaming files solely for cosmetic preference.

## Navigation and indexes

Treat repository `overview.md` documents and workspace entry-point documents as
navigation surfaces.

After curation:

- ensure detailed documents are reachable through relative Markdown links;
- remove links to deleted or merged knowledge documents;
- repair resolvable broken internal links;
- after repairing or retargeting a link, perform an observable exact search for
  the old target in the affected document (or complete curated scope when the
  old target may have multiple inbound links) and require zero remaining matches
  before reporting the repair complete; also verify the new target exists;
- prefer links over repeated blocks of detail only when evidence preservation
  has already been verified;
- keep Markdown directly browsable from the filesystem.

When no workspace `overview.md` exists, create one only if it provides clear
navigation value for multiple existing workspace documents or repository
knowledge areas.

## Post-write validation

A write is not complete merely because the file was re-read. The observed
result must pass an explicit structural and semantic validation checklist.

After every create, edit, merge, split, move, rename or structural rewrite:

1. re-read the complete affected document when practical; for a very large
   document, read enough contiguous ranges to cover every changed region and
   its structural boundaries;
2. verify every changed heading starts on its own line and expected headings
   occur exactly where intended;
3. verify no old/new fragments were concatenated (for example
   `old heading# new heading`, `NavigationNavigation`, or two list items joined
   without a newline);
4. verify no tool-rendering artifact such as `(End of file)`, patch markers,
   offsets, or diff annotations was written into the Markdown;
5. verify blank lines, lists, links and section boundaries remain valid and
   directly browsable Markdown;
6. verify the old content intended to be replaced is not still interleaved with
   the replacement;
7. verify all intended claims, evidence, confidence, conflicts and open
   questions survived the operation;
8. verify links introduced or changed by the write resolve inside
   `knowledge-base/`;
9. if the change was destructive, re-check the preservation ledger against the
   final target content;
10. only after all checks pass may the write be considered successful.

For any rewrite that changes the document's purpose or replaces multiple major
sections, avoid a fragile contextual patch. Prefer either:

- a small non-destructive localized change that leaves the validated body
  intact (for example a deprecation/navigation banner); or
- a deliberate whole-document replacement followed by a complete read and the
  checklist above.

Do not attempt to emulate a whole-document replacement with a partial patch
that mixes retained and replacement sections.

If validation shows corruption or content loss, repair it immediately from
the last inspected content. If safe repair is uncertain, stop modifying that
file and report the blocker.

## Failed-write recovery

Treat any failed patch or edit as an uncertain filesystem state.

After a failed modification:

1. do not immediately retry against stale assumptions;
2. re-read the complete affected file;
3. compare the observed state with the intended pre-write and post-write
   content;
4. choose a new localized edit only if the current state is coherent and the
   change remains safe;
5. otherwise leave the file unchanged or restore the last known-good content
   when that can be done without losing validated work;
6. re-read again after the recovery write.

Never claim a malformed or unverified recovery as successful curation.

## Safe incremental workflow

1. inventory all existing Markdown files under `knowledge-base/`;
2. inspect the complete inventory and track coverage;
3. identify entry points, document responsibilities and internal links;
4. detect obvious duplication, fragmentation and oversized mixed-purpose
   documents;
5. choose the smallest set of high-confidence improvements;
6. for destructive consolidation, build and verify the evidence-preservation
   mapping first;
7. apply localized edits, moves, merges or splits incrementally;
8. re-read and validate every affected file after each write;
9. after any failed write, re-read before retrying;
10. update affected indexes and links immediately after structural changes;
11. verify that internal relative links resolve;
12. verify complete inventory coverage and preservation of all evidence and
    unresolved information;
13. stop without analysing primary sources unless explicitly requested.

Do not regenerate the knowledge base from scratch.
Do not perform broad rewrites when smaller edits achieve the same result.
