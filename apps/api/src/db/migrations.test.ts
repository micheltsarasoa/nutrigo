import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { freshDb } from "../test-db.ts";
import { openDb } from "./client.ts";

const S1_TABLES = [
  "ingredient",
  "recipe",
  "recipe_ingredient",
  "recipe_step",
  "recipe_tool",
  "settings",
];

const tables = (sqlite: ReturnType<typeof freshDb>["$client"]) =>
  sqlite
    .prepare("select name from sqlite_master where type = 'table'")
    .all()
    .map((r) => (r as { name: string }).name);

describe("migrations", () => {
  it("apply to an empty DB and create the S1 tables, without tags", () => {
    const names = tables(freshDb().$client);
    expect(names).toEqual(expect.arrayContaining(["meta", ...S1_TABLES]));
    expect(names).not.toContain("tag");
  });

  it("apply to the v0.1.0 fixture and keep its data", () => {
    const path = join(mkdtempSync(join(tmpdir(), "nutrigo-")), "v0.1.0.db");
    copyFileSync(new URL("./fixtures/v0.1.0.db", import.meta.url), path);
    const { $client: sqlite } = openDb(path);
    expect(tables(sqlite)).toEqual(expect.arrayContaining(S1_TABLES));
    expect(
      sqlite.prepare("select value from meta where key = 'fixture'").get(),
    ).toEqual({ value: "v0.1.0" });
  });
});

describe("settings (SPEC-008 §6)", () => {
  it("has one row with the defaults", () => {
    const { $client: sqlite } = freshDb();
    expect(sqlite.prepare("select * from settings").all()).toEqual([
      {
        id: 1,
        locale: "fr-FR",
        source_ciqual: 1,
        source_off: 1,
        ai_provider: "anthropic",
        ai_model: null,
        ai_monthly_cap_cents: null,
      },
    ]);
  });

  it("refuses a second row", () => {
    const { $client: sqlite } = freshDb();
    expect(() =>
      sqlite.prepare("insert into settings (id) values (2)").run(),
    ).toThrow(/CHECK/);
  });
});

describe("recipe tables (data-model.md)", () => {
  const seed = () => {
    const { $client: sqlite } = freshDb();
    sqlite
      .prepare(
        `insert into ingredient (id, name, category, source, kcal_100g, carbs_100g, protein_100g, fat_100g, default_unit, updated_at)
         values (1, 'Oats', 'grains', 'manual', 389, 66, 17, 7, 'g', '2026-09-25T00:00:00Z')`,
      )
      .run();
    sqlite
      .prepare(
        `insert into recipe (id, name, meal_type, servings, updated_at)
         values (1, 'Porridge', 'breakfast', 2, '2026-09-25T00:00:00Z')`,
      )
      .run();
    sqlite
      .prepare("insert into recipe_ingredient values (1, 1, 80, 'g', 0)")
      .run();
    sqlite
      .prepare(
        "insert into recipe_step (recipe_id, position, title, body) values (1, 0, 'Boil', '')",
      )
      .run();
    sqlite
      .prepare(
        "insert into recipe_tool (recipe_id, position, name) values (1, 0, 'Pot')",
      )
      .run();
    return sqlite;
  };

  it("refuses a duplicate ingredient name", () => {
    const sqlite = seed();
    expect(() =>
      sqlite
        .prepare(
          `insert into ingredient (name, category, source, kcal_100g, carbs_100g, protein_100g, fat_100g, default_unit, updated_at)
           values ('Oats', 'grains', 'manual', 1, 1, 1, 1, 'g', 'x')`,
        )
        .run(),
    ).toThrow(/UNIQUE/);
  });

  it("refuses servings of 0 and a quantity of 0", () => {
    const sqlite = seed();
    expect(() =>
      sqlite.prepare("update recipe set servings = 0").run(),
    ).toThrow(/CHECK/);
    expect(() =>
      sqlite.prepare("update recipe_ingredient set quantity = 0").run(),
    ).toThrow(/CHECK/);
  });

  it("refuses to delete an ingredient a recipe uses (RESTRICT)", () => {
    const sqlite = seed();
    expect(() =>
      sqlite.prepare("delete from ingredient where id = 1").run(),
    ).toThrow(/FOREIGN KEY/);
  });

  it("deletes a recipe's ingredients, steps and tools with it (CASCADE)", () => {
    const sqlite = seed();
    sqlite.prepare("delete from recipe where id = 1").run();
    for (const t of ["recipe_ingredient", "recipe_step", "recipe_tool"])
      expect(sqlite.prepare(`select count(*) as n from ${t}`).get()).toEqual({
        n: 0,
      });
  });
});
