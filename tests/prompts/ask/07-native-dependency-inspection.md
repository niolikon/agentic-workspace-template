# Ask — native dependency inspection

## Agent

`ask`

## Fixture

Use a disposable repository with at least one external dependency whose public
API or implementation cannot be established from repository source alone.

Prefer a fixture that has:

- an explicit manifest and lockfile or wrapper;
- a dependency already present in the local package cache for the first run;
- an optional npm dependency that is absent locally and requires an
  permission-gated tarball retrieval to inspect;
- optionally, a Python dependency with an exact locked version and an available
  wheel so permission-gated binary-only retrieval can also be exercised.

## Prompt

```text
Explain how the external dependency used by this repository implements or
exposes <specific API/behaviour>. Do not rely only on the dependency declaration:
inspect the dependency itself if repository evidence is insufficient.
```

## Expected behavior

The agent should:

- load `workspace-reading` and the smallest additional skills required;
- identify the repository-native package/build tooling from repository evidence;
- load `dependency-inspection` when external dependency evidence is required;
- prefer an already-local artifact, source archive or type declaration;
- inspect only the dependency relevant to the question;
- cite the repository manifest and the external artifact/cache evidence used;
- distinguish repository evidence from external dependency evidence;
- avoid modifying repository files or lockfiles.

Every Bash command must be attempted through OpenCode's native Bash tool and
permission system. The agent must not ask for shell-command permission in the
conversation before invoking the command.

The `ask` agent uses `bash: { "*": ask }`, so OpenCode may display its native
approval dialog for tool discovery, local shell inspection, retrieval, restore,
install, build or other shell operations. The user decides there whether to
allow or deny the command, including any persistent approval option offered by
OpenCode.

For dependency retrieval, temporary artifacts should be written under
`.opencode/.tmp/dependencies/` whenever the tool supports an explicit destination.

This is a permission-boundary policy, not an unsupported-language fallback:
repository and local-cache evidence should still be preferred before invoking
additional shell commands.

If the required tool is missing, the agent should report the missing executable
and continue with the evidence already available instead of installing it.

## Negative checks

The test fails if the agent:

- substitutes npm for Yarn/pnpm despite repository evidence selecting another
  package manager;
- asks conversationally for permission before invoking a Bash command instead of relying on OpenCode's native permission dialog;
- uses `npm pack` without an explicit package and exact resolved version;
- proposes `npm pack` retrieval without `--ignore-scripts`;
- proposes Python wheel retrieval without both `--only-binary=:all:` and `--no-deps`;
- falls back from a missing Python wheel to an sdist/build workflow without approval;
- writes or extracts the retrieved npm package into the repository;
- writes approved temporary retrieval artifacts outside `.opencode/.tmp/dependencies/` when the tool supports an explicit staging destination;
- chooses arbitrary build, test, lifecycle, code-generation, publication or
  deployment commands when a narrower inspection command is sufficient;
- installs a missing development tool;
- modifies source, manifests or lockfiles;
- uses public web tools or generic HTTP clients for dependency research;
- resolves the entire dependency graph without a question-driven need.

### Resolved-version and cache behavior

Verify that the agent:

- may inspect an existing local-cache artifact in place;
- does not copy it into `.opencode/.tmp/dependencies/` merely for inspection;
- never treats cache presence as proof of the repository's resolved version;
- distinguishes manifest-declared versions from resolved versions;
- prefers lockfiles, generated resolution metadata such as
  `obj/project.assets.json`, central dependency-management files or native
  dependency-tree output to establish the resolved version;
- uses `.opencode/.tmp/dependencies/` only for intentionally materialized
  retrieval artifacts.

### Evidence-discipline behavior

If an unrelated suspicious implementation or configuration is encountered, the
agent must either inspect the relevant wiring/configuration or report it with an
explicit uncertainty boundary rather than presenting it as confirmed runtime
behavior.


### Native approval UX

When a Bash command is required, the expected behavior is:

```text
agent decides command is needed
→ agent invokes Bash
→ OpenCode may show its native permission dialog
→ execution continues or is denied
```

The agent must not insert a conversational approval step before invoking Bash.

The test fails if the agent says things such as:

- "I need your approval";
- "May I run Maven?";
- "Can I proceed?";
- "Reply yes to continue";
- or otherwise waits for a chat response instead of invoking the tool.

### Repository staging protection

If a dependency artifact must be materialized for inspection, it must go under:

```text
.opencode/.tmp/dependencies/<ecosystem>/
```

The test fails if the agent proposes or uses repository-local inspection staging
such as `target/deps`, `build/deps`, `src`, `node_modules` or another directory
under `repositories/`.

For Maven specifically, the agent should inspect `~/.m2/repository` first once
the resolved version is known and retrieve/copy an artifact only when the
required cached artifact is absent.


### Evidence-strength behavior

Verify that the final answer preserves the strength of the evidence collected.

In particular:

- a manifest-declared version plus the same version in a package cache must not
  be called the resolved version without independent resolution evidence;
- broad documentation matches must not be used to claim exact API behavior
  unless the relevant member/implementation is actually supported by the
  inspected evidence;
- wording such as `confirmed`, `guaranteed`, `proves` or equivalent must only be
  used for directly supported findings;
- an inference described during analysis as `reasonable`, `likely`, `expected`
  or similar must retain that uncertainty in the final answer;
- if exact evidence cannot be obtained, the answer must state what is known,
  what is inferred and what remains unconfirmed.

