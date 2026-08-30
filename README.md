# Agentic Workspace Template

A reusable template for creating multi-repository workspaces managed with [OpenCode](https://opencode.ai).

Each workspace separates:

- source-code repositories;
- official documents;
- training and knowledge-transfer notes;
- personal notes;
- derived knowledge;
- OpenCode agents, commands and skills.

The template is provider-agnostic. OpenAI, Anthropic, Google, DeepSeek or another provider supported by OpenCode can be selected during setup and changed later without rewriting the agents.

## Quick start

### Create a workspace from GitHub

1. Select **Use this template** on GitHub.
2. Create a new repository or download the generated project.
3. Follow [GUIDE.md](GUIDE.md) to install OpenCode and configure a provider.
4. Authenticate the provider through `/connect`.
5. Start OpenCode from the workspace root.

### Create a local workspace without Git history

Download or clone this repository, then run:

```powershell
.\scripts\new-project.ps1 `
  -ProjectName MyProject `
  -DestinationRoot "$HOME\Projects"
```

Or from Bash:

```bash
./scripts/new-project.sh MyProject "$HOME/Projects"
```

The generated workspace is copied from `template/` and does not inherit the template repository's `.git` directory.


### Update an existing workspace

After pulling a newer version of this template repository, refresh the template-managed OpenCode resources in an existing workspace with:

```powershell
.\scripts\update-project.ps1 -Workspace "$HOME\Projects\MyProject"
```

Or from Bash:

```bash
./scripts/update-project.sh "$HOME/Projects/MyProject"
```

The updater replaces only `.opencode/agents`, `.opencode/commands`, `.opencode/skills` and `.opencode/tools`. Other `.opencode` content, including OpenCode installation files such as `node_modules`, `package.json`, `package-lock.json` and `.gitignore`, is left untouched.

Preview the update without changing files with `-DryRun` in PowerShell or `--dry-run` in Bash.

## Workspace commands

```text
/knowledge-init [repository...]
/knowledge-update <topic>
/knowledge-curate [focus]
/project-help
/repository-inventory
/repository-dependencies
/workspace-inventory
```

Use scoped `/knowledge-init <repository...>` both for first-time initialization
and to continue repositories whose knowledge is incomplete. Existing validated
knowledge is cumulative across runs. Use `/knowledge-update <topic>` for focused
changes or investigations rather than for completing repository initialization.

## Documentation

- [Setup guide](GUIDE.md)
- [Provider presets](providers/README.md)
- [Manual validation prompts](tests/README.md)
- [Usage examples](examples/)
