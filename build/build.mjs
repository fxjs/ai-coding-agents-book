#!/usr/bin/env node
/**
 * 书籍构建脚本：Markdown -> 单文件 HTML + 合并 Markdown
 *
 * 用法：
 *   node build/build.mjs            # 构建
 *   node build/build.mjs --check    # 只做链接/标题校验，不写文件
 *
 * 无第三方依赖：自带一个够用的 GFM 子集解析器（标题、段落、列表、
 * 任务列表、表格、引用、代码块、Mermaid、行内样式），因此离线也能构建。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'dist');

/** 书籍结构与顺序：新增章节只需在这里登记 */
const SOURCES = [
  'README.md',
  'book/00-preface.md',
  'book/01-landscape.md',
  'book/02-install.md',
  'book/03-first-task.md',
  'book/04-interactive.md',
  'book/05-headless.md',
  'book/06-context.md',
  'book/07-tools-security.md',
  'book/08-skills.md',
  'book/09-mcp-hooks-plugins.md',
  'book/10-models-cost.md',
  'book/11-workflows.md',
  'book/12-multi-agent.md',
  'book/13-pi.md',
  'book/14-claude-code.md',
  'book/15-codex.md',
  'book/16-internals.md',
  'book/17-migration.md',
  'appendix/a-commands.md',
  'appendix/b-keybindings.md',
  'appendix/c-configs.md',
  'appendix/d-faq.md',
];

const CHECK_ONLY = process.argv.includes('--check');

/** 每个源文件对应的章节锚点（h1 用文件名 slug） */
const FILE_ANCHOR = new Map(
  SOURCES.map((f) => [f, slugify(path.basename(f, '.md'))]),
);

/** 解析相对链接时所在的源文件；由 parseMarkdown 设置 */
let currentFile = '';

// ---------------------------------------------------------------- 工具函数

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function inline(text) {
  const codeSpans = [];
  let out = text.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(`<code>${esc(code)}</code>`);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });

  out = esc(out)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
      (_, alt, src, title) =>
        `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
      (_, label, href, title) => {
        const resolved = resolveHref(href);
        const external = /^https?:/.test(resolved);
        const attrs = external ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${resolved}"${title ? ` title="${title}"` : ''}${attrs}>${label}</a>`;
      })
    /** 支持 **粗**、*斜*、~~删~~ */
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => codeSpans[Number(i)]);
}

/** 引用块内部：支持列表与多行段落 */
function renderQuoteBody(lines) {
  const out = [];
  let buf = [];
  let list = null;
  const flushPara = () => {
    if (buf.length) {
      out.push(`<p>${inline(buf.join(' '))}</p>`);
      buf = [];
    }
  };
  const closeList = () => {
    if (list) {
      out.push(`</${list.ordered ? 'ol' : 'ul'}>`);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const m = line.match(/^\s*([-*+]|\d+\.)\s+(.*)$/);
    if (m) {
      flushPara();
      const ordered = /\d+\./.test(m[1]);
      if (!list || list.ordered !== ordered) {
        closeList();
        out.push(ordered ? '<ol>' : '<ul>');
        list = { ordered };
      }
      out.push(`<li>${inline(m[2])}</li>`);
      continue;
    }
    if (!line.trim()) {
      flushPara();
      continue;
    }
    closeList();
    buf.push(line.trim());
  }
  flushPara();
  closeList();
  return out.join('');
}

/**
 * 把指向 .md 源文件的相对链接改写成页内锚点。
 * 这样 dist/ 作为静态站点单独部署时，README 的章节目录与交叉引用不会 404。
 */
function resolveHref(href) {
  if (/^(https?:|mailto:|#|\/)/.test(href)) return href;
  const [p, anchor] = href.split('#');
  if (!p) return href;

  const target = path.posix.normalize(path.posix.join(path.posix.dirname(currentFile), p));
  if (p.endsWith('.md') && FILE_ANCHOR.has(target)) {
    return `#${anchor || FILE_ANCHOR.get(target)}`;
  }
  return href;
}

function splitRow(line) {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cur = '';
  for (let k = 0; k < inner.length; k++) {
    const ch = inner[k];
    if (ch === '\\' && inner[k + 1] === '|') { cur += '|'; k++; continue; }
    if (ch === '|') { cells.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

// ---------------------------------------------------------------- 块级解析

function parseMarkdown(md, sourceFile) {
  currentFile = sourceFile;
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  const headings = [];
  let i = 0;
  let h1Done = false;

  const flushParagraph = (buf) => {
    if (!buf.length) return;
    html.push(`<p>${inline(buf.join(' '))}</p>`);
    buf.length = 0;
  };

  const para = [];

  while (i < lines.length) {
    const line = lines[i];

    // 代码块
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      flushParagraph(para);
      const lang = fence[1] || '';
      const body = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      i++;
      const raw = body.join('\n');
      if (lang === 'mermaid') {
        html.push(`<div class="mermaid">${esc(raw)}</div>`);
      } else if (lang === 'ascii' || lang === 'text' && /^[┌└├│─]/.test(raw.trim())) {
        html.push(`<pre class="ascii"><code>${esc(raw)}</code></pre>`);
      } else {
        html.push(
          `<pre data-lang="${lang}"><code class="language-${lang || 'text'}">${esc(raw)}</code></pre>`,
        );
      }
      continue;
    }

    // 标题
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushParagraph(para);
      const level = h[1].length;
      const text = h[2].trim();
      const id = level === 1 && !h1Done ? slugify(path.basename(sourceFile, '.md')) : slugify(text);
      if (level === 1) h1Done = true;
      headings.push({ level, text: text.replace(/[*`]/g, ''), id, file: sourceFile });
      html.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    // 分隔线
    if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) {
      flushParagraph(para);
      html.push('<hr>');
      i++;
      continue;
    }

    // 表格
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      flushParagraph(para);
      const head = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map((c) => {
        if (/^:-+:$/.test(c)) return 'center';
        if (/^:-+$/.test(c)) return 'left';
        if (/^-+:$/.test(c)) return 'right';
        return '';
      });
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(splitRow(lines[i++]));
      const th = head
        .map((c, k) => `<th${aligns[k] ? ` style="text-align:${aligns[k]}"` : ''}>${inline(c)}</th>`)
        .join('');
      const tb = rows
        .map(
          (r) =>
            `<tr>${r
              .map((c, k) => {
                // 支持单元格里的 <br>
                const cell = c.replace(/<br\s*\/?>/gi, '\u0001');
                return `<td${aligns[k] ? ` style="text-align:${aligns[k]}"` : ''}>${inline(cell).replace(/\u0001/g, '<br>')}</td>`;
              })
              .join('')}</tr>`,
        )
        .join('');
      html.push(`<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`);
      continue;
    }

    // 引用（含 GitHub 风格的 > [!NOTE]）
    if (/^>\s?/.test(line)) {
      flushParagraph(para);
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      let cls = 'quote';
      const callout = buf[0] && buf[0].match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
      let body = buf;
      if (callout) {
        cls = `callout callout-${callout[1].toLowerCase()}`;
        body = [callout[2], ...buf.slice(1)];
      }
      html.push(`<div class="${cls}">${renderQuoteBody(body)}</div>`);
      continue;
    }

    // 列表（支持嵌套与任务列表）
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      flushParagraph(para);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
        if (!m) {
          if (lines[i].trim() === '') {
            // 空行后若仍是列表则继续，否则结束
            if (/^\s*([-*+]|\d+\.)\s+/.test(lines[i + 1] || '')) { i++; continue; }
          }
          break;
        }
        const indent = Math.floor(m[1].replace(/\t/g, '  ').length / 2);
        let textSeg = m[3];
        let checkbox = '';
        const cm = textSeg.match(/^\[( |x|X)\]\s+(.*)$/);
        if (cm) {
          checkbox = `<input type="checkbox" disabled${cm[1].toLowerCase() === 'x' ? ' checked' : ''}> `;
          textSeg = cm[2];
        }
        items.push({ indent, ordered: /\d+\./.test(m[2]), text: `${checkbox}${inline(textSeg)}` });
        i++;
      }
      // 用栈还原层级
      let out = '';
      const stack = [];
      for (const it of items) {
        while (stack.length && it.indent < stack[stack.length - 1].indent) {
          out += `</li></${stack.pop().ordered ? 'ol' : 'ul'}>`;
        }
        if (!stack.length || it.indent > stack[stack.length - 1].indent) {
          out += it.ordered ? '<ol>' : '<ul>';
          stack.push({ indent: it.indent, ordered: it.ordered });
        } else {
          out += '</li>';
        }
        out += `<li>${it.text}`;
      }
      while (stack.length) out += `</li></${stack.pop().ordered ? 'ol' : 'ul'}>`;
      html.push(out);
      continue;
    }

    // 空行
    if (!line.trim()) {
      flushParagraph(para);
      i++;
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushParagraph(para);
  return { html: html.join('\n'), headings };
}

// ---------------------------------------------------------------- 校验

function checkLinks(all, headings) {
  const problems = [];
  const ids = new Set(headings.map((h) => h.id));
  const files = new Set(SOURCES.map((s) => s));

  for (const { file, md } of all) {
    const re = /\[[^\]]*\]\(([^)\s]+)\)/g;
    let m;
    while ((m = re.exec(md))) {
      const href = m[1];
      if (/^(https?:|mailto:|#)/.test(href)) {
        if (href.startsWith('#') && !ids.has(href.slice(1))) {
          problems.push(`${file}: 锚点不存在 ${href}`);
        }
        continue;
      }
      const [p, anchor] = href.split('#');
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), p));
      if (!fs.existsSync(path.join(ROOT, target))) {
        problems.push(`${file}: 链接文件不存在 ${href}`);
      } else if (anchor && !ids.has(anchor)) {
        problems.push(`${file}: 链接锚点不存在 ${href}`);
      }
    }
  }
  return problems;
}

// ---------------------------------------------------------------- 主流程

function main() {
  const all = [];
  const headings = [];
  const sections = [];

  for (const rel of SOURCES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.warn(`[skip] 缺少 ${rel}`);
      continue;
    }
    const md = fs.readFileSync(abs, 'utf8');
    all.push({ file: rel, md });
    const parsed = parseMarkdown(md, rel);
    headings.push(...parsed.headings);
    sections.push({ file: rel, html: parsed.html, headings: parsed.headings });
  }

  const problems = checkLinks(all, headings);
  // 页内锚点校验：改写后的 href="#..." 必须存在对应 id
  const idSet = new Set(headings.map((h) => h.id));
  for (const sec of sections) {
    for (const m of sec.html.matchAll(/href="#([^"]+)"/g)) {
      const id = decodeURIComponent(m[1]);
      if (!idSet.has(id)) problems.push(`${sec.file}: 页内锚点不存在 #${id}`);
    }
  }
  if (problems.length) {
    console.error('链接校验失败：');
    for (const p of problems) console.error('  - ' + p);
  } else {
    console.log(`链接校验通过（${all.length} 个文件）`);
  }
  if (CHECK_ONLY) process.exit(problems.length ? 1 : 0);

  // 侧栏目录：h1 作为章节，h2 作为小节
  const toc = [];
  for (const sec of sections) {
    const h1 = sec.headings.find((h) => h.level === 1);
    if (!h1) continue;
    toc.push({
      title: h1.text,
      id: h1.id,
      file: sec.file,
      children: sec.headings.filter((h) => h.level === 2).map((h) => ({ title: h.text, id: h.id })),
    });
  }

  const tocHtml = toc
    .map(
      (c) => `<li class="toc-chapter" data-search="${esc(c.title.toLowerCase())}">
  <a href="#${c.id}">${esc(c.title)}</a>
  <ul>${c.children
    .map((s) => `<li data-search="${esc(s.title.toLowerCase())}"><a href="#${s.id}">${esc(s.title)}</a></li>`)
    .join('')}</ul>
</li>`,
    )
    .join('\n');

  const body = sections.map((s) => `<section data-file="${s.file}">\n${s.html}\n</section>`).join('\n');

  const template = fs.readFileSync(path.join(ROOT, 'build', 'template.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'build', 'style.css'), 'utf8');
  const words = all.reduce((n, f) => n + (f.md.match(/[\u4e00-\u9fff]|[a-zA-Z]+/g) || []).length, 0);

  const html = template
    .replace('{{CSS}}', css)
    .replace('{{TOC}}', tocHtml)
    .replace('{{CONTENT}}', body)
    .replace('{{WORDS}}', String(words))
    .replace('{{CHAPTERS}}', String(toc.length))
    .replace('{{DATE}}', new Date().toISOString().slice(0, 10));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
  fs.writeFileSync(
    path.join(OUT_DIR, 'book.md'),
    all.map((f) => f.md).join('\n\n---\n\n'),
  );

  // 静态资源（图片等）随 HTML 一起复制，保证 dist 可独立部署
  const assets = path.join(ROOT, 'assets');
  if (fs.existsSync(assets)) {
    fs.cpSync(assets, path.join(OUT_DIR, 'assets'), { recursive: true });
  }

  console.log(`构建完成：dist/index.html（${toc.length} 章，约 ${words} 词/字）`);
  console.log('合并版：dist/book.md');
}

main();
