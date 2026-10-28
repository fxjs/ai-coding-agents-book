# 任务清单（写作进度）

> 书籍工程：`~/hubGit/ai-coding-agents-book`
> 目标：一本面向软件开发者的、可直接照着做的 AI Coding Agent 实战书，覆盖 Pi / Claude Code / Codex 的**装、用、配、扩、调、迁**与**原理**。
> 对照版本：Pi 1.4.0、Claude Code 2.1.303、Codex CLI 0.163.0。

## 阶段一：工程骨架

- [x] T01 建立目录结构（book / appendix / examples / build / dist）
- [x] T02 写作规范 `STYLE.md`
- [x] T03 任务清单 `TASKS.md`
- [x] T04 书籍首页 `README.md`（目录 + 三条阅读路径 + 约定）
- [x] T05 构建脚本 `build/build.mjs`（零依赖 Markdown→HTML，Mermaid + 打印样式）
- [x] T06 静态检查 `build/check.mjs`（编号 / 表格 / 锚点 / 围栏 / 笔误 / 链接）
- [x] T07 根 `package.json`（build / check / verify / test:examples）

## 阶段二：正文章节（18 章）

- [x] T10 `book/00-preface.md` 前言：为什么现在、读者、三条心态
- [x] T11 `book/01-landscape.md` 从补全到 agent：agent loop、token 预算、三家架构
- [x] T12 `book/02-install.md` 安装、认证与第一个可用配置
- [x] T13 `book/03-first-task.md` 第一次结对：任务卡 + 三种打法
- [x] T14 `book/04-interactive.md` 交互式：界面、键位、斜杠命令来源
- [x] T15 `book/05-headless.md` 非交互：print / JSON / RPC / SDK / CI
- [x] T16 `book/06-context.md` 上下文工程：AGENTS.md、会话树、压缩
- [x] T17 `book/07-tools-security.md` 工具、权限与沙箱（含注入防护）
- [x] T18 `book/08-skills.md` 技能与提示模板
- [x] T19 `book/09-mcp-hooks-plugins.md` MCP、Hooks、插件与扩展
- [x] T20 `book/10-models-cost.md` 模型、思考等级与成本（含算账）
- [x] T21 `book/11-workflows.md` 五大实战工作流
- [x] T22 `book/12-multi-agent.md` 多 agent、并行与云端
- [x] T23 `book/13-pi.md` 工具专章：Pi（生态、配置、扩展全景、边界）
- [x] T38 `book/14-omp.md` omp 实战手册（安装、CLI、TUI、斜杠命令、工具面、子 agent、扩展、自动化与安全）
- [x] T24 `book/15-claude-code.md` 工具专章：Claude Code（权限、checkpoint、后台/云）
- [x] T25 `book/16-codex.md` 工具专章：Codex（沙箱、审批、exec 流水线、多 agent）
- [x] T26 `book/17-internals.md` 内部原理：60 行迷你 agent、会话格式、压缩算法、RPC
- [x] T27 `book/18-migration.md` 横向对比、选型与迁移

## 阶段三：附录与配套代码

- [x] T30 `appendix/a-commands.md` 命令速查（CLI + 斜杠 + 环境变量）
- [x] T31 `appendix/b-keybindings.md` 键位总表（含终端适配）
- [x] T32 `appendix/c-configs.md` 配置模板（三家 + hooks + rules）
- [x] T33 `appendix/d-faq.md` FAQ 与术语表
- [x] T34 `examples/task-cli` 完整源码 + 8 个测试 + README
- [x] T35 `examples/pi-extensions` 可加载扩展 + tsconfig + 类型检查通过
- [x] T36 `examples/skills`、`examples/prompts`、`examples/mcp`、`examples/ci`
- [x] T37 `examples/ci/pi-stream.mjs`、`parallel-worktrees.sh`、`github-actions.yml`
- [x] T39 GitHub Pages 自动部署（push 到 `main` 构建 `dist/` 并发布）

## 阶段四：构建与校验

- [x] T40 `node build/build.mjs` → `dist/index.html` + `dist/book.md`
- [x] T41 链接与锚点校验（check.mjs）
- [x] T42 章节编号与小节编号一致性校验
- [x] T43 术语/笔误抽查（享试等已修）
- [x] T44 示例工程测试（8 passed）、扩展类型检查（tsc 0 error）
- [x] T45 README 与任务清单收尾
- [x] T46 侧栏全文检索：标题/正文/代码索引、命中高亮、上下文片段、↑↓/Enter/Esc、跳转定位
- [x] T46b 搜索增强：`Ctrl/⌘+K`、`?q=` 分享链接、清空按钮、`file://` 兼容、标题命中带后文预览
- [x] T46c 正文内全部命中高亮（CSS Custom Highlight API）+ `F3`/`Shift+F3` 逐处跳转 + n/m 计数
- [x] T48 静态部署修复：`book/*.md` 相对链接在构建时改写为页内锚点；新增锚点校验、favicon、`npm run serve`
- [x] T49 配套代码进 dist：复制 `examples/`、生成 `examples.html` 代码查看器（文件树/行号/复制/下载）、书中 `examples/…` 可点
- [x] T47 术语统一：`agent` 不译（去掉「编码代理/多代理」等译法），标题用 Agent

## 验收记录（最后一次构建）

| 项 | 结果 |
|---|---|
| 文件数 | 24（README + 前言 + 18 章 + 4 附录） |
| 正文字数 | 55,704 词/字（构建统计，含代码与符号） |
| 表格 | 136 |
| Mermaid 图 | 32 |
| 代码块 | 253 |
| PDF | 未重跑（omp 调整为第 14 章后需重新导出） |
| 链接校验 | 通过 |
| 在线阅读 | <https://fxjs.github.io/ai-coding-agents-book/> |
| 编号校验 | 通过 |
| `examples/task-cli` | 8 tests passed |
| `examples/pi-extensions` | `tsc -p tsconfig.json` 无错误 |
| 构建产物 | `dist/index.html`（446,174 字节）、`dist/book.md` |
| 章节调整 | omp 从附录 E 移为 Pi 后的第 14 章，后续章节顺延至第 18 章；构建、链接与编号校验通过，浏览器目录跳转已核对 |

## 约定

- 每个命令都在本机 `--help` 或官方文档核对过；无法核对处标注「示例输出」或「⚠️ 版本敏感」。
- 每章固定结构：**本章目标 → 概念 → 操作 → 代码实践 → 三工具对照 → 技巧与坑 → 练习**。
- 图示优先 Mermaid（GitHub 原生渲染），TUI 布局用 ASCII。
