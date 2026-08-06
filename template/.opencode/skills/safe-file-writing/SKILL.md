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

- Prefer one file-modification operation per document.
- Prefer small localized edits over complete rewrites.
- Avoid one large patch spanning several missing directories.
- Persist useful work incrementally.
- Verify each successful write before continuing.
- Preserve completed writes when a later write fails.

## Existing files

- Preserve validated content.
- Update only affected sections whenever practical.
- Do not regenerate a complete document when a localized edit is sufficient.
- Preserve relative links and source references.

## Error handling

When a tool fails, report:

- the exact tool;
- the exact destination or operation;
- the complete returned error.

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

## Completion

Reserve enough execution steps for:

- directory preparation;
- file writing;
- write verification;
- final reporting.
