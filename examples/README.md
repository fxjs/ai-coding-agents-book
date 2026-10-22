# 配套代码索引

| 目录 | 用途 | 对应章节 |
|---|---|---|
| `task-cli/` | 全书示例项目：零依赖待办 CLI（含 8 个测试） | 3、6、8、11、13 |
| `pi-extensions/` | 可加载的 Pi 扩展：提交前守卫 + 自定义命令 | 9、13 |
| `skills/code-review/` | 团队代码审查技能（`SKILL.md`） | 8 |
| `prompts/` | 提示模板：重构、排错、迁移 | 8、11 |
| `mcp/` | MCP 服务器配置样例（项目级/用户级） | 9 |
| `ci/` | GitHub Actions 中调用 agent 的三种写法 | 5、11 |

## 快速自检

```bash
cd task-cli && npm test          # 应输出 8 passed
cd ../pi-extensions && node --check pre-commit-guard.ts 2>/dev/null || npx tsc --noEmit pre-commit-guard.ts
```
