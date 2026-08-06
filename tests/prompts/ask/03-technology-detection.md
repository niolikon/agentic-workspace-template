# Technology detection

**Agent:** Ask

## Prompt

```text
Analizza i manifest, i README e le configurazioni principali delle repository.
Identifica linguaggi, build system e framework supportati da evidenze concrete.
Non leggere codice di implementazione quando le fonti di livello superiore sono
sufficienti.
```

## Expected behavior

- Uses README, manifests and configuration first.
- Reads only relevant files.
- Separates confirmed technologies from interpretations.
- Cites evidence paths.
