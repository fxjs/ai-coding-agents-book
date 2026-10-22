# 附录 B 键位总表

> Pi 的键位来自官方 `keybindings.md`（1.4.0）；Claude Code 与 Codex 只列常用项，最终以 `/hotkeys`（Pi）、`/keymap`（Codex）、`/help`（Claude）为准。

## B.1 Pi：编辑器

| 动作 | 默认键 | 说明 |
|---|---|---|
| 上/下移动 | `Up` / `Down` | 顶部继续按可翻历史 |
| 左/右移动 | `Left` `Ctrl+B` / `Right` `Ctrl+F` | |
| 按词移动 | `Alt+Left` `Ctrl+Left` `Alt+B` / `Alt+Right` `Ctrl+Right` `Alt+F` | |
| 行首/行尾 | `Home` `Ctrl+A` / `End` `Ctrl+E` | |
| 跳转到字符 | `Ctrl+]` / `Ctrl+Alt+]` | 前跳 / 后跳 |
| 翻页 | `PageUp` / `PageDown` | |
| 删除字符 | `Backspace` / `Delete` `Ctrl+D` | 前删 / 后删 |
| 删除词 | `Ctrl+W` `Alt+Backspace` / `Alt+D` `Alt+Delete` | 前 / 后 |
| 删到行首/行尾 | `Ctrl+U` / `Ctrl+K` | |
| 粘贴删除内容 | `Ctrl+Y`，循环 `Alt+Y` | |
| 撤销 | `Ctrl+-`（Windows `Ctrl+Z`，WSL `Alt+Z`） | |
| 换行 | `Shift+Enter` `Ctrl+J` | |
| 提交 | `Enter` | |
| 补全 | `Tab` | 路径/命令 |
| 复制选中 | `Ctrl+C` | |

## B.2 Pi：应用级

| 动作 | 默认键 | 说明 |
|---|---|---|
| 打断 | `Esc` | 停止当前 run |
| 清空/退出 | `Ctrl+C` | 第一次清编辑器，第二次退出 |
| 退出（空编辑器） | `Ctrl+D` | |
| 挂起 | `Ctrl+Z` | Windows 无默认 |
| 外部编辑器 | `Ctrl+G` | `$VISUAL` / `$EDITOR` |
| 粘贴图片/文件 | `Ctrl+V`（Win/WSL `Alt+V`） | macOS 支持文件 |
| 插话 | `Enter` | 当前 turn 后生效 |
| 追加任务 | `Alt+Enter`（Win `Ctrl+Q`） | 整个任务后生效 |
| 取回排队消息 | `Alt+Up`（Win `Alt+Q`） | |
| 折叠工具输出 | `Ctrl+O` | review 必用 |
| 显示思考块 | `Ctrl+T` | |
| 复制上条回复 | `Ctrl+X` | |
| 选模型 | `Ctrl+L` | |
| 循环模型 | `Ctrl+P` / `Shift+Ctrl+P` | 前后 |
| 思考等级循环 | `Shift+Tab` | |
| 保存为默认 | `Ctrl+S` | 模型/思考等级 |

## B.3 Pi：会话选择器与树

| 动作 | 键 |
|---|---|
| 切换路径显示 | `Ctrl+P` |
| 切换排序 | `Ctrl+S` |
| 只看命名会话 | `Ctrl+N` |
| 重命名 | `Ctrl+R` |
| 删除 | `Ctrl+D`（空查询时 `Ctrl+Backspace`） |
| 树：折叠/上移 | `Ctrl+Left` `Alt+Left` |
| 树：展开/下移 | `Ctrl+Right` `Alt+Right` |
| 树：打标签 | `Shift+L` |
| 树过滤：默认/工具/用户/标签/全部 | `Ctrl+D` `Ctrl+T` `Ctrl+U` `Ctrl+L` `Ctrl+A` |

## B.4 Pi：全屏模式

| 动作 | 键 |
|---|---|
| 翻页 | `PageUp` / `PageDown` |
| 上/下一条提问 | `Ctrl+Shift+Up` / `Ctrl+Shift+Down`（Win `Ctrl+Up/Down`） |
| 搜索转录 | `Ctrl+Shift+F`（Win `Ctrl+F`） |
| 搜索下一个/上一个 | `Enter` `Ctrl+G` / `Shift+Enter` `Ctrl+Shift+G` |
| 关闭搜索 | `Esc` |
| 回到顶部/底部 | `Ctrl+Home` / `Ctrl+End` |

## B.5 Pi：自定义键位

`~/.pi/agent/keybindings.json`：

```json
{
  "$schema": "https://pi.dev/schemas/keybindings.schema.json",
  "app.session.tree": "ctrl+shift+t",
  "app.model.select": ["ctrl+l", "alt+m"],
  "tui.altScreen.pageUp": []
}
```

- 键名格式：`modifier+key`，修饰键 `ctrl` `shift` `alt` `super`。
- 特殊键：`escape` `enter` `tab` `space` `backspace` `delete` `home` `end` `pageUp` `pageDown` `up` `down` `left` `right` `f1`–`f12`。
- 空数组 = 禁用该绑定。
- 改完 `/reload` 生效。

## B.6 Claude Code 常用键

| 动作 | 键 | 备注 |
|---|---|---|
| 切换权限模式 | `Shift+Tab` | plan / acceptEdits / 普通之间循环 |
| 取消当前操作 | `Ctrl+C` | 连按两次退出 |
| 退出 | `Ctrl+D` | |
| 编辑上一条消息 | `Esc` `Esc` | 回到历史消息重新编辑 |
| 历史搜索 | `Ctrl+R` | ⚠️ 版本敏感 |
| 打开转录/详细输出 | `Ctrl+O` | ⚠️ 版本敏感 |
| 多行输入 | `Shift+Enter` 或 `\` 续行 | |
| 引用文件 | `@` | |
| 添加记忆 | `#` 开头 | 写入 CLAUDE.md |
| 执行 shell | `!cmd` | 输出进上下文 |

## B.7 Codex 常用键

| 动作 | 键 | 备注 |
|---|---|---|
| 中断 | `Ctrl+C` | |
| 编辑上一条 | `Esc` `Esc` | |
| 换行 | `Shift+Enter` / `Ctrl+J` | |
| 命令补全 | `/` 后 `Tab` | |
| 提及文件 | `@` | |
| 翻页/搜索转录 | `Ctrl+F`、`PageUp/Down` | 依 TUI 模式 |
| 查看/重绑键位 | `/keymap` | 完整列表在这里 |
| Vim 模式 | `/vim` | 或配置 `tui.editor` |

## B.8 终端适配

| 终端 | 注意 |
|---|---|
| iTerm2 | 需允许剪贴板访问；`/terminal-setup`（Claude）可配 Shift+Enter |
| WezTerm / Kitty | 支持 Kitty 键盘协议，`super` 组合键可用 |
| Windows Terminal | 拦截部分 `Alt` 组合；Pi 提供 `Ctrl+Q` 替代 |
| tmux | `Ctrl+B` 前缀冲突；建议改前缀或 `tmux -L` |
| VS Code 终端 | `Ctrl+K` 等被 IDE 占用；Pi 的 `Ctrl+K` 删到行尾可能失效 |
| SSH | 剪贴板用 OSC 52：Pi 设 `PI_CLIPBOARD_OSC52=1` |

## B.9 快速自检

```bash
pi            # 然后 /hotkeys
codex         # 然后 /keymap
claude        # 然后 /help
```

三个命令能解决 90% 的「为什么我的快捷键没反应」。
