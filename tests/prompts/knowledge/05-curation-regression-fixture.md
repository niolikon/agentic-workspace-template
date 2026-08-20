# Knowledge curation regression fixture

**Agent:** Knowledge

Use the intentional-defect TaskBoard knowledge fixture described in
`tests/fixtures/knowledge-curation/CURATION-TEST-PLAN.md`.

## Prompt

```text
/knowledge-curate
```

## Required PASS behavior

- Reads all 21 Markdown files in the fixture (or otherwise demonstrates that
  every inventoried Markdown file was inspected); it must specifically inspect
  `TaskBoard.Service.Core/persistence-notes.md` and
  `TaskBoard.Service.Core/todo-not-found-rule.md`.
- Repairs `workspace/overview.md` from `./architecture-legacy.md` to the obvious
  existing `./architecture.md` target without creating a fake legacy file.
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
  omitted from consolidation/reporting.
- For every destructive consolidation, enumerates the source evidence set and
  reports an exact observable counter such as `evidence: 4/4 verified`; deletion
  is a failure when fewer exact evidence checks are visible than the expected
  source evidence count.
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
  checks are observable in the tool log.
- creating persistent `curation-*.md` / `*-consolidation.md` bookkeeping files
  as a substitute for transient preservation-ledger working state;
- reading a duplicate candidate such as `todo-not-found-rule.md` but neither
  assigning it a disposition nor reporting/consolidating it.
