# Cross-repository analysis

**Agent:** Ask

## Prompt

```text
Esegui un'analisi completa delle relazioni tra le repository.
Distingui dipendenze compile-time, integrazioni runtime e semplici indizi.
Cita le fonti e indica repository coperte, escluse o non determinabili.
```

## Expected behavior

- Loads the `multi-repository-analysis` skill.
- Works in phases instead of scanning everything immediately.
- Distinguishes confirmed, probable and unsupported relationships.
- Does not modify files.
- Reports analysis coverage and limits.
