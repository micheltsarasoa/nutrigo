import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

const KEEP = 30;

// Copies the DB to backups/YYYY-MM-DD.db next to it (data-model.md §4), keeps the latest 30.
export async function backupDb(dbPath: string, now = new Date()) {
  const dir = join(dirname(dbPath), "backups");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${now.toISOString().slice(0, 10)}.db`);
  const sqlite = new Database(dbPath, { fileMustExist: true });
  try {
    await sqlite.backup(file);
  } finally {
    sqlite.close();
  }
  // Dated names sort chronologically; anything else in the folder is left alone.
  readdirSync(dir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.db$/.test(name))
    .sort()
    .slice(0, -KEEP)
    .forEach((name) => rmSync(join(dir, name)));
  return file;
}
