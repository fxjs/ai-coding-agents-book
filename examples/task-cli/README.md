# task-cli：全书的示例项目

一个零依赖的待办 CLI，用来演示 AI Coding Agent 的真实工作方式。它足够小（4 个源文件、8 个测试），又足够真实（有 IO、有错误处理、有排序规则、有 CLI 边界）。

## 跑起来

```bash
cd examples/task-cli
node src/cli.mjs --help
node src/cli.mjs add "给 task 加上截止日期" --priority high
node src/cli.mjs list --all
node src/cli.mjs done 1
node src/cli.mjs stats
npm test
```

数据默认写到当前目录的 `tasks.json`，可用 `TASKS_FILE` 指到别处，练习时建议指到 `/tmp`，避免脏工作区：

```bash
TASKS_FILE=/tmp/t.json node src/cli.mjs list
```

## 结构（三层分离，便于 agent 修改）

| 文件 | 职责 | 修改风险 |
|---|---|---|
| `src/tasks.mjs` | 纯函数：创建、完成、删除、筛选、统计、渲染 | 低，改完必须过测试 |
| `src/store.mjs` | IO：读/写 JSON，原子替换 | 中，涉及并发与损坏恢复 |
| `src/cli.mjs` | 入口：参数解析、命令分发、错误输出 | 中，涉及用户可见行为 |
| `test/tasks.test.mjs` | 单元测试（`node:test`） | — |

刻意留白（供第 6、8、11 章练习）：

- 没有截止日期字段
- 没有 `task edit`
- 没有并发写保护（多进程同时写会丢数据）
- 没有 `--json` 输出模式
- 表头在中文环境下对不齐（`padEnd` 按码元计算）

## 为什么用这个项目教学

1. **小到能整体贴进上下文**，便于观察压缩前后模型行为的变化。
2. **有测试**，能演示 TDD 与「先写失败测试」。
3. **有明确分层**，能演示「让 agent 只改一层」的指令写法。
4. **有真实缺陷**，能演示 review 与排错。
