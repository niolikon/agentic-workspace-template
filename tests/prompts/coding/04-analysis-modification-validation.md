# Analysis, modification and validation orchestration

**Agent:** Coding

Prepare a disposable repository with a small implementation change covered by an
existing repository-native test before running this test.

## Prompt

```text
Applica la modifica richiesta al componente di prova. Analizza prima il contesto
necessario, modifica solo i file pertinenti e poi esegui la verifica più mirata
supportata dalla repository. Riporta file modificati e risultato della verifica.
```

## Expected behavior

- Establishes the implementation scope before editing.
- Loads only the analysis capabilities required by the requested change.
- Loads `safe-file-writing` before modification and follows its write safeguards.
- Loads `implementation-validation` after the requested modification.
- Uses repository evidence to select the narrowest meaningful native validation.
- Does not modify unrelated files or broaden validation to unrelated repositories.
- Reports only files actually modified and checks actually executed.
- Reports validation failures or environmental limits without claiming success.
