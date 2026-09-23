import { describe, expect, it } from "vitest";
import { freshDb } from "../test-db.ts";

describe("openDb", () => {
  it("sets the pragmas from data-model.md: WAL, foreign keys on, 5 s busy timeout", () => {
    const { $client: sqlite } = freshDb();
    expect(sqlite.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(sqlite.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(sqlite.pragma("busy_timeout", { simple: true })).toBe(5000);
  });

  it("applies the migrations, so the meta table exists", () => {
    const { $client: sqlite } = freshDb();
    expect(
      sqlite
        .prepare(
          "select name from sqlite_master where type = 'table' and name = 'meta'",
        )
        .get(),
    ).toEqual({ name: "meta" });
  });
});
