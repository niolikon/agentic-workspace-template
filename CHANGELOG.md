# Changelog
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
