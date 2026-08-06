---
name: multi-repository-analysis
description: Metodo per analisi sistematiche su workspace multi-repository
---

# Multi-repository analysis

Use this skill for complete or cross-repository analyses.

## Principles

- Work in phases.
- Inspect manifests and configuration before implementation.
- Keep evidence paths for every conclusion.
- Distinguish compile-time dependencies from runtime integrations.
- Do not load unrelated files.
- Report incomplete coverage explicitly.

## Phases

1. Inventory directories under `repositories/`.
2. Detect Git repositories.
3. Detect manifests and build systems.
4. Extract produced artifacts and package names.
5. Identify compile-time dependencies.
6. Identify runtime integrations only when requested.
7. Produce a consolidated result.
8. Optionally update the knowledge base.

## Required output

Include:

- repositories covered;
- repositories skipped;
- evidence files;
- confirmed relationships;
- probable relationships;
- unknowns and limits.
