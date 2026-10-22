# 附录 C 配置模板

> 直接抄，改路径与模型名。所有模板都在 `examples/` 里有对应文件。

## C.1 Pi

### C.1.1 `~/.pi/agent/settings.json`

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-5",
  "defaultThinkingLevel": "medium",
  "enabledModels": ["anthropic/*", "*sonnet*", "openai/gpt-5.1"],

  "defaultTools": ["read", "bash", "edit", "write", "grep", "find", "ls"],

  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  },

  "tuiMode": "fullscreen",
  "theme": "system",
  "quietStartup": false,
  "hideThinkingBlock": false,
  "showCacheMissNotices": true,

  "cacheWarming": "streaming",
  "steeringMode": "one-at-a-time",
  "followUpMode": "one-at-a-time",
  "doubleEscapeAction": "tree",

  "defaultProjectTrust": "ask",
  "sessionShareDestination": "gist",
  "externalEditor": "nvim"
}
```

要点：

- `defaultTools` 里的 `+name` / `-name` 是「增删」，纯名字是「替换」。
- `compaction.reserveTokens` 越小，压缩越晚、越省钱，但溢出风险越高。
- `cacheWarming: "idle"` 会在空闲时保持缓存热，长会话省钱，但有空转成本。
- `defaultProjectTrust` 只能在用户级设置里写。

### C.1.2 `~/.pi/agent/models.json`（本地/兼容端点）

```json
{
  "$schema": "https://pi.dev/schemas/models.schema.json",
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [{ "id": "qwen3-coder:30b" }]
    },
    "my-gateway": {
      "baseUrl": "https://llm.internal/v1",
      "api": "openai-completions",
      "apiKey": "$INTERNAL_LLM_KEY",
      "models": [
        {
          "id": "internal-coder",
          "name": "Internal Coder",
          "contextWindow": 200000,
          "maxOutputTokens": 16000
        }
      ]
    },
    "anthropic": {
      "baseUrl": "https://proxy.example.com/v1"
    }
  }
}
```

### C.1.3 `~/.pi/agent/keybindings.json`

```json
{
  "$schema": "https://pi.dev/schemas/keybindings.schema.json",
  "app.session.tree": "ctrl+shift+t",
  "app.session.new": "ctrl+shift+n",
  "app.model.select": ["ctrl+l"],
  "app.message.followUp": "alt+enter",
  "tui.editor.undo": "ctrl+z"
}
```

### C.1.4 项目级 `.pi/settings.json`

```json
{
  "defaultTools": ["+grep", "+find", "+ls"],
  "compaction": { "reserveTokens": 24000 },
  "extensions": ["../examples/pi-extensions/pre-commit-guard.ts"]
}
```

### C.1.5 `.pi/mcp.json`

见 `examples/mcp/mcp.json`。最小可用：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "description": "只读浏览项目文件",
      "exposure": "codemode"
    }
  }
}
```

### C.1.6 `AGENTS.md`（项目级，可直接用）

见 6.2.2 的完整示例。最小骨架：

```markdown
# <项目名>

## 命令
- 测试：`npm test`（改完必跑）
- 类型检查：`npm run typecheck`
- 手动验证：`TASKS_FILE=/tmp/t.json node src/cli.mjs …`

## 结构
- `src/tasks.mjs` — 纯函数，无 IO
- `src/store.mjs` — 仅 JSON 读写
- `src/cli.mjs` — 参数解析与输出

## 约定
- 错误格式：`<cmd>: <原因>`
- 不新增运行时依赖
- 标识符英文，注释中文

## 禁区
- 不改已有测试断言
- 不格式化整文件
```

## C.2 Claude Code

### C.2.1 `~/.claude/settings.json`

```json
{
  "model": "sonnet",
  "permissions": {
    "allow": ["Read", "Grep", "Glob", "Edit", "Write", "Bash(npm test:*)", "Bash(git status)", "Bash(git diff:*)"],
    "deny": ["Read(./.env*)", "Read(./secrets/**)", "Bash(git push:*)", "Bash(npm publish:*)"]
  },
  "env": {
    "NODE_ENV": "development"
  }
}
```

### C.2.2 项目 `.claude/settings.json`

```json
{
  "permissions": {
    "allow": ["Bash(node src/cli.mjs:*)", "Bash(npm test:*)"],
    "deny": ["Bash(rm -rf:*)", "Bash(git reset --hard:*)"]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": ".claude/hooks/format.sh" }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": ".claude/hooks/guard.sh" }]
      }
    ]
  }
}
```

### C.2.3 `.claude/hooks/guard.sh`

```bash
#!/usr/bin/env bash
# 阻断强推、发布、curl|sh。出错时 fail closed（exit 2）。
set -uo pipefail
cmd=$(jq -r '.tool_input.command // empty') || exit 2
[[ -z "$cmd" ]] && exit 0
if grep -qE 'git[[:space:]]+push.*(--force|-f)\b|npm[[:space:]]+publish|curl[^|]*\|[[:space:]]*(ba)?sh' <<<"$cmd"; then
  echo "blocked: 高风险命令" >&2
  exit 2
fi
exit 0
```

### C.2.4 `.mcp.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "docs": {
      "type": "http",
      "url": "https://docs.internal.example.com/mcp",
      "headers": { "Authorization": "Bearer ${DOCS_TOKEN}" }
    }
  }
}
```

### C.2.5 `.claude/agents/tester.md`

```markdown
---
name: tester
description: 只写测试、不改实现的subagent
tools: Read, Grep, Glob, Write
---
你只允许创建或修改 `test/` 下的文件。永远不要修改 `src/`。

工作方式：
1. 读被测源码，列出对外行为
2. 为每个行为写一个测试，覆盖正常、边界、错误三类
3. 运行 `npm test`，确认新测试先失败（实现还没改）
4. 输出：新增测试清单 + 当前失败原因
```

## C.3 Codex

### C.3.1 `~/.codex/config.toml`

```toml
model = "gpt-5.1-codex"
model_reasoning_effort = "medium"
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[features]
multi_agent_v2 = true

[sandbox_workspace_write]
network_access = false
writable_roots = ["."]

[shell_environment_policy]
inherit = "core"
exclude = ["AWS_*", "GITHUB_TOKEN", "*_SECRET"]

[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "."]
startup_timeout_sec = 20

[mcp_servers.docs]
url = "https://docs.internal.example.com/mcp"
bearer_token_env_var = "DOCS_TOKEN"

[profiles.review]
model = "gpt-5.1-codex"
model_reasoning_effort = "high"
sandbox_mode = "read-only"
approval_policy = "never"

[profiles.ci]
model = "gpt-5.1-codex"
sandbox_mode = "workspace-write"
approval_policy = "never"
```

用法：`codex -p review "审查这次改动"`。

### C.3.2 项目 `.codex/config.toml`

```toml
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[mcp_servers.git]
command = "uvx"
args = ["mcp-server-git", "--repository", "."]
```

### C.3.3 execpolicy（`.codex/*.rules`）

Codex 用 `prefix_rule` 定义「哪些命令前缀需要审批/禁止」，规则文件是 `.rules`（Starlark 风格，不是 TOML）。
它和 `approval_policy` 配合：策略决定「要不要问」，execpolicy 决定「哪些命令必须问」。

```text
# 概念示意（具体语法随版本演进，请用 codex --help / 官方文档核对）
prefix_rule  git push        -> 需要审批
prefix_rule  rm -rf          -> 禁止
prefix_rule  npm test        -> 允许
```

排查时用 `--ignore-rules` 跳过自定义规则，确认「是不是规则把命令挡了」。
`--strict-config` 可以让未知配置字段直接报错，避免规则写错被静默忽略。

## C.4 三份配置的对照

| 关注点 | Pi | Claude Code | Codex |
|---|---|---|---|
| 默认模型 | `settings.json` `defaultModel` | `settings.json` `model` | `config.toml` `model` |
| 工具/权限 | `defaultTools` + 扩展 | `permissions.allow/deny` | `sandbox_mode` + `approval_policy` |
| 生命周期 | 扩展事件 | `hooks` | `hooks`（配置） |
| MCP | `mcp.json` | `.mcp.json` / `claude mcp` | `[mcp_servers.*]` |
| 指令 | `AGENTS.md` | `CLAUDE.md` | `AGENTS.md` |
| 技能 | `skills/` | `.claude/skills/` | `.codex/skills/` |
| 项目信任 | `defaultProjectTrust` + `/trust` | workspace trust | hook trust / `--dangerously-bypass-hook-trust` |

## C.5 一份可复用的 `.gitignore` 片段

```gitignore
# agent 产物
.agent-runs/
.worktrees/
tasks.json
pi-debug.log
*.jsonl.tmp
```

（`tasks.json` 是示例项目的数据文件；真实项目按需调整。）
