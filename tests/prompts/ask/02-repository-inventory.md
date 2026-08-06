# Repository inventory

**Agent:** Ask

## Prompt

```text
Identifica tutte le repository Git immediatamente presenti sotto repositories/.
Per ciascuna indica i manifest principali e il build system dimostrabile.
Cita i percorsi usati come evidenza e segnala ciò che non è determinabile.
```

## Expected behavior

- Covers every immediate repository directory.
- Inspects manifests before implementation code.
- Does not modify files.
- Cites local paths.
- Does not infer missing technologies.
