# 附录 A 命令速查

> 基准版本：Pi 1.4.0 · Claude Code 2.1.303 · Codex CLI 0.163.0
> 只列常用项，完整列表请用 `--help`。标 ⚠️ 的项在小版本间变动过。

## A.1 同一件事，三种写法

| 需求 | Pi | Claude Code | Codex |
|---|---|---|---|
| 进入交互 | `pi` | `claude` | `codex` |
| 一次性执行 | `pi -p "…"` | `claude -p "…"` | `codex exec "…"` |
| 管道输入 | `git diff \| pi -p "…"` | `git diff \| claude -p "…"` | `git diff \| codex exec "…"` |
| JSON 输出 | `--mode json` | `-p --output-format json` | `codex exec --json` |
| 事件流 | `--mode json` | `-p --output-format stream-json` | `codex exec --json` |
| 指定模型 | `--model provider/id:high` | `--model sonnet` | `-m gpt-5.1-codex` |
| 思考等级 | `--thinking high` | `--effort high` | `-c model_reasoning_effort="high"` |
| 追加系统提示 | `--append-system-prompt` | `--append-system-prompt` | 写 `AGENTS.md` / `-c model_instructions_file` |
| 只读 | `--tools read,grep,find,ls` | `--permission-mode plan` | `-s read-only -a never` |
| 限制工具 | `--tools/-t`、`--exclude-tools/-xt` | `--allowedTools`、`--disallowedTools` | `-c tools.*`、`--enable/--disable` |
| 免审批 | 默认不审批 | `--dangerously-skip-permissions` | `--dangerously-bypass-approvals-and-sandbox` |
| 继续会话 | `-c` | `-c` | `codex resume --last` |
| 选择会话 | `-r` | `-r` | `codex resume` |
| 指定会话 | `--session <id>` | `--resume <uuid>` | `codex resume <id>` |
| 分叉 | `--fork <id>` | `--fork-session` | `codex fork` |
| 不落盘 | `--no-session` | `--no-session-persistence` | `--ephemeral`（exec） |
| 命名 | `-n "名字"` | `-n "名字"` | TUI `/rename` |
| 导出 | `--export out.html` | `/export` | `/export`（md） |
| 指定工作目录 | 当前目录 | `--add-dir` | `-C/--cd`、`--add-dir` |
| 独立工作树 | 手动 `git worktree` | ⚠️ 手动 | `--worktree` |
| 健康检查 | `pi --version` | `claude doctor` | `codex doctor` |
| 升级 | `pi update` | `claude update` | `codex update` |

## A.2 Pi

### 顶层命令

```text
pi [options] [--] [@files...] [messages...]
pi install <source> [-l]        安装扩展/包并写入设置
pi remove|uninstall <source> [-l]
pi update [source|self|pi]      升级自身 / 扩展 / 模型目录
pi list                         已安装扩展
pi config [-l]                  TUI 勾选启用哪些资源（Tab 切作用域）
pi auth <check|print-api-key|print-bearer-token> [--provider X]
pi mcp <add|remove|list|login|logout>   # 会话内 /mcp 可 reconnect
```

### 常用选项

| 分组 | 选项 |
|---|---|
| 模型 | `--provider`、`--model`、`--models`、`--thinking`、`--api-key`、`--list-models [search]` |
| 模式 | `--mode text\|json\|rpc`、`-p/--print` |
| 会话 | `-c`、`-r`、`--session`、`--session-id`、`--fork`、`--session-dir`、`--no-session`、`-n/--name` |
| 工具 | `-t/--tools`、`-xt/--exclude-tools`、`-nt/--no-tools`、`-nbt/--no-builtin-tools`、`--no-mcp` |
| 资源 | `-e/--extension`、`-ne/--no-extensions`、`--skill`、`-ns/--no-skills`、`--prompt-template`、`-np`、`--theme`、`--use-theme`、`--no-themes`、`-nc/--no-context-files` |
| 其他 | `--export`、`--tui-mode fullscreen\|regular`、`-a/--approve`、`-na/--no-approve`、`--offline`、`--verbose` |

### 斜杠命令

| 分组 | 命令 |
|---|---|
| 模型设置 | `/settings` `/model` `/thinking` `/scoped-models` `/login` `/logout` `/llama` |
| 会话 | `/new` `/resume` `/name` `/session` `/tree` `/fork` `/clone` `/compact` `/import` |
| 导出 | `/copy` `/export` `/share` `/bug` |
| 运行时 | `/trust` `/reload` `/hotkeys` `/changelog` `/quit`（`/debug`） |

## A.3 Claude Code

### 子命令

```text
claude                 # 交互
claude -p "…"          # 一次性
claude mcp add|list|remove|add-json|add-from-claude-desktop|serve
claude plugin ...      # 插件
claude agents ...      # 后台 agent（--bg 启动的会话）
claude auth ...        # 认证
claude setup-token     # 长期 token（需订阅）
claude doctor          # 体检
claude update|upgrade
claude install [stable|latest|<ver>]
claude sandbox ...     # 沙箱
```

### 常用选项

| 分组 | 选项 |
|---|---|
| 输出 | `--output-format text\|json\|stream-json`、`--input-format`、`--json-schema`、`--include-partial-messages`、`--replay-user-messages` |
| 权限 | `--permission-mode plan\|acceptEdits\|auto\|manual\|dontAsk\|bypassPermissions`、`--allowedTools`、`--disallowedTools`、`--permission-prompts host\|none`、`--dangerously-skip-permissions` |
| 模型 | `--model`、`--effort`、`--fallback-model`、`--autocompact`、`--max-budget-usd`（`/fast` 只在交互内） |
| 会话 | `-c`、`-r`、`--session-id`、`--fork-session`、`-n`、`--from-pr`、`--no-session-persistence` |
| 上下文 | `--add-dir`、`--system-prompt[-file]`、`--append-system-prompt[-file]`、`--settings`、`--setting-sources`、`--bare`、`--safe-mode`、`--restricted` |
| 集成 | `--ide`、`--chrome`/`--no-chrome`、`--desktop`、`--remote-control`、`--bg`、`--cloud`、`--mcp-config`、`--plugin-dir`、`--plugin-url` |

### 斜杠命令（本机版本存在）

```text
/help /clear /compact /config /model /effort /fast
/permissions /login /logout /memory /init /resume /rewind /export /share /copy
/cost /context /usage /stats /status /statusline /doctor
/hooks /mcp /plugin /skills /tasks /agents /add-dir
/vim /terminal-setup /sandbox /ide /todos /output-style /keybindings
/review /security-review /pr-comments /release-notes /bug /feedback /upgrade
/teleport /workflows /import /remote /remote-control /desktop /chrome
/fork /branch /archive /unarchive /stop /ultrareview /insights /recap
/design /goal /claude-api /install-github-app /reload-plugins /web-setup
```

> ⚠️ 版本敏感：Claude Code 的命令集合扩张很快，升级后用 `/help` 确认。

## A.4 Codex

### 子命令

```text
codex                       # 交互
codex exec [PROMPT]         # 非交互（别名 codex e）
codex review --base main    # 独立代码审查
codex apply <task-id>       # 把最新 diff 以 git apply 落地
codex resume [--last]       # 恢复
codex fork                  # 分叉
codex queue "…"             # 给运行中的会话排队
codex archive|unarchive|delete <id>
codex agents                # 浏览本地 agent 会话
codex mcp list|add|remove
codex plugin add|list
codex login|logout|login status
codex features list|enable|disable
codex doctor / update / completion / debug
codex sandbox               # 在 Codex 沙箱里跑命令
codex cloud                 # 云端任务（实验）
codex app-server / remote-control   # 服务化（实验）
```

### 常用选项（顶层）

| 分组 | 选项 |
|---|---|
| 模型 | `-m/--model`、`-c model_reasoning_effort="high"`、`--oss`、`--local-provider ollama\|lmstudio`、`-p/--profile` |
| 权限 | `-s/--sandbox read-only\|workspace-write\|danger-full-access`、`-a/--ask-for-approval on-request\|never`、`--approve-for-me`、`--dangerously-bypass-approvals-and-sandbox` |
| 工作区 | `-C/--cd`、`--add-dir`、`--worktree`、`--skip-git-repo-check` |
| 其他 | `--search`（联网）、`-i/--image`、`--no-alt-screen`、`--no-daemon`、`--remote ws://…`、`-c key=value`、`--enable/--disable <feature>` |

### `codex exec` 专属

| 选项 | 作用 |
|---|---|
| `--json` | JSONL 事件到 stdout |
| `-o, --output-last-message <file>` | 最后一条消息另存 |
| `--output-schema <file>` | 约束最终输出结构 |
| `--ephemeral` | 不写会话文件 |
| `--ignore-user-config` / `--ignore-rules` | 忽略用户配置 / execpolicy |
| `--color auto\|always\|never` | 颜色 |

### 斜杠命令

```text
# 会话
/new /resume /fork /rename /archive /delete /undo /compact /recap /status /clear /quit
# 模型与运行
/model /fast /plan /permissions /experimental /tui /raw /vim /keymap /theme /pet
# 上下文与生态
/init /mention /diff /skills /memory /hooks /mcp /apps /plugins /prompts
# 进阶
/agents /btw /voice /goal /worktree /desktop /usage /ps /stop /daemon /cd /pwd
/debug-config /statusline /rollout /feedback /import /review /approve /test-approval
```

## A.5 环境变量

| 用途 | Pi | Claude Code | Codex |
|---|---|---|---|
| API Key | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` 等（随 provider） | `ANTHROPIC_API_KEY` | `OPENAI_API_KEY` |
| 配置目录 | `PI_CODING_AGENT_DIR` | `CLAUDE_CONFIG_DIR` ⚠️ | `CODEX_HOME` |
| 会话目录 | `PI_CODING_AGENT_SESSION_DIR` | — | — |
| 离线 | `PI_OFFLINE=1` | — | — |
| 遥测 | `PI_TELEMETRY=0` | — | — |
| 代理（proxy） | `HTTP_PROXY` / `HTTPS_PROXY` | 同 | 同 |

## A.6 退出码约定（脚本化时用）

| 工具 | 0 | 非 0 |
|---|---|---|
| Pi | 完成（`agent_settled`） | 参数错误、认证失败、运行中止 |
| Claude Code | 完成 | 同上，另有预算/权限中止 |
| Codex | 完成 | 同上 |

建议：关键路径不要只信退出码，同时校验输出结构（schema 或 `jq` 断言）。
