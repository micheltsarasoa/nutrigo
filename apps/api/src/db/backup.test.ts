import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { expect, test } from "vitest";
import { backupDb } from "./backup.ts";

const makeDb = () => {
  const path = join(mkdtempSync(join(tmpdir(), "nutrigo-")), "nutrigo.db");
  const sqlite = new Database(path);
  sqlite.exec("create table t (x); insert into t values ('kept')");
  sqlite.close();
  return path;
};

test("writes a restorable YYYY-MM-DD.db next to the DB", async () => {
  const db = makeDb();
  const file = await backupDb(db, new Date("2026-09-29T10:00:00Z"));

  expect(file).toBe(join(db, "..", "backups", "2026-09-29.db"));
  const copy = new Database(file, { readonly: true });
  expect(copy.prepare("select x from t").get()).toEqual({ x: "kept" });
  copy.close();
});

test("runs twice on the same day without failing and keeps one file", async () => {
  const db = makeDb();
  const now = new Date("2026-09-29T10:00:00Z");
  await backupDb(db, now);
  await backupDb(db, now);

  expect(readdirSync(join(db, "..", "backups"))).toEqual(["2026-09-29.db"]);
});

test("keeps the latest 30 backups and leaves other files alone", async () => {
  const db = makeDb();
  const dir = join(db, "..", "backups");
  await backupDb(db, new Date("2026-01-01T00:00:00Z"));
  for (let day = 2; day <= 31; day++) {
    writeFileSync(join(dir, `2026-01-${String(day).padStart(2, "0")}.db`), "");
  }
  writeFileSync(join(dir, "notes.txt"), "");

  await backupDb(db, new Date("2026-02-01T00:00:00Z"));

  const files = readdirSync(dir);
  expect(files.filter((f) => f.endsWith(".db"))).toHaveLength(30);
  expect(files).not.toContain("2026-01-01.db");
  expect(files).not.toContain("2026-01-02.db");
  expect(files).toContain("2026-01-03.db");
  expect(files).toContain("2026-02-01.db");
  expect(files).toContain("notes.txt");
});
