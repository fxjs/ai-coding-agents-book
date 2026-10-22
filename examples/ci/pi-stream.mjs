#!/usr/bin/env node
/**
 * pi-stream.mjs — 在 CI/脚本里安全地消费 Pi 的 JSON 事件流
 *
 * 用法：
 *   node pi-stream.mjs "检查 src 的错误处理" > answer.txt
 *   git diff | node pi-stream.mjs "审查这个 diff"
 *
 * 设计要点：
 *  - stdout 只输出最终回答（给下游程序用），进度写 stderr
 *  - 只按 LF 切分记录（JSON 字符串里可能有 U+2028/U+2029）
 *  - 等 agent_settled 而不是 agent_end（后者之后可能还有重试/压缩）
 */

import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const prompt = args.join(' ') || '总结当前目录的内容';
const stdinIsPipe = !process.stdin.isTTY;

const child = spawn(
  'pi',
  ['--mode', 'json', '--no-session', '--', prompt],
  { stdio: ['pipe', 'pipe', 'inherit'] },
);

// 如果上游有管道（git diff | ...），把内容作为额外的第一条用户消息
if (stdinIsPipe) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => (input += c));
  process.stdin.on('end', () => {
    if (input.trim()) {
      child.stdin.write(JSON.stringify({ id: 'stdin', type: 'prompt', message: input }) + '\n');
    }
  });
}

let buf = '';
let last = '';
let turns = 0;
let toolCalls = 0;
let settled = false;

child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  buf += chunk;
  const lines = buf.split('\n');
  buf = lines.pop() ?? '';
  for (const line of lines) {
    if (!line.trim()) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      console.error(`[warn] 无法解析的记录: ${line.slice(0, 120)}`);
      continue;
    }
    switch (ev.type) {
      case 'message_end':
        if (ev.message?.role === 'assistant') {
          last = (ev.message.content ?? [])
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('');
        }
        break;
      case 'turn_start':
        turns += 1;
        break;
      case 'tool_execution_start':
        toolCalls += 1;
        console.error(`[tool ${toolCalls}] ${ev.toolName}`);
        break;
      case 'agent_settled':
        settled = true;
        break;
      default:
        break;
    }
  }
});

child.on('close', (code) => {
  console.error(`[stats] turns=${turns} tools=${toolCalls} settled=${settled}`);
  if (last) process.stdout.write(last.endsWith('\n') ? last : last + '\n');
  process.exit(code === 0 && settled ? 0 : 1);
});
