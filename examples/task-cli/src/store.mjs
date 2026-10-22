// IO 层：只负责「读入/写出一份 JSON」，不做业务判断。
import fs from 'node:fs/promises';
import path from 'node:path';

export function storePath() {
  return process.env.TASKS_FILE
    ? path.resolve(process.env.TASKS_FILE)
    : path.resolve(process.cwd(), 'tasks.json');
}

export async function load() {
  const file = storePath();
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.tasks)) throw new Error('格式错误：缺少 tasks 数组');
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') return { version: 1, nextId: 1, tasks: [] };
    if (err instanceof SyntaxError) throw new Error(`${file} 不是合法 JSON`);
    throw err;
  }
}

/** 先写临时文件再 rename，避免进程中断留下半个文件 */
export async function save(db) {
  const file = storePath();
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2) + '\n');
  await fs.rename(tmp, file);
}
