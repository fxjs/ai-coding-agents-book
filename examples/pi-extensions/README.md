# Pi 扩展示例：pre-commit-guard

一个可直接加载的 Pi 扩展，演示三种最常用的扩展点：

| 能力 | API | 代码位置 |
|---|---|---|
| 门禁（拦截危险命令与敏感文件写入） | `pi.on("tool_call", …)` | 文件上半部分 |
| 自定义斜杠命令 `/guard` | `pi.registerCommand` | 中间 |
| 模型可调用工具 `repo_stats` | `defineTool` + `pi.registerTool` | 下半部分 |

## 加载

```bash
# 临时加载
pi --extension ./pre-commit-guard.ts

# 或放进配置目录后 /reload
mkdir -p ~/.pi/agent/extensions
cp pre-commit-guard.ts ~/.pi/agent/extensions/
```

## 验证

```bash
# 1) 类型检查（需要能解析 @earendil-works/pi-* 类型）
tsc -p tsconfig.json

# 2) 交互内
/guard                     # 查看当前规则
让agent执行 git push --force   # 应被拦截
repo_stats                 # 让模型调用工具（或直接说「统计这个仓库」）
```

`node_modules` 只是指向本机 Pi 安装目录的软链，仅用于类型检查，不提交到仓库。需要时自行创建（版本号按实际安装替换）：

```bash
ln -s ~/.pi/agent/install/releases/1.4.0/node_modules node_modules
```

## 设计说明

- **非交互模式默认拒绝**：`ctx.hasUI === false` 时直接 `block`，因为 CI 里没人能点确认。
- **fail closed**：门禁出错时倾向于阻断，而不是放行。
- **`details` 与 `content` 分离**：`content` 给模型，`details` 给渲染层与状态恢复。
- **不拼接 shell 字符串**：所有命令走 `pi.exec(cmd, args[])`，避免注入。

## 扩展的风险

扩展与 Pi 同进程、同权限，能读会话、凭证与文件。**只加载你读过的代码。**
