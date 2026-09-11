# Composite capability routing

**Agent:** Ask

## Prompt

```text
Spiega da dove proviene la configurazione X, come influenza il flusso della
richiesta Y e cosa potrebbe essere interessato se la semantica di X cambiasse.
Usa solo evidenze del workspace e non modificare file.
```

## Expected behavior

- Identifies configuration resolution, execution flow and impact as distinct
  requested outcomes before repository retrieval.
- Loads `configuration-resolution`, `execution-flow-analysis` and
  `impact-analysis` before the first workspace evidence acquisition.
- Lets the primary requested outcome lead without suppressing the other matched
  capabilities.
- Reuses evidence across capabilities instead of restarting repository discovery.
- Uses `workspace-reading` and `repository-analysis` only as supporting
  capabilities when needed.
- Preserves evidence-strength semantics and cites workspace-relative paths.
- Does not modify files or use public-web tools.
