#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <workspace>" >&2
  exit 1
fi

WORKSPACE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG="$WORKSPACE/opencode.jsonc"

[[ -f "$CONFIG" ]] || { echo "Configuration not found: $CONFIG" >&2; exit 1; }

cat <<'EOF'
Select provider:
  1) OpenAI
  2) Anthropic
  3) Google
  4) DeepSeek
  5) Custom provider/model
EOF

read -r -p "Choice: " choice

case "$choice" in
  1) model="openai/gpt-5-mini"; small_model="openai/gpt-5-mini" ;;
  2) model="anthropic/claude-sonnet-4-5"; small_model="anthropic/claude-haiku-4-5" ;;
  3) model="google/gemini-2.5-flash"; small_model="google/gemini-2.5-flash" ;;
  4) model="deepseek/deepseek-v4-flash"; small_model="deepseek/deepseek-v4-flash" ;;
  5)
    read -r -p "Primary model identifier (provider/model): " model
    read -r -p "Small model identifier (provider/model): " small_model
    ;;
  *) echo "Invalid choice." >&2; exit 1 ;;
esac

python3 - "$CONFIG" "$model" "$small_model" <<'PY'
from pathlib import Path
import re, sys
path = Path(sys.argv[1])
model = sys.argv[2]
small = sys.argv[3]
text = path.read_text(encoding="utf-8")
text = re.sub(r'"model"\s*:\s*"[^"]+"', f'"model": "{model}"', text, count=1)
text = re.sub(r'"small_model"\s*:\s*"[^"]+"', f'"small_model": "{small}"', text, count=1)
path.write_text(text, encoding="utf-8")
PY

echo "Configured model: $model"
echo "Configured small model: $small_model"
echo "Authenticate with: opencode auth login"
echo "Then verify identifiers with /models."
