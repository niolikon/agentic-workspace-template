---
description: Inizializza la knowledge base analizzando tutte le fonti del workspace
agent: knowledge
subtask: false
---

Inizializza la knowledge base del progetto utilizzando le fonti disponibili in:

- `repositories/`;
- `documents/`;
- `trainings/`;
- `notes/`.

Procedi per fasi:

1. inventaria le fonti disponibili senza leggere indiscriminatamente tutti i file;
2. individua repository, manifest, README, configurazioni e documenti principali;
3. ricostruisci componenti, responsabilità, tecnologie, dipendenze e integrazioni;
4. confronta le fonti e segnala conflitti, lacune e informazioni non verificabili;
5. crea una knowledge base iniziale coerente e tracciabile;
6. cita sempre i percorsi delle fonti utilizzate;
7. modifica esclusivamente file sotto `knowledge-base/`;
8. non modificare repository, documenti, training o note.

Crea, quando supportati da evidenze, i seguenti file:

- `knowledge-base/overview.md`;
- `knowledge-base/repositories.md`;
- `knowledge-base/architecture.md`;
- `knowledge-base/integrations.md`;
- `knowledge-base/development.md`;
- `knowledge-base/operations.md`;
- `knowledge-base/glossary.md`.

Non creare sezioni vuote o contenuti riempitivi. Se un file esiste già, preserva
le informazioni valide, aggiorna soltanto ciò che può essere verificato e segnala
nel riepilogo finale i file creati o modificati.
