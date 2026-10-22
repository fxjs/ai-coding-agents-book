# 参与编写

## 结构

```
book/       正文章节（00 前言 + 01–17 章）
appendix/   A 命令 / B 键位 / C 配置 / D FAQ
examples/   配套代码（task-cli、Pi 扩展、技能、模板、MCP、CI）
build/      构建与检查脚本（零依赖）
assets/     截图等静态资源
```

## 写作流程

1. 新增章节：在 `book/` 下按 `NN-slug.md` 命名，H1 写「# 第 N 章 标题」。
2. 在 `build/build.mjs` 的 `SOURCES` 中登记顺序。
3. 在 `README.md` 的目录表里加一行。
4. 运行 `npm run verify`，必须通过。
5. 命令必须实测或来自官方文档；无法实测的标注「示例输出」或「⚠️ 版本敏感」。

## 章节模板

```markdown
# 第 N 章 标题

> 本章你将学会：
> - 三条，动词开头

## N.1 问题
## N.2 概念（至少一张 Mermaid 或一个表格）
## N.3 动手
## N.4 代码实践（引用 examples/ 里的真实文件）
## N.5 三工具对照
## N.6 技巧与坑
## N.7 练习
```

## 校验清单

- `npm run check`：章节编号、小节编号、表格列数、锚点唯一、链接存在、常见笔误。
- `npm run build`：HTML 与合并 Markdown。
- `npm run pdf`：需要本机 Chrome/Chromium。
- `npm run test:examples`：示例项目测试必须全绿。
