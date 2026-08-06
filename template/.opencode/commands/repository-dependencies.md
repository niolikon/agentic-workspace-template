---
description: Individua dipendenze certe tra repository
agent: ask
subtask: false
---

Analizza i manifest delle repository sotto `repositories/`.

Individua soltanto dipendenze interne supportate da evidenze concrete:

- dipendenze Maven o Gradle;
- `ProjectReference` .NET;
- dipendenze npm workspace o locali;
- riferimenti locali equivalenti.

Per ogni relazione indica:

- repository sorgente;
- repository destinazione;
- file sorgente;
- proprietà o riga che costituisce l'evidenza;
- livello di confidenza.

Non cercare integrazioni runtime e non modificare file.
