// 纯函数层：不碰文件系统，方便单测，也方便代理理解边界。
// 这是本书刻意示范的结构：纯逻辑 / IO / 入口 三层分离。

export const PRIORITIES = ['low', 'normal', 'high'];

/** 新建任务；id 由调用方传入以保持可测试 */
export function createTask({ id, title, priority = 'normal', now = Date.now() }) {
  if (!title || !title.trim()) throw new Error('title 不能为空');
  if (!PRIORITIES.includes(priority)) throw new Error(`priority 必须是 ${PRIORITIES.join('/')}`);
  return {
    id,
    title: title.trim(),
    priority,
    done: false,
    createdAt: new Date(now).toISOString(),
    completedAt: null,
  };
}

export function completeTask(tasks, id, now = Date.now()) {
  const t = tasks.find((x) => x.id === id);
  if (!t) throw new Error(`找不到任务 #${id}`);
  if (t.done) return { tasks, changed: false };
  const next = tasks.map((x) =>
    x.id === id ? { ...x, done: true, completedAt: new Date(now).toISOString() } : x,
  );
  return { tasks: next, changed: true };
}

export function removeTask(tasks, id) {
  const next = tasks.filter((x) => x.id !== id);
  if (next.length === tasks.length) throw new Error(`找不到任务 #${id}`);
  return next;
}

const rank = { high: 0, normal: 1, low: 2 };

/** 过滤 + 排序：未完成在前，再按优先级，再按创建时间 */
export function selectTasks(tasks, { filter = 'open' } = {}) {
  const byFilter = {
    all: tasks,
    open: tasks.filter((t) => !t.done),
    done: tasks.filter((t) => t.done),
  }[filter];
  if (!byFilter) throw new Error(`未知过滤条件 ${filter}`);
  return [...byFilter].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      rank[a.priority] - rank[b.priority] ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

export function summarize(tasks) {
  const done = tasks.filter((t) => t.done).length;
  const high = tasks.filter((t) => !t.done && t.priority === 'high').length;
  return { total: tasks.length, done, open: tasks.length - done, highOpen: high };
}

/** 固定宽度的纯文本表格，避免引入依赖 */
export function renderTable(tasks) {
  if (!tasks.length) return '（没有任务）';
  const rows = tasks.map((t) => [
    `#${t.id}`,
    t.done ? '✔' : '·',
    t.priority,
    t.title,
  ]);
  const header = ['ID', 'S', 'PRIORITY', 'TITLE'];
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (cells) => cells.map((c, i) => String(c).padEnd(widths[i])).join('  ');
  return [line(header), widths.map((w) => '─'.repeat(w)).join('  '), ...rows.map(line)].join('\n');
}
