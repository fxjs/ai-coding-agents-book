# 第 10 章 模型、思考等级与成本

> 本章你将学会：
> - 用「能力 × 速度 × 价格 × 上下文」四维选模型，而不是看榜单
> - 判断什么时候该加思考等级，什么时候该关掉
> - 亲手算清一次任务的成本，并把它降下来一半

## 10.1 选模型：四个维度，一个原则

| 维度 | 差异有多大 | 怎么用 |
|---|---|---|
| 代码能力 | 同一代内差距小，跨代差距大 | 难任务用当前最强 |
| 速度 | 快慢 2–5 倍 | 探索/检索用快的 |
| 价格 | 输入差 5–20 倍，输出更贵 | 粗活给便宜模型 |
| 上下文 | 200k / 400k / 1M | 大仓库或长任务才需要 |

**一个原则**：**按阶段换模型，而不是全程用最贵的。**

```mermaid
flowchart LR
  A[探索: 找文件/读结构] -->|便宜快模型| B[规划: 定方案]
  B -->|强模型 + 高思考| C[实现: 写代码]
  C -->|中等模型| D[验证: 跑测试/修小错]
  D -->|便宜模型| E[收尾: 写摘要/提交信息]
```

Pi 里可以直接把一组模型挂到 `Ctrl+P` 循环上：

```bash
pi --models "sonnet:low,opus:high,haiku:off"
# 或者固定一个作用域
pi --models 'anthropic/*,*sonnet*'
```

`--models` 支持 glob、模糊匹配和 `:<thinking>` 后缀，且会去重后加入循环。

## 10.2 三家的模型配置

### Pi

```bash
pi --model anthropic/claude-sonnet-4-5:high     # provider/id:思考等级
pi --provider openai --model gpt-5.1
pi --list-models sonnet                          # 模糊搜索
```

- 模型目录内置于 Pi，可用 `pi update` 刷新。
- 自定义端点写 `~/.pi/agent/models.json`（见附录 C）。
- 交互内 `/model`（或 `Ctrl+L`）、`/scoped-models` 管理循环集。

### Claude Code

```bash
claude --model sonnet              # 别名，跟随最新
claude --model claude-sonnet-4-5   # 全名，可复现
claude --effort high               # 思考/努力等级
claude --fallback-model sonnet     # 主模型过载时切换
# 交互内 /fast 切低延迟档（命令行无对应开关）
```

Claude Code 还支持 `--autocompact 200k` 控制自动压缩阈值，以及 `--max-budget-usd` 硬性预算。

### Codex

```bash
codex -m gpt-5.1-codex
codex -c model_reasoning_effort="high"
codex -p work                      # 用 ~/.codex/work.config.toml 覆盖配置
codex --oss --local-provider ollama -m qwen3-coder
```

Codex 的 profile 机制适合「一套配置干一类活」：

```toml
# ~/.codex/work.config.toml
model = "gpt-5.1-codex"
model_reasoning_effort = "high"
sandbox_mode = "workspace-write"
approval_policy = "on-request"
```

## 10.3 思考等级：不是越高越好

「思考」是模型在给答案前生成内部推理 token。这些 token **按输出计费**，而且会拉长延迟。

| 等级 | 适合 | 不适合 |
|---|---|---|
| off / minimal | 改错别字、加日志、跑命令、格式转换 | 任何有歧义的需求 |
| low | 单文件小改、写测试、简单重构 | 跨文件重构 |
| medium（默认附近） | 日常开发 | — |
| high | 多文件改动、并发/边界问题、排错 | 简单任务（浪费钱且更慢） |
| max / xhigh | 疑难 bug、架构决策、安全审查 | 几乎所有其它场景 |

判断标准很简单：**如果任务需要「想清楚再动手」，加等级；如果只需要「照着做」，关掉。**

经验数据（数量级）：`high` 往往比 `low` 多花 2–5 倍输出 token、慢 1.5–3 倍，但在需要推理的任务上成功率明显更高。**简单任务用高等级是纯粹的浪费。**

Pi 里：

```bash
pi --thinking high "分析这个竞态条件"
pi --thinking off "给这个函数加注释"
# 交互内 Shift+Tab 循环
```

Claude：`--effort`；Codex：`model_reasoning_effort` 或 `/model` 里选。

## 10.4 算一笔账

成本公式：

```
成本 = 输入token × 输入单价 + 缓存读 × 缓存价 + 缓存写 × 缓存写价 + 输出token × 输出单价
```

假设某模型中档价格（单位：美元/百万 token，**仅用于演示**）：输入 \$3、缓存读 \$0.3、缓存写 \$3.75、输出 \$15。

一个 `task-cli` 级别的任务，12 轮，每轮平均输入 20k（其中 15k 命中缓存）、输出 800：

| 项 | 计算 | 金额 |
|---|---|---|
| 非缓存输入 | 12 × 5k × 3 / 1e6 | \$0.18 |
| 缓存读 | 12 × 15k × 0.3 / 1e6 | \$0.054 |
| 缓存写（首轮） | 20k × 3.75 / 1e6 | \$0.075 |
| 输出 | 12 × 800 × 15 / 1e6 | \$0.144 |
| **合计** | | **≈ \$0.45** |

同样的任务，如果让代理「先通读仓库」（首轮输入 150k，之后每轮 100k），输入成本会变成 10 倍以上，**约 \$4–5**。

**结论**：在这类任务里，输出 token 只占三分之一，**输入（尤其是重复发送的历史）才是大头**。所以省钱的第一手段是「少读、少发、及时压缩」，而不是「换便宜模型」。

## 10.5 八个省钱手段（按收益排序）

| 手段 | 预计收益 | 代价 |
|---|---|---|
| 1. 用 `grep`/`find` 定位，别整文件读 | 30–70% 输入 | 需要工具支持 |
| 2. 阶段间 `/compact`，并给保留清单 | 20–50% | 有信息丢失风险 |
| 3. 任务卡 + 明确验收，减少来回 | 20–40% | 前期多写几行 |
| 4. 探索用便宜/快模型，实现用强模型 | 20–40% | 需要手动切换 |
| 5. 限制工具数量（关掉不用的 MCP） | 5–20% | 少些能力 |
| 6. 裁剪工具输出（只跑相关测试） | 5–15% | 可能漏问题 |
| 7. 保持前缀稳定，命中缓存 | 10–30% | 别中途改系统提示 |
| 8. 设硬上限（预算/超时） | 防灾难 | 可能提前中止 |

反面手段：**把 `max_tokens` 调小**。它只影响输出上限，不会减少输入成本，反而更容易截断。

## 10.6 缓存：最容易被忽视的钱

前缀缓存（prompt caching）让「重复的前缀」按很低的单价计费。前缀 = 系统提示 + 工具定义 + 历史消息（按顺序）。

它很脆弱：

- **改了系统提示** → 全失效。
- **在中间插入消息** → 从插入点之后失效。
- **切换模型** → 通常失效。
- **工具定义顺序变化** → 失效。

所以「会话中途加一个 MCP server 或改工具集」的代价比你想的高。Pi 的做法是：MCP 服务器列表变化时，**追加**一条新的系统提示段，而不是替换，从而保住已缓存的前缀。

## 10.7 本地模型

| 工具 | 支持方式 |
|---|---|
| Pi | 内建 `builtin:llama.cpp` 扩展：`/llama` 管理路由；任何 OpenAI 兼容端点也能写进 `models.json` |
| Codex | `--oss --local-provider ollama\|lmstudio`，或自定义 `model_provider` |
| Claude Code | 不直接支持本地模型；需要 Bedrock/Vertex 或自建兼容网关 |

本地模型的取舍：

- **省钱**：边际成本≈电费。
- **隐私**：代码不出机器。
- **代价**：能力明显弱于前沿闭源模型，长上下文与工具调用稳定性差，TUI 体验依赖推理速度。

实用定位：**本地模型干「不需要聪明」的活**（格式化、批量改名、生成样板、跑固定流程），难的交给云端。

## 10.8 成本可观测

| 工具 | 看哪里 |
|---|---|
| Pi | 页脚累计花费、`/session` 明细、`--mode json` 里的 `usage` |
| Claude Code | `/cost`、`/usage`、`--output-format json` 的 result |
| Codex | `/usage`、statusline 显示、`--json` 事件里的 `token_usage` |

CI 里建议把 usage 写进 artifact：

```bash
pi --mode json "$(cat task.md)" > events.jsonl
jq -s '[.[] | select(.type=="message_end" and .message.usage) | .message.usage] | add' events.jsonl > usage.json
```

## 10.9 技巧与坑

- **输出比输入贵 3–5 倍**，所以「让它少说废话」比「让它少读文件」更直接：在指令里写「只给结论与 diff，不要解释过程」。
- **思考 token 计费**。`max` 等级处理简单任务，可能比 `low` 贵 10 倍，效果还更差。
- **重试是隐形杀手**。工具一直失败 → 模型反复重试 → 每轮都重发全部历史。设 `timeout` 和「同一错误重试不超过 2 次」的指令。
- **长上下文模型不等于该用满**。1M 上下文按 token 计价，塞满一次可能几美元。
- **`--fallback-model` 会带来行为差异**，关键任务别静默降级；或至少在日志里记下来。
- **免费额度不可依赖**：CI 里用付费 key，别用会限流的试用额度。
- **模型别名适合日常，全名适合 CI**：前者自动升级，后者可复现。

## 10.10 练习

1. 用同一个任务分别以 `--thinking off` 和 `high` 跑一次，记录耗时、token、成功率，算出「每分钟省下的钱 vs 多花的钱」。
2. 给你的 `task-cli` 任务算一次真实成本（用 `/session` 或 usage 事件），再按 10.5 的手段优化，目标降 50%。
3. 用 `--models` 配一组「探索/实现/收尾」三档，完整跑一个任务，体会切换节奏。
4. 接一个本地模型（ollama 即可），跑同一个任务，记录它在哪一步开始明显不如云端。
5. 写一个 `cost.sh`：从 JSON 事件流里汇总 token 与估算金额，接进 CI。

---

下一章把前面所有零件装成五个可以直接照抄的工作流。
