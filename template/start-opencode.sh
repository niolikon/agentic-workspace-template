#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

export OPENCODE_CONFIG_DIR="$PROJECT_ROOT/.opencode"
exec opencode "$@"
