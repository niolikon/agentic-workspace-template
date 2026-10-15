# Template development

This repository is the primary development target. `template/` contains the
OpenCode resources distributed to generated workspaces; `template/AGENTS.md`
describes those workspaces, not the root development workflow.

Use `.agents/skills/feature-development/SKILL.md` for issue development with Codex
Local. Codex owns analysis, implementation, validation and local Git iterations.

The sibling `opencode-agent-test-harness` is an independent validation toolkit.
Use its existing interfaces; extend it only for a concrete, documented need.
Do not build another development orchestrator or use its legacy launchers as the
development workflow. Its `validate-candidate` profile is specific to issue #56;
select validation interfaces according to the current feature.

Demo and TaskBoard are E2E bases. Run OpenCode against disposable copies, never
their original sources. Keep logs, traces, diffs and reports outside the candidate,
normally in the sibling `harness-results` directory, preserving previous attempts.
