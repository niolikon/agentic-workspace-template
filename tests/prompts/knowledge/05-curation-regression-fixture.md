# Knowledge curation regression fixture

**Agent:** Knowledge

Use the intentional-defect TaskBoard knowledge fixture described in
`tests/fixtures/knowledge-curation/CURATION-TEST-PLAN.md`.

## Prompt

```text
/knowledge-curate
```

## Required PASS behavior

- Invokes `knowledge_inventory` as the authoritative structural inventory for
  canonical repository knowledge, and unions those results with complementary
  Markdown discovery for non-repository knowledge instead of treating a generic
  glob as authoritative.
- Canonically inspects existing repository artifacts with
  `knowledge_artifact_refresh(action=inspect)` when their content is used during
  curation. A deliberately incomplete generic repository-knowledge glob must not
  be able to hide a canonical artifact returned by `knowledge_inventory`.
- Reads all 21 Markdown files in the fixture (or otherwise demonstrates that
  every inventoried Markdown file was inspected); it must specifically inspect
  `TaskBoard.Service.Core/persistence-notes.md` and
  `TaskBoard.Service.Core/todo-not-found-rule.md`.
- Repairs `workspace/overview.md` from `./architecture-legacy.md` to the obvious
  existing `./architecture.md` target without creating a fake legacy file.
- Snapshots and preserves the complete `## Repository coverage` section while
  changing unrelated overview content. Every coverage row, state, knowledge
  artifact and note must remain unchanged after the final write.
- Does not promote `TaskBoard.DropStack.Boot` from `not analysed` merely because
  `knowledge-base/repositories/TaskBoard.DropStack.Boot/overview.md` exists, and
  likewise does not strengthen other intentionally weaker coverage states from
  generated repository knowledge.
- Does not invoke `knowledge_coverage` during ordinary curation. Persisted
  coverage may be observed through `knowledge_inventory`, but curation must not
  infer or mutate state from the resulting artifact organization.
- Classifies `persistence-notes.md` as a high-confidence
  `safe-to-consolidate` duplicate and actually consolidates it; adding a
  DEPRECATED/archive banner while retaining the duplicate body is a failure.
  Consolidation is allowed only if the `TodoRepository.cs` evidence and all
  confidence/qualification information survive in the canonical target. The
  tool log must show an exact preservation check for the source evidence path;
  if the target lacked it, the target must be updated and re-read before the
  fragment is deleted.
- Classifies the standalone Todo NotFound rule as a high-confidence
  `safe-to-consolidate` duplicate and actually consolidates it; a deprecation
  banner that leaves the duplicate body in place is a failure. Controller and
  service evidence must both survive in `business-rules.md` (or another clearly
  canonical target). Topic similarity alone is insufficient; both literal
  evidence paths must be checked against the surviving target before deletion.
- Gives every duplicate/overlap candidate an explicit disposition and outcome;
  in particular `todo-not-found-rule.md` must not be read and then silently
  omitted from consolidation/reporting. The final candidate summary must render
  each candidate's source path, disposition, canonical target(s) or rationale,
  and final outcome; numbered candidate entries with blank or placeholder values
  are a failure.
- For every destructive consolidation, constructs a concrete candidate ledger
  before deletion and keeps it through final reporting. The ledger must contain
  the candidate source/disposition/targets/outcome plus one non-empty evidence
  child record per literal source path, each retaining the exact path, exact
  surviving target and successful verification result. It must also report an
  exact observable counter such as `evidence: 4/4 verified`; deletion is a
  failure when fewer exact evidence checks are visible than the expected source
  evidence count, when the counter is correct but concrete ledger entries are
  missing, or when any surviving target is blank. The final report must render
  those retained ledger values rather than reconstructing empty numbered items
  from aggregate counters.
- Keeps preservation ledgers transient. It must not create
  `curation-runtime-reference-consolidation.md`,
  `curation-persistence-notes-consolidation.md`, `curation-*.md`, or equivalent
  bookkeeping files inside `knowledge-base/` merely to record the operation.
- Classifies `runtime-reference-legacy.md` explicitly. If its canonical targets
  are clear and all preservation items can be mapped, it must be consolidated
  rather than merely wrapped with a DEPRECATED banner. If it is retained as
  `ambiguous` or `must-retain`, the report must state that classification and
  why. A banner that simply keeps the entire duplicate body without such a
  classification is a failure.
- When a surviving existing canonical repository artifact needs a material
  whole-document rewrite, uses `knowledge_artifact_refresh(action=replace)` with
  the revision returned by its canonical inspection; generic `edit`/`write` is
  not an acceptable substitute for that rewrite. A redundant source destined
  for deletion must not first be rewritten into a stub through artifact refresh.
- Re-reads every file it changes after the final write and explicitly validates
  the resulting structure. A `read` followed by a success claim is not enough
  if the observed content contains duplicated/concatenated headings, joined
  old/new prose, or tool artifacts.
- If any patch/edit fails, re-reads the full affected file before retrying and
  maintains exact run counters. The final report must give the true number of
  failed attempts, recovered failures and unresolved failures; two visible
  `%Patch failed` events must be reported as two failed attempts, even if both
  recover successfully.
- For structurally modified files, performs observable corruption probes (for
  example exact searches for `(End of file)`, duplicated/concatenated headings,
  old broken-link targets, or old fragments expected to be removed) in addition
  to re-reading the file.
- Does not read `repositories/`, `documents/`, `trainings/` or `notes/` during
  ordinary curation.
- Does not claim complete curation if any inventoried Markdown file was not
  inspected or if a modified file was not verified after its final write.

## Known regression signatures (must not recur)

- malformed concatenation such as `old textnew text` or duplicated headings
  after a recovery patch;
- `(End of file)` or other tool-rendering artifacts written into Markdown;
- reporting "representative evidence preserved" after deleting unique evidence;
- deleting a fragment with a unique evidence path without an exact target check
  and, when needed, target update + re-read before deletion;
- claiming post-write verification when the re-read visibly contains malformed
  Markdown such as `NavigationNavigation`, joined old/new headings, or
  `(End of file)`;
- globbing the full repository knowledge tree but reading only a subset and
  still reporting the scope as complete;
- avoiding a high-confidence consolidation by prepending DEPRECATED/archive
  banners while leaving the duplicate body in place;
- reporting `no failed writes` after a visible `%Patch failed` or equivalent
  recovered edit failure;
- reporting one failed attempt when multiple edit/patch failures are visible;
- claiming `N/N` evidence verification when fewer than `N` exact evidence-path
  checks are observable in the tool log;
- reporting a successful destructive consolidation while candidate-ledger or
  evidence-ledger entries render as empty bullets/numbered rows despite correct
  aggregate counters;
- discarding concrete `evidence path -> surviving target` mappings after
  verification and trying to reconstruct them only when composing the final
  summary.
- creating persistent `curation-*.md` / `*-consolidation.md` bookkeeping files
  as a substitute for transient preservation-ledger working state;
- reading a duplicate candidate such as `todo-not-found-rule.md` but neither
  assigning it a disposition nor reporting/consolidating it;
- reconstructing or normalizing `## Repository coverage` during an unrelated
  overview edit;
- inferring `analysed` coverage from the existence of a repository
  `overview.md`;
- resolving contradictory coverage rows by guessing from curated Markdown
  instead of reporting a coverage consistency problem.
