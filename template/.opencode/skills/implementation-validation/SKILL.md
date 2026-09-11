---
name: implementation-validation
description: Validate focused code changes with repository-native checks and report only verification actually performed
---

# Implementation validation

Use this skill after a coding change to select and execute the smallest meaningful
validation supported by repository evidence.

The objective is to verify the requested change without turning validation into a
broad unrelated build exercise or modifying project intent.

## Validation strategy

1. identify the files and behavior changed by the implementation;
2. identify the repository-native build, test, lint or static-analysis mechanism
   from workspace evidence;
3. prefer the narrowest check that meaningfully covers the changed behavior;
4. expand to broader verification only when the change scope or repository
   conventions justify it;
5. inspect failures before retrying or broadening the command;
6. report exactly what ran, what passed, what failed and what was not verified.

Prefer existing repository wrappers and project-defined validation entry points
when available. Do not invent a validation command from ecosystem convention when
repository evidence identifies a different mechanism.

## Scope discipline

Validation must follow the established implementation scope.

- Do not test unrelated repositories merely because they exist in the workspace.
- For a change inside a submodule repository, validate that repository first.
  Validate an orchestrator only when the requested change also affects its pinned
  commit, build/deployment behavior or another evidenced integration boundary.
- Reuse analysis evidence about execution paths, architecture and repository
  relationships when selecting checks.
- Do not add dependencies, rewrite configuration or change production behavior
  solely to make a validation command pass.

## Failure handling

A failed validation command is evidence, not permission to make unrelated fixes.

When a check fails:

1. capture the failing command and relevant error;
2. determine whether the failure is caused by the requested change, pre-existing
   workspace state, missing environment prerequisites or an unresolved external
   boundary;
3. fix only failures that are within the requested implementation scope;
4. rerun the narrowest affected check after an in-scope fix;
5. leave unrelated failures unchanged and report them explicitly.

Do not report validation as successful when a required check did not run to
completion.

## Read-only validation preference

Prefer validation commands that do not intentionally modify tracked source files.
Normal build and test outputs are acceptable when produced by the repository's
native toolchain, but validation artifacts are not source changes and must not be
reported as implementation files.

If a proposed validation requires an operation outside the agent's permissions,
invoke the permitted tool boundary normally and let the native permission system
handle approval. Do not simulate success conversationally.

## Reporting contract

Report:

- checks executed;
- pass/fail result for each meaningful check;
- relevant failures or skipped checks;
- any environmental or scope limitation that prevents stronger verification.

Do not claim coverage beyond the checks actually performed.
