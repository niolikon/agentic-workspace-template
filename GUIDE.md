# Setup guide

## 1. Architecture

The workspace stores project material under a single root:

```text
<workspace>/
├── repositories/
├── documents/
├── trainings/
├── notes/
├── knowledge-base/
├── scripts/
├── .opencode/
├── AGENTS.md
└── opencode.jsonc
```

OpenCode runs from the workspace root and can inspect multiple related repositories. The configured model is remote, so relevant file contents read by an agent may be sent to the selected provider.

Do not place credentials, private keys, production dumps, customer exports or other sensitive material inside the workspace.

## 2. Prerequisites

Install:

- Git;
- Node.js LTS;
- OpenCode;
- the development toolchains required by the repositories;
- Pandoc, when Word documents need to be converted to Markdown.

OpenCode can run directly on Windows, macOS or Linux. WSL is optional.

The required development toolchains depend on the repositories in the workspace.
For example, a Maven project may require Java and Maven, a Gradle project may
provide and use its Gradle wrapper, a .NET project requires the .NET SDK, and a
JavaScript project may require npm, Yarn or pnpm according to its repository
metadata and lockfiles. Python projects likewise require the package/environment
tooling selected by the project.

The `ask` agent can use these native tools to inspect external dependencies when
repository-local evidence is insufficient. It does not install missing tools
automatically. Repository-provided wrappers and explicitly selected package
managers are preferred over generic language defaults.

## 3. Install OpenCode

Using npm:

```bash
npm install -g opencode-ai
```

Verify:

```bash
opencode --version
```

## 4. Optional WSL setup

Open PowerShell as administrator:

```powershell
wsl --install
wsl --update
```

Start Ubuntu:

```powershell
wsl -d Ubuntu
```

Inside WSL:

```bash
sudo apt update
sudo apt install -y \
  git curl jq tree ripgrep fd-find fzf \
  build-essential ca-certificates pandoc shellcheck
```

Install Node.js with `nvm`:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.bashrc
nvm install --lts
npm install -g opencode-ai
```

When the project is stored under:

```text
C:\Users\<user>\Projects\<project>
```

WSL accesses the same directory as:

```text
/mnt/c/Users/<user>/Projects/<project>
```

## 5. Create a workspace

### PowerShell

```powershell
.\scripts\new-project.ps1 `
  -ProjectName MyProject `
  -DestinationRoot "$HOME\Projects"
```

### Bash

```bash
./scripts/new-project.sh MyProject "$HOME/Projects"
```

The scripts copy `template/` into the destination and do not copy `.git`.

## 6. Update an existing workspace

When the template repository evolves, existing workspaces can refresh the OpenCode resources maintained centrally by the template.

First update or pull the template repository, then run:

### PowerShell

```powershell
.\scripts\update-project.ps1 `
  -Workspace "$HOME\Projects\MyProject"
```

Preview without modifying the workspace:

```powershell
.\scripts\update-project.ps1 `
  -Workspace "$HOME\Projects\MyProject" `
  -DryRun
```

### Bash

```bash
./scripts/update-project.sh "$HOME/Projects/MyProject"
```

Preview without modifying the workspace:

```bash
./scripts/update-project.sh "$HOME/Projects/MyProject" --dry-run
```

The updater treats these directories as fully managed by the template:

```text
.opencode/agents/
.opencode/commands/
.opencode/skills/
.opencode/tools/
```

When one of them differs from the template, the destination directory is removed and copied again from the canonical template. Local files added inside these four directories are therefore removed by an update.

Everything else in the destination workspace is preserved. In particular, the updater does not replace the `.opencode` directory itself and does not touch installation or local configuration files such as:

```text
.opencode/node_modules/
.opencode/package.json
.opencode/package-lock.json
.opencode/.gitignore
```

Project-owned content such as `repositories/`, `documents/`, `trainings/`, `notes/` and `knowledge-base/` is also outside the update scope.

## 7. Configure a provider

Run the configuration script from the template repository or copy the `providers/` directory beside the generated workspace.

### PowerShell

```powershell
.\scripts\configure-provider.ps1 `
  -Workspace "$HOME\Projects\MyProject"
```

### Bash

```bash
./scripts/configure-provider.sh "$HOME/Projects/MyProject"
```

Available presets:

- OpenAI;
- Anthropic;
- Google;
- DeepSeek;
- custom provider/model identifiers.

Provider presets are starting points. Before committing the configuration, verify the current model identifiers using:

```text
/connect
/models
```

Credentials must be configured through OpenCode:

```text
/connect
```

or:

```bash
opencode auth login
```

Do not store API keys in `opencode.jsonc`, scripts or Git.

## 8. Start OpenCode

In the default setup, simply open a terminal in the workspace root and start
OpenCode:

### Windows

```powershell
Set-Location "$HOME\Projects\MyProject"
opencode
```

### Bash or WSL

```bash
cd "$HOME/Projects/MyProject"
opencode
```

When the workspace is stored on the Windows filesystem and accessed from WSL:

```bash
cd /mnt/c/Users/<user>/Projects/MyProject
opencode
```

OpenCode automatically discovers the nearest workspace configuration
(`opencode.jsonc`, `.opencode/` and `AGENTS.md`) by walking up the directory
tree, so no additional startup options are normally required.

## 9. Isolated startup (optional)

The workspace also includes `start-opencode` helper scripts.

These scripts start OpenCode using only the configuration contained in the
current workspace. They can be useful when an isolated configuration or a
custom runtime environment is required.

If the default configuration discovery is sufficient for your workflow, the
helper scripts are optional and may be ignored or removed.

### Windows

```powershell
.\start-opencode.ps1
```

### Bash or WSL

```bash
./start-opencode.sh
```

## 10. Agents

The workspace contains three primary agents:

- `ask`: read-only retrieval and cross-repository analysis;
- `coding`: code analysis and controlled modifications;
- `knowledge`: incremental knowledge-base maintenance.

The agents use the model configured in `opencode.jsonc` unless a model is explicitly set in their frontmatter.

## 11. Commands

Available slash commands:

```text
/knowledge-init [repository...]
/knowledge-update <topic>
/knowledge-curate [focus]
/project-help
/repository-inventory
/repository-dependencies
/workspace-inventory
```

Knowledge maintenance is intentionally incremental:

- `/knowledge-init` discovers the workspace and lets you select repositories,
  initialize all repositories, or stop after inventory;
- `/knowledge-init <repository...>` initializes or continues detailed knowledge
  for the selected repositories using the existing knowledge base as cumulative
  validated state;
- `/knowledge-update <topic>` performs a focused update after a specific known
  change or investigation; it is not required to resume incomplete repository
  initialization;
- `/knowledge-curate [focus]` consolidates and maintains generated knowledge.

For large workspaces, initialize repositories progressively across separate runs.
Each scoped run preserves prior validated knowledge, reconciles supported
cross-repository findings and advances repository coverage when the new evidence
justifies it. A repository that is `partially analysed`, `blocked`, `referenced, not
analysed` or `not analysed` can be continued directly with
`/knowledge-init <repository>`.

## 12. Validate the workspace

The `tests/` directory contains a manual validation guide and reusable prompts
for Ask, Coding and Knowledge.

Run each prompt in a new OpenCode session using the agent specified by the
prompt. Verify:

- which tools were used;
- which files were read or modified;
- whether the answer cites local evidence;
- whether write boundaries were respected;
- whether the agent terminates after completing the task;
- whether sensitive files and unrelated content remain untouched.

See [tests/README.md](tests/README.md).

## 13. Privacy

A remote model receives prompts and relevant tool output. File discovery can happen locally, but any file content used for reasoning may be transmitted to the provider.

The workspace therefore:

- denies web tools;
- denies external-directory access;
- excludes common secrets and generated directories from the watcher;
- instructs agents not to inspect credentials, secrets or data dumps;
- minimizes the number and size of files read.

These controls reduce exposure but are not an operating-system sandbox. Verify the provider's data terms and your organization's policies before using proprietary material.


### Temporary dependency artifacts

When an approved `ask` dependency-inspection command downloads an artifact, it
should stage it under `.opencode/.tmp/dependencies/` whenever the native tool
supports an explicit output destination. The directory is
workspace-local, ignored by Git and can be deleted safely when OpenCode is not
using it. Do not configure dependency retrieval to use `%TEMP%`, `/tmp` or other
directories outside the workspace when a workspace-local staging destination can
be supplied. Retrieval itself remains subject to Bash approval.
