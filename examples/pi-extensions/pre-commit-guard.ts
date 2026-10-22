/**
 * pre-commit-guard：一个可直接加载的 Pi 扩展
 *
 * 它演示三种最常用的扩展点：
 *   1) tool_call  — 门禁：拦截危险命令与敏感文件写入（返回 { block, reason }）
 *   2) registerCommand — 新增 /guard 斜杠命令
 *   3) registerTool — 新增模型可调用的 repo_stats 工具
 *
 * 加载方式：
 *   pi --extension ./pre-commit-guard.ts
 * 或放进 ~/.pi/agent/extensions/ 或项目 .pi/extensions/ 后 /reload。
 *
 * 注意：扩展运行在 Pi 进程内，拥有与 Pi 相同的操作系统权限。只加载你信任的扩展。
 */

import { readFile } from "node:fs/promises";
import { Type } from "@earendil-works/pi-ai";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** 危险命令：命中即拦截（宁可误杀，也不要 rm -rf 之后才后悔） */
const DANGEROUS_COMMANDS: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /\brm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+)+(\/|~|\$HOME)\b/, why: "递归删除根目录或家目录" },
  { pattern: /\bgit\s+push\s+.*(--force|-f)\b/, why: "强制推送会覆盖远端历史" },
  { pattern: /\bgit\s+reset\s+--hard\b/, why: "硬重置会丢弃未提交改动" },
  { pattern: /\bnpm\s+publish\b/, why: "发布制品需要人工确认" },
  { pattern: /\bsudo\b/, why: "不应由代理提权执行" },
  { pattern: /\bcurl\b[^|]*\|\s*(ba)?sh\b/, why: "把网络内容直接交给 shell" },
];

/** 敏感路径：只读可以，写入一律拦 */
const SENSITIVE_PATHS = [/(^|\/)\.env(\.|$)/, /(^|\/)secrets?\//, /\.pem$/, /(^|\/)id_rsa/, /(^|\/)\.ssh\//];

/** 允许写入的示例项目路径（避免误伤本仓库其它文件，可按需改） */
export default function preCommitGuard(pi: ExtensionAPI) {
  // ---------- 1) 门禁 ----------
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" || event.toolName === "powershell") {
      const command = String((event.input as { command?: string }).command ?? "");
      const hit = DANGEROUS_COMMANDS.find((r) => r.pattern.test(command));
      if (!hit) return undefined;

      // 非交互模式（CI）默认拒绝，因为没人能点确认
      if (!ctx.hasUI) {
        return { block: true, reason: `已拦截：${hit.why}（无 UI 可确认）` };
      }
      const ok = await ctx.ui.confirm(
        "检测到高风险命令",
        `${hit.why}\n\n${command}\n\n仍然执行？`,
      );
      if (!ok) return { block: true, reason: "用户拒绝了该命令" };
      return undefined;
    }

    if (event.toolName === "write" || event.toolName === "edit") {
      const file = String((event.input as { path?: string }).path ?? "");
      if (SENSITIVE_PATHS.some((p) => p.test(file))) {
        ctx.ui.notify(`已拦截写入敏感文件：${file}`, "warning");
        return { block: true, reason: `不允许修改敏感文件 ${file}` };
      }
    }
    return undefined;
  });

  // ---------- 2) 自定义斜杠命令 ----------
  pi.registerCommand("guard", {
    description: "查看当前生效的护栏规则",
    handler: async (_args, ctx) => {
      const lines = [
        "危险命令规则：",
        ...DANGEROUS_COMMANDS.map((r) => `  · ${r.pattern.source}  — ${r.why}`),
        "",
        "敏感文件规则：",
        ...SENSITIVE_PATHS.map((p) => `  · ${p.source}`),
      ];
      ctx.ui.notify(lines.join("\n"), "info");
    },
  });

  // ---------- 3) 自定义工具 ----------
  const repoStats = defineTool({
    name: "repo_stats",
    label: "Repo Stats",
    description:
      "统计当前仓库的文件数与代码行数（跳过 node_modules、.git、dist）。返回按扩展名分组的明细。",
    parameters: Type.Object({
      pattern: Type.Optional(
        Type.String({ description: "git ls-files 的 glob，例如 'src/**/*.ts'；省略则统计全部" }),
      ),
    }),

    async execute(_toolCallId, params) {
      // 用 git 列举文件：自动跳过 .gitignore 覆盖的内容
      const args = params.pattern ? ["ls-files", params.pattern] : ["ls-files"];
      const { stdout, code, stderr } = await pi.exec("git", args, { timeout: 10_000 });
      if (code !== 0) {
        throw new Error(`git ls-files 失败：${stderr || `exit ${code}`}`);
      }

      const files = stdout.trim().split("\n").filter(Boolean);
      const buckets = new Map<string, { files: number; lines: number }>();
      let totalLines = 0;

      for (const file of files.slice(0, 2000)) {
        const ext = file.includes(".") ? file.slice(file.lastIndexOf(".")) : "(none)";
        let lines = 0;
        try {
          const content = await readFile(file, "utf8");
          lines = content.split("\n").length;
        } catch {
          // 二进制或不可读文件按 0 行计
        }
        totalLines += lines;
        const cur = buckets.get(ext) ?? { files: 0, lines: 0 };
        buckets.set(ext, { files: cur.files + 1, lines: cur.lines + lines });
      }

      const sorted = [...buckets.entries()].sort((a, b) => b[1].lines - a[1].lines).slice(0, 8);
      const table = sorted
        .map(([ext, v]) => `${ext.padEnd(10)} ${String(v.files).padStart(5)} 文件 ${String(v.lines).padStart(7)} 行`)
        .join("\n");

      return {
        // content 给模型看
        content: [
          {
            type: "text",
            text: `共 ${files.length} 个文件、${totalLines} 行\n\n${table}`,
          },
        ],
        // details 给渲染层/状态重建用
        details: { files: files.length, lines: totalLines, byExt: Object.fromEntries(buckets) },
      };
    },
  });

  pi.registerTool(repoStats);
}
