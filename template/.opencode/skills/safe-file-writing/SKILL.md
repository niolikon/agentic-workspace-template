---
name: safe-file-writing
description: Safe path validation, directory preparation and incremental file writing
---

# Safe file writing

Use this skill before modifying files.

## Destination validation

Before every write:

1. resolve the intended destination;
2. verify that the destination is inside the agent's allowed scope;
3. refuse writes outside the allowed scope;
4. verify that the parent directory exists;
5. create missing parent directories before invoking the file-editing tool.

Never assume that a file-editing tool creates missing parent directories.

## Writing strategy

### Mandatory whole-file replacement

When another loaded workflow designates a file as requiring whole-file
replacement, tool choice is part of correctness:

- use the `write` tool with the complete desired file contents;
- do not use `edit`, patch, row insertion or diff-style replacement for that
  operation, even if the edit tool could theoretically replace the whole file;
- if `write` is unavailable or denied, report the blocker instead of silently
  falling back to `edit`;
- after `write`, re-read the complete file and validate the persisted structure.

For scoped `knowledge-init`, an existing
`knowledge-base/workspace/overview.md` is such a mandatory whole-file
replacement target during cumulative coverage reconciliation.

- Prefer one file-modification operation per document.
- Prefer small localized edits over complete rewrites.
- When the intended change replaces multiple major sections, prepends a new
  framing section while also changing existing structure, or changes the
  document's purpose, do not approximate the result with a contextual partial
  patch. Use a deliberate whole-document replacement, or do not perform that
  structural rewrite.
- A banner insertion is a localized edit only when the existing body remains
  byte-for-byte/semantically intact and no duplicate headings or content are
  introduced. If the desired result changes both framing and body, it is a
  whole-document rewrite.
- Avoid one large patch spanning several missing directories.
- Persist useful work incrementally.
- Verify each successful write by re-reading the affected file before
  continuing.
- Preserve completed writes when a later write fails.

## Existing files

- Preserve validated content.
- Update only affected sections whenever practical.
- Do not regenerate a complete document when a localized edit is sufficient.
- Preserve relative links and source references.

## Post-write validation

Treat tool success and a subsequent `read` as necessary but not sufficient.
A write is complete only after the observed file passes the checks below.

After every successful write:

1. re-read the affected file (the complete file when practical);
2. confirm expected headings start on their own lines and were not duplicated
   or concatenated with the previous content;
3. reject obvious corruption signatures such as repeated labels
   (`NavigationNavigation`), joined old/new headings, joined list items, or
   missing structural newlines around the edited region;
4. reject tool artifacts accidentally persisted as content, including
   `(End of file)`, patch/diff annotations, read offsets or tool status text;
5. verify expected blank lines, lists and Markdown links remain structurally
   valid;
6. verify text intended to be replaced is not still interleaved with the new
   version;
7. verify every item explicitly expected to be preserved is still present;
8. only then consider the write complete.

For structural edits such as merges, splits, moves, renames or large section
replacement, full-file re-read is required when practical.

A report must not say "verified" merely because a `read` occurred. Verification
means the checklist above was evaluated against the observed content.

## Mechanical validation probes

For every structurally changed Markdown file, perform tool-visible probes after
the final write in addition to the semantic re-read. Use exact searches or
equivalent checks against the written file for corruption signatures relevant
to the edit. At minimum check for:

- `(End of file)`;
- `NavigationNavigation`;
- duplicated adjacent top-level headings when the document should have one
  title;
- the exact old heading immediately concatenated with the exact new heading or
  replacement text;
- duplicated adjacent section labels or duplicated lines introduced by the
  edit;
- any old broken-link target that the edit was intended to remove.

When the pre-write content and intended replacement are known, explicitly
search for the old fragment after the write when it is supposed to have been
removed, and search for the intended new fragment when it is supposed to have
been introduced.

A probe that finds a corruption signature is a failed validation even if the
file is readable and the edit tool returned success. Repair it before
continuing. If it cannot be repaired safely, stop modifying dependent files.

Do not claim `no failed writes` when any edit/patch tool returned a failure and
was later recovered. Maintain explicit working counters for the run:

- `write_attempt_failures`: increment once for every edit/patch/write tool call
  that returns failure, even when a later retry succeeds;
- `write_failures_recovered`: increment only after a failed attempt has been
  recovered and the resulting file passes post-write validation;
- `write_failures_unresolved`: failed attempts that remain unrecovered.

The final report must state the exact counts, for example:
`failed write attempts: 2; recovered: 2; unresolved: 0`.
Do not collapse multiple failed attempts into a single incident, and do not
reset the counters after successful recovery.

## Error handling and recovery

When a tool fails, increment `write_attempt_failures` immediately and report or
retain for the final report:

- the exact tool;
- the exact destination or operation;
- the complete returned error.

If recovery later succeeds, increment `write_failures_recovered`; otherwise
leave the failure counted as unresolved.

Distinguish:

- missing parent directories;
- permission denials;
- approval requests;
- invalid paths;
- malformed patches;
- filesystem errors.

Never infer a cause without direct tool evidence.
Never claim that a write was blocked unless an actual tool invocation returned
a denial.

A failed patch or edit leaves the affected file in an uncertain state. Before
retrying:

1. re-read the complete affected file;
2. determine its actual current content instead of relying on the pre-failure
   buffer;
3. retry only against that observed state;
4. after the recovery write, re-read the file again;
5. if the file cannot be verified as coherent, stop editing it and report the
   blocker rather than continuing with potentially corrupt content.

## Completion

Reserve enough execution steps for:

- directory preparation;
- file writing;
- full or targeted post-write verification;
- failed-write recovery when needed;
- final reporting.

Do not report a modified file as successfully completed unless its final state
was validated after the last write. If validation fails, do not continue with
dependent destructive edits that assume the knowledge base is coherent.


## Tool-owned knowledge coverage

`knowledge-base/workspace/overview.md` may contain a tool-owned
`## Repository coverage` section. During `knowledge-init`, do not use `edit` or
`write` to mutate that section. Use `knowledge_coverage`; it performs the
validated deterministic replacement.

During `knowledge-curate`, the same section is a preservation boundary rather
than a curation target. Before any generic edit/write of the containing overview,
snapshot the complete existing coverage section. Modify only unrelated content
and, after the write, re-read the overview and require the extracted coverage
section to match the snapshot unchanged. Do not reconstruct coverage from
repository knowledge, do not infer state from repository artifacts, and do not
repair inconsistent coverage through free-form Markdown editing. Report such
inconsistencies for deterministic coverage reconciliation instead.

Other overview sections remain subject to normal safe-file-writing rules.
