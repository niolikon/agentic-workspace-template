# Root inventory

**Agent:** Ask

## Prompt

```text
Elenca esclusivamente le directory immediatamente presenti nella root del
workspace. Non descrivere il contenuto interno e non modificare file.
```

## Expected behavior

- Uses a read-only discovery tool.
- Does not modify files.
- Does not use subagents.
- Lists only directories actually found.
- Reports a tool failure instead of inventing an answer.
