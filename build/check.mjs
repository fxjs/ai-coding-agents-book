#!/usr/bin/env node
/**
 * 书稿静态检查：编号、表格、代码围栏、锚点、常见笔误。
 * 用法：node build/check.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOOK = path.join(ROOT, 'book');
const APPENDIX = path.join(ROOT, 'appendix');

const files = [
  'README.md',
  ...fs.readdirSync(BOOK).filter((f) => f.endsWith('.md')).sort().map((f) => `book/${f}`),
  ...fs.readdirSync(APPENDIX).filter((f) => f.endsWith('.md')).sort().map((f) => `appendix/${f}`),
];

const problems = [];
const anchors = new Map(); // anchor -> file

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function splitRow(line) {
  let inner = line.trim();
  if (inner.startsWith('|')) inner = inner.slice(1);
  if (inner.endsWith('|') && !inner.endsWith('\\|')) inner = inner.slice(0, -1);
  const cells = [];
  let cur = '';
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '\\' && inner[i + 1] === '|') { cur += '|'; i++; continue; }
    if (inner[i] === '|') { cells.push(cur.trim()); cur = ''; continue; }
    cur += inner[i];
  }
  cells.push(cur.trim());
  return cells;
}

// 常见笔误（命中即报，人工判断）
const TYPOS = ['享试', '测式', '以经', '因该', '需须', '即然', '按装', '在在', '的的', '了了'];

for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const text = fs.readFileSync(abs, 'utf8');
  const lines = text.split('\n');

  // 代码围栏配对
  const fences = lines.filter((l) => l.startsWith('```')).length;
  if (fences % 2 !== 0) problems.push(`${rel}: 代码围栏未闭合`);

  // 章节编号
  const base = path.basename(rel, '.md');
  const numMatch = base.match(/^(\d+)-/);
  const h1 = text.match(/^# 第 (\d+) 章/m);
  if (numMatch && h1 && Number(numMatch[1]) !== Number(h1[1])) {
    problems.push(`${rel}: 标题章号 ${h1[1]} 与文件名 ${numMatch[1]} 不一致`);
  }
  if (numMatch && Number(numMatch[1]) > 0 && !h1) {
    problems.push(`${rel}: 缺少「# 第 N 章 …」标题`);
  }

  let inCode = false;
  let table = [];
  const flushTable = () => {
    if (table.length > 1) {
      const counts = new Set(table.map(([, row]) => splitRow(row).length));
      if (counts.size > 1) {
        problems.push(`${rel}:${table[0][0]} 表格列数不一致 ${[...counts].sort().join('/')}`);
      }
    }
    table = [];
  };

  lines.forEach((line, idx) => {
    const no = idx + 1;
    if (line.startsWith('```')) { inCode = !inCode; flushTable(); return; }
    if (inCode) return;

    // 标题锚点
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const slug = slugify(h[2].trim());
      if (anchors.has(slug) && anchors.get(slug) !== rel) {
        problems.push(`${rel}:${no} 锚点重复 "${slug}"（另见 ${anchors.get(slug)}）`);
      } else {
        anchors.set(slug, rel);
      }
      flushTable();
      // 小节编号与章号一致性
      const sec = h[2].match(/^(\d+)\.(\d+)/);
      if (sec && h1 && sec[1] !== h1[1]) {
        problems.push(`${rel}:${no} 小节编号 ${sec[1]}.${sec[2]} 与章号 ${h1[1]} 不符`);
      }
      return;
    }

    // 代码围栏行内的行内代码
    const fenceCount = (line.match(/`/g) ?? []).length;
    if (fenceCount % 2 !== 0) problems.push(`${rel}:${no} 反引号不成对`);

    // 表格
    if (line.trim().startsWith('|')) table.push([no, line]);
    else flushTable();

    // 笔误
    for (const t of TYPOS) {
      if (line.includes(t)) problems.push(`${rel}:${no} 疑似笔误「${t}」`);
    }
  });
  flushTable();

  // 相对链接
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^(https?:|mailto:)/.test(href)) continue;
    if (href.startsWith('#')) continue;
    const [p] = href.split('#');
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), p));
    if (!fs.existsSync(path.join(ROOT, target))) {
      problems.push(`${rel}: 链接目标不存在 ${href}`);
    }
  }
}

// 阅读顺序连续性
const chapterNums = files
  .filter((f) => f.startsWith('book/'))
  .map((f) => Number(path.basename(f).match(/^(\d+)-/)?.[1]))
  .filter((n) => !Number.isNaN(n) && n > 0);
for (let i = 1; i < chapterNums.length; i++) {
  if (chapterNums[i] !== chapterNums[i - 1] + 1) {
    problems.push(`章节序号不连续：${chapterNums[i - 1]} → ${chapterNums[i]}`);
  }
}

if (problems.length) {
  console.error(`发现 ${problems.length} 个问题：`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`检查通过：${files.length} 个文件，${anchors.size} 个锚点`);
