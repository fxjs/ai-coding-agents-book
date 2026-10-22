#!/usr/bin/env node
// 入口层：解析参数、调用业务、打印结果。保持薄。
import { load, save, storePath } from './store.mjs';
import { createTask, completeTask, removeTask, selectTasks, summarize, renderTable } from './tasks.mjs';

const HELP = `task — 零依赖待办 CLI

用法:
  task add <标题> [--priority low|normal|high]
  task list [--all | --done | --open]
  task done <id>
  task rm <id>
  task stats
  task path

环境变量:
  TASKS_FILE  指定数据文件（默认 ./tasks.json）
`;

function parseArgs(argv) {
  const args = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--priority') flags.priority = argv[++i];
    else if (a === '--all') flags.filter = 'all';
    else if (a === '--done') flags.filter = 'done';
    else if (a === '--open') flags.filter = 'open';
    else if (a === '-h' || a === '--help') flags.help = true;
    else if (a.startsWith('-')) throw new Error(`未知参数 ${a}`);
    else args.push(a);
  }
  return { args, flags };
}

async function main() {
  const { args, flags } = parseArgs(process.argv.slice(2));
  const [cmd, ...rest] = args;

  if (!cmd || flags.help || cmd === 'help') {
    console.log(HELP);
    return;
  }

  const db = await load();

  if (cmd === 'add') {
    const task = createTask({ id: db.nextId, title: rest.join(' '), priority: flags.priority });
    db.tasks.push(task);
    db.nextId += 1;
    await save(db);
    console.log(`已添加 #${task.id} ${task.title}`);
    return;
  }

  if (cmd === 'list') {
    console.log(renderTable(selectTasks(db.tasks, { filter: flags.filter ?? 'open' })));
    return;
  }

  if (cmd === 'done') {
    const id = Number(rest[0]);
    if (!Number.isInteger(id)) throw new Error('用法: task done <id>');
    const { tasks, changed } = completeTask(db.tasks, id);
    if (changed) await save({ ...db, tasks });
    console.log(changed ? `已完成 #${id}` : `#${id} 本来就是完成状态`);
    return;
  }

  if (cmd === 'rm') {
    const id = Number(rest[0]);
    if (!Number.isInteger(id)) throw new Error('用法: task rm <id>');
    await save({ ...db, tasks: removeTask(db.tasks, id) });
    console.log(`已删除 #${id}`);
    return;
  }

  if (cmd === 'stats') {
    const s = summarize(db.tasks);
    console.log(`总计 ${s.total}  未完成 ${s.open}  已完成 ${s.done}  高优待办 ${s.highOpen}`);
    return;
  }

  if (cmd === 'path') {
    console.log(storePath());
    return;
  }

  throw new Error(`未知命令 ${cmd}，试试 task --help`);
}

main().catch((err) => {
  console.error(`task: ${err.message}`);
  process.exitCode = 1;
});
