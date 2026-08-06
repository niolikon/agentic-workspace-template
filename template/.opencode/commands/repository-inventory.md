---
description: Rileva repository, linguaggi e build system
agent: ask
subtask: false
---

Analizza tutte le directory immediatamente presenti sotto `repositories/`.

Per ogni repository:

1. verifica la presenza di `.git`;
2. individua i manifest principali;
3. identifica linguaggio e build system solo da evidenze;
4. non leggere codice sorgente non necessario;
5. non modificare file.

Cerca:

- `pom.xml`
- `build.gradle`
- `build.gradle.kts`
- `package.json`
- `*.sln`
- `*.csproj`
- `pyproject.toml`
- `requirements.txt`
- `go.mod`
- `Cargo.toml`

Restituisci una tabella con repository, manifest, linguaggio, build system e
informazioni non determinabili.
