#!/usr/bin/env bash
# 用本机 Chrome/Chromium 无头模式导出 PDF（浅色打印样式）
set -euo pipefail
cd "$(dirname "$0")/.."
node build/build.mjs >/dev/null

CHROME=""
for c in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$c" >/dev/null 2>&1; then CHROME="$c"; break; fi
done
[ -n "$CHROME" ] || { echo "未找到 Chrome/Chromium，可用打印对话框手动导出" >&2; exit 1; }

mkdir -p dist
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=20000 \
  --print-to-pdf="$(pwd)/dist/book.pdf" \
  "file://$(pwd)/dist/index.html" 2>/dev/null || true

if [ -f dist/book.pdf ]; then
  echo "已生成 dist/book.pdf（$(du -h dist/book.pdf | cut -f1)）"
else
  echo "导出失败：可打开 dist/index.html 用浏览器打印为 PDF" >&2
  exit 1
fi
