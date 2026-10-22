#!/usr/bin/env bash
# 并行跑多个只读调查任务：每个 agent 一个独立 worktree，互不干扰。
# 用法: ./parallel-worktrees.sh "问题描述" 分支名1 分支名2 ...
#       AGENT=claude ./parallel-worktrees.sh "..." a b
set -euo pipefail

AGENT="${AGENT:-pi}"
PROMPT="${1:?用法: $0 <问题> <标签...>}"
shift
[ "$#" -gt 0 ] || { echo "至少给一个标签" >&2; exit 2; }

REPO_ROOT="$(git rev-parse --show-toplevel)"
BASE="$(git rev-parse --abbrev-ref HEAD)"
OUT="$REPO_ROOT/.agent-runs/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT"

pids=()
for tag in "$@"; do
  wt="$REPO_ROOT/.worktrees/$tag"
  git -C "$REPO_ROOT" worktree add -q -b "probe/$tag" "$wt" "$BASE" 2>/dev/null || true
  (
    cd "$wt"
    case "$AGENT" in
      pi)      pi --print --no-session --tools read,bash,grep,find,ls -- "$PROMPT 你的角度：$tag" ;;
      claude)  claude -p --permission-mode plan -- "$PROMPT 你的角度：$tag" ;;
      codex)   codex -s read-only -a never exec -- "$PROMPT 你的角度：$tag" ;;
      *) echo "未知 AGENT=$AGENT" >&2; exit 2 ;;
    esac
  ) >"$OUT/$tag.md" 2>"$OUT/$tag.err" &
  pids+=("$!: $tag")
done

fail=0
for entry in "${pids[@]}"; do
  pid="${entry%%:*}"; tag="${entry##*: }"
  if wait "$pid"; then echo "✔ $tag"; else echo "✖ $tag (见 $OUT/$tag.err)"; fail=1; fi
done

echo "输出目录: $OUT"
echo "清理: git worktree remove --force .worktrees/<tag> && git branch -D probe/<tag>"
exit "$fail"
