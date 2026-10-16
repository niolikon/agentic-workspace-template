---
name: feature-development
description: Sviluppa issue di agentic-workspace-template con Codex Local, validazione indipendente tramite harness e OpenCode su copie Demo/TaskBoard, e commit locali Conventional Commits per iterazioni validate. Usa per implementare issue, non per la sola revisione o configurazione del workflow.
---

# Feature development

Conduci lo sviluppo direttamente con Codex Local. Questa skill standardizza il
processo; non introduce un orchestratore software e non avvia i launcher legacy
`develop` o `run-workflow` dell'harness. Non eseguire push, merge o apertura di PR.
Rispetta eventuali limiti espliciti dell'utente, inclusa una richiesta di sola
analisi o di sospendere i commit.

## Input e analisi

- Richiedi una issue di sviluppo con ID e descrizione completa, requisiti e criteri
  di accettazione. Accetta facoltativamente una issue di test con ID, scenari e
  criteri di verifica. Usa testo fornito, documenti locali o integrazioni disponibili:
  non dipendere da GitHub/GitLab, dai loro CLI o da un formato proprietario.
- Recupera i dettagli ricavabili dalle issue, dal repository e dalla documentazione
  prima di chiedere informazioni. Se mancano dati obbligatori non recuperabili,
  chiedi solo quelli. L'assenza di una issue di test non blocca lo sviluppo:
  ricava gli scenari dai requisiti, senza inventare un ID di test.
- Leggi gli `AGENTS.md` applicabili e le sezioni pertinenti di `README.md`,
  `ARCHITECTURE.md`, `GUIDE.md`, `tests/README.md`, codice e dipendenze.
  Consulta le engineering guideline pertinenti in
  `template/documents/engineering-guidelines/`, rispettandone ambito ed eccezioni.
  `template/AGENTS.md` governa i workspace generati e i file nel suo ambito;
  non sostituisce le istruzioni di sviluppo alla radice.
- Prima di implementare, prepara una matrice requisito → scenario → evidenza attesa.
  Per ogni riga indica criterio/ID, provenienza dello scenario (issue di test o
  requisito), controllo statico/deterministico/E2E e osservazione che proverebbe
  l'esito. Collega ogni scenario dell'eventuale issue di test ai requisiti coperti;
  segnala scenari senza requisito e requisiti senza copertura.
- Segnala contraddizioni sostanziali tra requisiti e test. Non risolverle cambiando
  arbitrariamente requisiti, aspettative o oracoli. Chiedi una decisione sulla parte
  ambigua e prosegui sulle parti indipendenti già definite.

## Preparazione Git e implementazione

1. Controlla branch, HEAD, stato staged/unstaged e file non tracciati. Registra la
   baseline e le modifiche preesistenti; preservale e non includerle nei tuoi commit.
2. Usa un branch dedicato all'issue, riutilizzandolo se già corretto. Segui le
   convenzioni del repository; in assenza di una prescrizione usa
   `codex/issue-M-breve-descrizione`. Se il working tree contiene modifiche che
   impediscono di lavorare senza mescolarle, usa un worktree isolato dalla baseline
   pertinente oppure chiedi una decisione sul conflitto. Non perdere modifiche,
   non fare stash automatici, reset distruttivi, clean, checkout forzati o rewrite
   della storia. Non assumere che un worktree includa modifiche non committate.
3. Implementa incrementi coerenti e limitati ai file necessari. Riutilizza componenti
   esistenti, conserva i comportamenti estranei all'issue e rispetta encoding,
   line ending e convenzioni locali. Non introdurre infrastruttura o astrazioni
   senza necessità concreta.
4. Aggiungi test deterministici appropriati ai comportamenti modificati e alle
   regressioni pertinenti. Non aggiungere test che verifichino soltanto la formulazione
   delle istruzioni. Esegui i controlli statici e automatici applicabili.

## Scegliere la validazione indipendente

`agentic-workspace-template` è il candidato; il repository fratello
`opencode-agent-test-harness` è un toolkit indipendente. Demo e TaskBoard sono basi
di prova, non target da modificare direttamente. Individua i percorsi reali senza
codificare directory personali. Leggi README, istruzioni applicabili e interfacce
effettive dell'harness (anche `--help` e implementazione pertinente) prima di usarlo.
Tratta `DEVELOPMENT_CONTEXT.md`, se pertinente, come storia da verificare.

- Per feature generiche usa il runner `py -B -m opencode_harness --source ...
  --suite ... --output ...`, eseguito dalla root dell'harness. Con
  `--workspace-base` il runner copia Demo o TaskBoard e vi distribuisce le risorse
  del candidato tramite gli script esistenti. Seleziona la base pertinente, entrambe
  quando i requisiti lo richiedono; motiva la copertura scelta.
- Il runner senza `--workspace-base` usa una copia del solo `template/`: utile per
  smoke test del template, non prova di integrazione con Demo/TaskBoard. Nella
  modalità workspace-base verifica `candidate-deployment.json`: provider e
  `AGENTS.md` della base sono conservati. Se la feature richiede cambiamenti a questi
  file o ad asset non distribuiti dall'updater, prepara e documenta una base isolata
  rappresentativa prima dell'esecuzione; non presumere che siano stati aggiornati.
- `validate-candidate --candidate ... --stage preflight|e2e` applica attualmente il
  profilo `issue-56-kind-externalId/v1`. Usalo solo quando quel contratto è pertinente,
  come verifica specifica o regressione, mai come gate universale. Il solo preflight
  non è un E2E; `--only` non dimostra il risultato di una suite completa. Le suite
  storiche `semantic_outcome_contract` con baseline `contract-gap` non sono gate
  post-implementazione; valuta il contratto e l'oracolo della suite scelta.
- Riutilizza suite e fixture pertinenti. Per scenari nuovi definisci prompt,
  fixture e aspettative dai requisiti prima di valutare l'output del candidato.
  Una suite generica usa `version: 1`, `workspace_source: "template"` e `scenarios`
  con `id`, `prompt_file`, eventuale `overlay_dir`, `agent`, `timeout_seconds`,
  `required_sut_files` ed `expected`. I percorsi di prompt/overlay sono relativi
  alla suite. Consulta gli esempi reali, come `examples/suite.example.json` e
  `examples/suite.taskboard.evidence.json`, senza ereditarne aspettative non pertinenti.
- Mantieni separata la definizione dell'esito atteso dalla soluzione implementata.
  Non cambiare oracoli indipendenti o aspettative per far passare il candidato.
  Documenta un difetto del test e chiedi una decisione se il requisito non ne
  determina chiaramente la correzione. Estendi l'harness soltanto per un'esigenza
  concreta documentata, rispettando le sue istruzioni e validandone la modifica.
  Preferisci nuove suite dichiarative nelle evidenze a nuove infrastrutture.

Esempio PowerShell per il runner generico, dalla root dell'harness, sostituendo
suite e directory con quelle pertinenti alla specifica iterazione:

```powershell
py -B -m opencode_harness `
  --source "..\agentic-workspace-template" `
  --suite "..\harness-results\issue-M\iteration-01\suite.json" `
  --workspace-base "..\TaskBoard" `
  --output "..\harness-results\issue-M\iteration-01\e2e" `
  --opencode "$env:APPDATA\npm\opencode.cmd"
```

Su Windows verifica il percorso reale del launcher npm `.cmd`, evitando lo shim
`.ps1`. Verifica disponibilità CLI, autenticazione provider e modello senza leggere
o copiare credenziali. Usa basi prive di segreti; registra modifiche locali della
base che entrano nella copia. I workspace temporanei non sono un sandbox del sistema
operativo. Non eseguire OpenCode direttamente nei sorgenti originali Demo/TaskBoard.
Non modificare il candidato durante una validazione.

### Acceptance, provenance e prerequisiti

Consulta i contratti attuali nell'harness: `README.md` (Combined E2E acceptance e
`required_calls`), `PROVENANCE.md` (External semantic evaluation), `PREFLIGHT.md`
e `FIXTURE_POLICY.md`. Sono le fonti normative; applica questa sequenza usando le
interfacce esistenti, senza introdurre un secondo workflow di validazione:

1. Prima del runner dichiara nella suite gli oracoli obbligatori tramite
   `required_semantic_checks`, ricavati dalla matrice requisito/scenario. Un
   `required_calls` soddisfatto richiede evidenza esplicita di completamento.
2. Valuta il preflight: `unknown` indica una condizione non verificata, anche se
   l'aggregato dei probe locali è passato; risolvi i prerequisiti necessari senza
   trasformarli in PASS. Configurazione, autenticazione o disponibilità di un
   provider non implicano consenso remoto. Rispetta l'autorizzazione esplicita
   dell'utente prima di eseguire modelli remoti. Usa `fixture_policy` solo quando
   serve selezionare fixture, preservando gli input obbligatori degli oracoli;
   non è un filtro universale né una sanitizzazione dei contenuti.
3. Esegui il runner e conserva il manifest `provenance.json`. Distingui esecuzione
   (`report.status`, con le sue asserzioni) e acceptance complessiva: exit 1 con
   esecuzione riuscita e soli oracoli obbligatori mancanti è atteso in questa fase
   e non dimostra da solo un difetto funzionale. Esamina comunque gli altri gate.
4. Per oracoli esterni successivi al runner prepara un'area di valutazione nuova,
   fuori dall'archivio finalizzato e dal SUT, secondo `PROVENANCE.md`. Copia solo
   report ed evidenze necessarie byte per byte mantenendo i percorsi relativi;
   verifica run ID, hash del report e delle evidenze contro l'archivio/manifest.
   Produci lì diagnostiche ed envelope `semantic-results/<scenario>/<check>.json`.
   Non aggiungere file all'archivio, non riscriverne report o manifest.
5. Richiedi l'aggregazione aggiornata con `acceptance --report <evaluation>/report.json
   --output <nuova-directory>`. Prima di accettare richiedi exit 0,
   `acceptance_status: passed`, `complete_suite: true`, run ID e SHA-256 del report
   corrispondenti all'originale. Conserva il collegamento verificabile tra aggregato,
   area di valutazione e archivio/manifest come descritto nel contratto provenance.
   Revisioni delle evidenze richiedono nuovi tentativi conservando i precedenti.
6. Usa `--archive-inputs` soltanto quando serve verifica indipendente dagli input
   originali, scegliendo basi sintetiche/prive di segreti. Quando tale garanzia
   archivistica è richiesta, usa `verify-archive` con output esterno all'archivio
   e richiedi `verified`, anche dopo la valutazione. Integrità archivistica e
   acceptance funzionale sono gate distinti. Senza oracoli esterni rimane valido
   il percorso acceptance del runner; nessun passaggio archivistico è obbligatorio
   incondizionatamente.

Codex Local decide l'accettazione e crea commit di completamento soltanto dopo
tutti i gate obbligatori superati; runner, oracoli, acceptance e provenance non
prendono questa decisione.

## Evidenze e iterazioni

- Conserva tutto fuori dal candidato, normalmente in
  `../harness-results/issue-M/iteration-NN/`, con directory nuove per ogni tentativo.
  Salva matrice, input di test, comandi, versioni, modello, baseline/HEAD del candidato,
  stato locale e diff inclusi file nuovi, log statici e risultati. Il runner generico
  crea una sottodirectory univoca con `report.json`/`report.md` e artefatti per scenario:
  conserva `events.jsonl`, stderr, trace, deployment, delta e diff disponibili.
  Usa `--keep-workspaces` se servono artefatti finali non conservati nei normali report.
  Non sovrascrivere né eliminare le evidenze dei tentativi precedenti.
- Distingui esplicitamente: skill invocata (chiamata osservata e completata),
  comportamento osservato (letture, scritture, output, delta), esito verificato
  (asserzione/oracolo e criterio coperto). Una menzione della skill, una required-call
  generica senza stato, testo atteso o exit code zero non bastano a provare l'esito
  semantico. Leggi le trace e applica verifiche sostanziali ai criteri di accettazione.
- Aggiorna la matrice con esito e percorso dell'evidenza per ogni riga. Distingui
  superato, fallito, bloccato e non eseguito; rendi espliciti skip, copertura parziale
  e limiti del modello remoto. Non dichiarare coperti criteri senza evidenza.
- A ogni fallimento separa difetto del candidato, problema ambientale e difetto del
  test. Correggi autonomamente i difetti di implementazione quando il percorso è
  chiaro, poi riesegui i test interessati e le regressioni pertinenti. Conserva il
  risultato precedente. Per ambiguità sostanziali su requisiti, oracoli o modifiche
  incompatibili chiedi una decisione prima di procedere su quella parte.
- Un'iterazione è completata con successo quando il suo incremento dichiarato è
  implementato e tutte le verifiche necessarie a quell'incremento sono superate.
  Può restare lavoro per incrementi successivi, da dichiarare. Una verifica richiesta
  fallita o non eseguita impedisce di dichiarare riuscita l'iterazione: documenta il
  blocco e chiedi una decisione sul consolidamento parziale, senza commit automatico.

## Commit locale dopo ogni iterazione riuscita

Crea autonomamente un commit locale per ogni iterazione di sviluppo e validazione
completata con successo, anche se l'issue richiede altri incrementi. Usa Conventional
Commits con tipo e scope coerenti con il diff; per iterazioni soltanto di test usa
normalmente `test(scope)`. Non creare commit vuoti.

Prima del commit controlla diff completo, `git diff --check`, diff staged e lista
dei file staged. Aggiungi solo file/hunk dell'iterazione, mai modifiche preesistenti
o estranee; non usare indiscriminatamente `git add .`. Se lo staging preesistente
impedisce un commit selettivo sicuro, risolvi l'isolamento senza alterarlo oppure
chiedi una decisione. Verifica che il contenuto da committare corrisponda al candidato
validato e che nessuna modifica successiva abbia invalidato le verifiche.

Il messaggio contiene subject Conventional Commits, body descrittivo, l'eventuale
riga `Test: #N <scenari verificati>` soltanto se è stata fornita una issue di test
identificata, e come ultima riga `Refs #M` con l'ID dell'issue di sviluppo.
Sostituisci M e N con gli ID effettivi, conservando l'identità delle issue. Senza
issue di test ometti completamente `Test:`, anche se hai eseguito test automatici;
puoi descrivere la validazione nel body senza quel prefisso.
Non dichiarare superate verifiche fallite o non eseguite. Dopo il commit registra
hash e messaggio effettivi nelle evidenze e ricontrolla lo stato Git.

## Resoconto di ogni iterazione

Restituisci un resoconto sintetico con implementazione e file modificati, comandi
statici/automatici ed esiti, E2E e comportamento osservato, matrice di copertura dei
criteri, percorsi delle evidenze e limitazioni. Includi hash e messaggio del commit
creato (oppure motivo dell'assenza), lavoro residuo e prossimo passo consigliato.
Non fermarti a proporre correzioni se puoi completarle autonomamente nell'ambito
autorizzato. Non dichiarare conclusa l'issue finché restano criteri non verificati.
