# Read-only code analysis

**Agent:** Coding

## Prompt

```text
Analizza una repository scelta per il test e descrivi framework, build system e
test disponibili. Non modificare file e non eseguire build.
```

## Expected behavior

- Performs read-only inspection.
- Does not request edit approval.
- Does not run builds or tests.
- Cites the files inspected.
