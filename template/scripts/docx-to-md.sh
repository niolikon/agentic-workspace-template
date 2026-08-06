#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 documents/file.docx" >&2
  exit 1
fi

INPUT="$1"
[[ -f "$INPUT" ]] || { echo "File not found: $INPUT" >&2; exit 1; }

NAME="$(basename "$INPUT" .docx)"
OUTPUT_DIR="documents/converted"
MEDIA_DIR="$OUTPUT_DIR/${NAME}-media"
OUTPUT_FILE="$OUTPUT_DIR/${NAME}.md"
TEMP_FILE="$(mktemp)"

mkdir -p "$MEDIA_DIR"

pandoc "$INPUT" \
  --from=docx \
  --to=gfm \
  --extract-media="$MEDIA_DIR" \
  --output="$TEMP_FILE"

cat > "$OUTPUT_FILE" <<EOF
---
source: ../$(basename "$INPUT")
generated: true
format: docx-to-markdown
---

EOF

cat "$TEMP_FILE" >> "$OUTPUT_FILE"
rm -f "$TEMP_FILE"

echo "Created: $OUTPUT_FILE"
