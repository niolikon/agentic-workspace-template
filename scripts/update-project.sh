#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage: update-project.sh [workspace] [--dry-run]

Updates the template-managed OpenCode resources in an existing workspace.
Only these directories are replaced:
  .opencode/agents
  .opencode/commands
  .opencode/skills
  .opencode/tools

All other .opencode content is left untouched.
USAGE
}

WORKSPACE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -* )
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
    *)
      if [[ -n "$WORKSPACE" ]]; then
        echo "Only one workspace path may be specified." >&2
        usage
        exit 1
      fi
      WORKSPACE="$1"
      shift
      ;;
  esac
done

WORKSPACE="${WORKSPACE:-$PWD}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_OPENCODE="$REPOSITORY_ROOT/template/.opencode"
DESTINATION_OPENCODE="$WORKSPACE/.opencode"
MANAGED_DIRECTORIES=(agents commands skills tools)

[[ -d "$WORKSPACE" ]] || { echo "Workspace not found: $WORKSPACE" >&2; exit 1; }
[[ -d "$SOURCE_OPENCODE" ]] || { echo "Template OpenCode directory not found: $SOURCE_OPENCODE" >&2; exit 1; }

for directory in "${MANAGED_DIRECTORIES[@]}"; do
  [[ -d "$SOURCE_OPENCODE/$directory" ]] || {
    echo "Template-managed directory not found: $SOURCE_OPENCODE/$directory" >&2
    exit 1
  }
done

has_changes() {
  local source="$1"
  local destination="$2"

  [[ -d "$destination" ]] || return 0
  ! diff -qr "$source" "$destination" >/dev/null 2>&1
}

if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run: $WORKSPACE"
else
  mkdir -p "$DESTINATION_OPENCODE"
  echo "Updating workspace: $WORKSPACE"
fi

changed=0
for directory in "${MANAGED_DIRECTORIES[@]}"; do
  source="$SOURCE_OPENCODE/$directory"
  destination="$DESTINATION_OPENCODE/$directory"

  if [[ ! -d "$destination" ]]; then
    status="ADD"
  elif has_changes "$source" "$destination"; then
    status="UPDATE"
  else
    status="UNCHANGED"
  fi

  printf '%-9s .opencode/%s\n' "$status" "$directory"

  if [[ "$status" != "UNCHANGED" ]]; then
    changed=$((changed + 1))
    if [[ "$DRY_RUN" == false ]]; then
      rm -rf "$destination"
      cp -a "$source" "$destination"
    fi
  fi
done

if [[ "$DRY_RUN" == true ]]; then
  echo "No files were modified. Managed directories with changes: $changed"
else
  echo "Update complete. Managed directories changed: $changed"
fi
