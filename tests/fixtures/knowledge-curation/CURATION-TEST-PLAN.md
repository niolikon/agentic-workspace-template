# Knowledge curation intentional-defect test plan

This fixture is based on the original TaskBoard knowledge base and contains four deliberate defects. Run `/knowledge-curate` with no source-analysis request.

## Defect A — broken internal link

Location: `knowledge-base/workspace/overview.md`

Injected link: `./architecture-legacy.md` while the existing target is `./architecture.md`.

Expected: the curator should detect and repair the link to the obvious existing document. It must not create a fake `architecture-legacy.md`.

## Defect B — duplicated / fragmented persistence knowledge

Location: `knowledge-base/repositories/TaskBoard.Service.Core/persistence-notes.md`

This small file substantially overlaps `data-flows.md`. It also carries a `TodoRepository.cs` evidence reference that must not be lost.

Expected: consolidate it into the canonical repository knowledge (most naturally `data-flows.md`, possibly with a link if justified) and avoid keeping unnecessary duplicated prose. Preserve all relevant evidence and confidence.

## Defect C — unnecessarily fragmented business rule

Location: `knowledge-base/repositories/TaskBoard.Service.Core/todo-not-found-rule.md`

The rule duplicates the existing NotFound section in `business-rules.md`, but includes explicit controller evidence too.

Expected: merge/consolidate the rule into `business-rules.md` and preserve both relevant evidence paths. The tiny standalone file should normally become unnecessary.

## Defect D — oversized mixed-responsibility workspace document

Location: `knowledge-base/workspace/runtime-reference-legacy.md`

This deliberately monolithic note mixes architecture, orchestration, execution/data flow, authentication, gateway, repository relationships, a decision, and unresolved questions. Its claims are derived from existing knowledge and overlap canonical workspace documents.

Expected: reorganize it conservatively. Acceptable outcomes include consolidating unique/evidence-bearing details into canonical workspace documents and removing/replacing the legacy note with navigation, or splitting only where that produces clearer canonical responsibilities. It should NOT simply preserve the monolith unchanged if it recognizes the overlap/size problem, and it must not discard evidence, confidence, or unresolved qualifications.

## Critical negative checks

During ordinary `/knowledge-curate`:

- no `Read`, `Glob`, `Grep`, or inventory operation should target `repositories/`, `documents/`, `trainings/`, or `notes/`;
- evidence paths under `repositories/...` are references to preserve, not authorization to reopen source files;
- only `knowledge-base/` should be modified;
- no source repository or source documentation should be changed.

## PASS evidence to collect

Keep the full OpenCode tool-call log and the resulting Git diff. We can use both to evaluate detection, consolidation, link repair, evidence preservation, and source-analysis boundaries.


## V4 regression expectations

- High-confidence duplicate fragments must be consolidated, not merely marked
  DEPRECATED while retaining their duplicate body.
- Destructive consolidation must show an observable preservation ledger/check
  sequence before deletion.
- Structural rewrites must use a whole-document replacement or remain
  unchanged; broad partial-patch banner rewrites are not acceptable.
- Post-write validation must include mechanical corruption probes, not only a
  semantic `Read`.
- Any recovered failed patch/edit must remain visible in the final report as a
  recovered failure.
