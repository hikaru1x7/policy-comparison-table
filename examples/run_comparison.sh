#!/usr/bin/env bash
set -e
# ▼▼▼ ここを書き換える ▼▼▼
BEFORE="旧.docx"
AFTER="新.docx"
OUTPUT="新旧対照表.xlsx"
CHANGED_ONLY=true   # true=変更箇所のみ / false=全条
# ▲▲▲ ここまで ▲▲▲

# ツールの場所 (自分の環境に合わせて変更)
TOOL="$HOME/policy-comparison-table/dist/index.js"

cd "$(dirname "$0")"
ARGS=("$BEFORE" "$AFTER" "--locale" "ja" "--format" "xlsx" "--output" "$OUTPUT")
[ "$CHANGED_ONLY" = true ] && ARGS+=("--changed-only")
node "$TOOL" "${ARGS[@]}"
echo "完了: $OUTPUT"