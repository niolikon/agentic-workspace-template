#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 3 ]]; then
  echo "Usage: $0 <project-name> [destination-root] [--git]" >&2
  exit 1
fi

PROJECT_NAME="$1"
DESTINATION_ROOT="${2:-$HOME/Projects}"
INITIALIZE_GIT="${3:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_ROOT="$REPOSITORY_ROOT/template"
DESTINATION="$DESTINATION_ROOT/$PROJECT_NAME"

[[ -d "$TEMPLATE_ROOT" ]] || { echo "Template not found: $TEMPLATE_ROOT" >&2; exit 1; }
[[ ! -e "$DESTINATION" ]] || { echo "Destination exists: $DESTINATION" >&2; exit 1; }

mkdir -p "$DESTINATION_ROOT"
cp -a "$TEMPLATE_ROOT" "$DESTINATION"

if [[ "$INITIALIZE_GIT" == "--git" ]]; then
  git -C "$DESTINATION" init
fi

echo "Workspace created: $DESTINATION"
echo "Configure a provider, authenticate OpenCode, then start it from the workspace root."
