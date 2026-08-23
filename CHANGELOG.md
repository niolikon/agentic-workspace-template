# Changelog

- Hardened Ask execution-flow routing so execution questions load `execution-flow-analysis` before repository retrieval, including empty-workspace cases.

- Added focused execution-flow reconstruction for Ask, with automatic skill selection, evidence-ranked transitions, framework/dependency resolution, cross-repository continuation and independent manual validation scenarios.

- Added completion discipline so dependency analysis stops once the requested answer is complete instead of appending unsolicited follow-up investigation menus.

- Finalized dependency evidence boundaries: unresolved versions remain explicitly unconfirmed, provider-specific claims require provider evidence, and required verification cannot be deferred to optional follow-up menus.

- Added local-source short-circuiting, stricter declared/cache/resolved wording, retrieval retry discipline, and direct archive-inspection fallbacks for dependency analysis.

- Refined dependency inspection to prefer in-place cache evidence, reserve workspace staging for necessary retrieval/transformation, tolerate native resolution metadata, and prevent stronger runtime guarantees than the inspected API contract supports.

- Tightened dependency evidence discipline so declared/cached/resolved versions remain distinct and inferences cannot be promoted to confirmed findings without direct API or resolution evidence.

- Hardened dependency inspection UX: no conversational Bash approval, native OpenCode permission dialogs only, Maven cache-first inspection, and mandatory workspace-local staging for newly materialized artifacts.

- Refined dependency evidence handling: inspect caches in place, prove resolved versions from resolution metadata, reserve staging for retrieval, and preserve uncertainty for unrelated anomalies.
- Hardened `/knowledge-curate` destructive consolidation with an explicit preservation ledger, exact evidence-path target checks, structural post-write validation, and safer handling of broad rewrites.

## 0.1.0
- Hardened knowledge curation with complete Markdown inventory coverage, strict evidence-preservation mapping, post-write verification and failed-patch recovery.
- Added the TaskBoard intentional-defect curation regression fixture and manual regression test.
- Added `/knowledge-curate` for source-independent incremental knowledge-base curation.
- Simplified README for workspace users.
- Replaced automated test harness with manual validation guide and prompts.
- Added `/init-knowledge` for complete knowledge-base initialization.
- Added knowledge-base initialization example.
- Initial provider-agnostic workspace template.
- Added Ask, Coding and Knowledge agents.
- Added reusable commands and multi-repository analysis skill.
- Added PowerShell and Bash initialization scripts.

## Knowledge curation candidate coverage and transient ledgers

- Require an explicit disposition/outcome for every duplicate or overlap candidate.
- Keep preservation ledgers as transient working state instead of creating curation bookkeeping files in `knowledge-base/`.
- Extend the regression fixture contract to reject silent candidates and persistent `curation-*.md` consolidation logs.

### Dependency inspection staging

- Route approved dependency retrieval through the workspace-local `.opencode/.tmp/dependencies/` staging area.
- Keep `external_directory: deny` and require Bash approval for every command that retrieves, restores, installs, builds or otherwise materializes external dependencies.
- Keep only local inspection and harmless tool discovery auto-allowed.
- Make project update scripts create Git-ignored dependency staging directories for existing workspaces.
