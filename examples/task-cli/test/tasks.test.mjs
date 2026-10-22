import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTask,
  completeTask,
  removeTask,
  selectTasks,
  summarize,
  renderTable,
} from '../src/tasks.mjs';

const NOW = Date.parse('2026-01-01T00:00:00Z');

test('createTask 规范化输入', () => {
  const t = createTask({ id: 1, title: '  写测试  ', now: NOW });
  assert.equal(t.title, '写测试');
  assert.equal(t.priority, 'normal');
  assert.equal(t.done, false);
  assert.equal(t.createdAt, '2026-01-01T00:00:00.000Z');
});

test('createTask 拒绝空标题与非法优先级', () => {
  assert.throws(() => createTask({ id: 1, title: '   ' }), /title/);
  assert.throws(() => createTask({ id: 1, title: 'x', priority: 'urgent' }), /priority/);
});

test('completeTask 幂等', () => {
  const tasks = [createTask({ id: 1, title: 'a', now: NOW })];
  const first = completeTask(tasks, 1, NOW);
  assert.equal(first.changed, true);
  assert.equal(first.tasks[0].done, true);
  const second = completeTask(first.tasks, 1, NOW);
  assert.equal(second.changed, false);
});

test('completeTask 对不存在的 id 报错', () => {
  assert.throws(() => completeTask([], 9), /找不到任务/);
});

test('removeTask 删除并返回新数组', () => {
  const tasks = [createTask({ id: 1, title: 'a' }), createTask({ id: 2, title: 'b' })];
  const next = removeTask(tasks, 1);
  assert.equal(next.length, 1);
  assert.equal(tasks.length, 2, '原数组不应被修改');
  assert.throws(() => removeTask(tasks, 99), /找不到任务/);
});

test('selectTasks 排序：未完成 > 优先级 > 创建时间', () => {
  const tasks = [
    { ...createTask({ id: 1, title: 'low', priority: 'low', now: NOW }), done: true },
    createTask({ id: 2, title: 'normal', priority: 'normal', now: NOW + 1000 }),
    createTask({ id: 3, title: 'high', priority: 'high', now: NOW + 2000 }),
  ];
  assert.deepEqual(selectTasks(tasks).map((t) => t.id), [3, 2]);
  assert.deepEqual(selectTasks(tasks, { filter: 'all' }).map((t) => t.id), [3, 2, 1]);
  assert.deepEqual(selectTasks(tasks, { filter: 'done' }).map((t) => t.id), [1]);
  assert.equal(selectTasks(tasks, { filter: 'all' }).length, 3);
  assert.throws(() => selectTasks(tasks, { filter: 'wat' }), /未知过滤条件/);
});

test('summarize 统计口径', () => {
  const tasks = [
    createTask({ id: 1, title: 'a', priority: 'high' }),
    { ...createTask({ id: 2, title: 'b', priority: 'high' }), done: true },
    createTask({ id: 3, title: 'c', priority: 'low' }),
  ];
  assert.deepEqual(summarize(tasks), { total: 3, done: 1, open: 2, highOpen: 1 });
});

test('renderTable 空列表与普通列表', () => {
  assert.match(renderTable([]), /没有任务/);
  const out = renderTable([createTask({ id: 7, title: '部署', priority: 'high' })]);
  assert.match(out, /#7/);
  assert.match(out, /部署/);
  assert.equal(out.split('\n').length, 3);
});
