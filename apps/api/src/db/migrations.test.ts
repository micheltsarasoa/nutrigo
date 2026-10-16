import {
  copyFileSync,
  cpSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
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
const S2_TABLES = ["plan_week", "meal_entry"];

const tables = (sqlite: ReturnType<typeof freshDb>["$client"]) =>
  sqlite
    .prepare("select name from sqlite_master where type = 'table'")
    .all()
    .map((r) => (r as { name: string }).name);

describe("migrations", () => {
  it("apply to an empty DB and create the S1 tables, without tags", () => {
    const names = tables(freshDb().$client);
    expect(names).toEqual(
      expect.arrayContaining(["meta", ...S1_TABLES, ...S2_TABLES]),
    );
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

describe("meal plan tables (SPEC-003 §6)", () => {
  const setup = () => {
    const { $client: sqlite } = freshDb();
    sqlite.exec(`insert into recipe (id, name, meal_type, servings, updated_at)
      values (1, 'Bowl', 'lunch', 2, 'x');
      insert into plan_week (iso_week) values ('2026-W40');`);
    return sqlite;
  };
  const entry = (
    sqlite: ReturnType<typeof setup>,
    slot: string,
    servings = 1,
  ) =>
    sqlite
      .prepare(
        `insert into meal_entry (iso_week, date, slot, recipe_id, servings, position)
         values ('2026-W40', '2026-09-30', ?, 1, ?, 0)`,
      )
      .run(slot, servings);

  it("rejects a recipe that does not exist, a bad slot and servings <= 0", () => {
    const sqlite = setup();
    expect(() => entry(sqlite, "lunch")).not.toThrow();
    expect(() => entry(sqlite, "brunch")).toThrow();
    expect(() => entry(sqlite, "lunch", 0)).toThrow();
    expect(() =>
      sqlite.exec(`insert into meal_entry (iso_week, date, slot, recipe_id, servings, position)
        values ('2026-W40', '2026-09-30', 'lunch', 99, 1, 0)`),
    ).toThrow();
  });

  it("restricts deleting a planned recipe (AC-12)", () => {
    const sqlite = setup();
    entry(sqlite, "lunch");
    expect(() => sqlite.exec("delete from recipe where id = 1")).toThrow(
      /FOREIGN KEY/,
    );
  });
});

describe("eaten columns (SPEC-004 §6)", () => {
  it("are NULL on entries that existed before the migration", () => {
    const dir = mkdtempSync(join(tmpdir(), "nutrigo-"));
    // The migrations up to 0002 only, as an older install would have them.
    const old = join(dir, "old");
    cpSync(new URL("./migrations", import.meta.url), old, { recursive: true });
    const journal = join(old, "meta/_journal.json");
    const j = JSON.parse(readFileSync(journal, "utf8"));
    j.entries = j.entries.slice(0, 3);
    writeFileSync(journal, JSON.stringify(j));
    const path = join(dir, "old.db");
    const sqlite = new Database(path);
    migrate(drizzle(sqlite), { migrationsFolder: old });
    sqlite.exec(`insert into recipe (id, name, meal_type, servings, updated_at) values (1, 'R', 'lunch', 1, 'x');
      insert into plan_week (iso_week) values ('2026-W40');
      insert into meal_entry (id, iso_week, date, slot, recipe_id, servings, position) values (1, '2026-W40', '2026-09-30', 'lunch', 1, 2, 0)`);
    sqlite.close();
    expect(
      openDb(path)
        .$client.prepare("select eaten_servings, eaten_at from meal_entry")
        .all(),
    ).toEqual([{ eaten_servings: null, eaten_at: null }]);
  });
});

describe("shopping list (SPEC-005 §6)", () => {
  const seed = () => {
    const { $client: db } = freshDb();
    db.prepare("insert into plan_week (iso_week) values ('2026-W40')").run();
    db.prepare(
      "insert into shopping_list (iso_week, generated_at) values ('2026-W40', '2026-10-01T10:00:00Z')",
    ).run();
    return db;
  };
  const addItem = (db: ReturnType<typeof seed>, extra = "") =>
    db
      .prepare(
        `insert into shopping_item (list_id, label, category, updated_at${extra ? ", " + extra.split("=")[0] : ""}) values (1, 'Candles', 'others', '2026-10-01T10:00:00Z'${extra ? ", " + extra.split("=")[1] : ""})`,
      )
      .run();

  it("creates both tables and the ingredient price columns", () => {
    const db = seed();
    expect(tables(db)).toEqual(
      expect.arrayContaining(["shopping_list", "shopping_item"]),
    );
    const cols = db.prepare("pragma table_info(ingredient)").all();
    expect(cols.map((c) => (c as { name: string }).name)).toEqual(
      expect.arrayContaining([
        "price_cents",
        "price_pack_qty",
        "price_pack_unit",
      ]),
    );
  });

  it("allows a manual item without ingredient, quantity or costs", () => {
    expect(() => addItem(seed())).not.toThrow();
  });

  it("allows one list per week", () => {
    const db = seed();
    expect(() =>
      db
        .prepare(
          "insert into shopping_list (iso_week, generated_at) values ('2026-W40', 'x')",
        )
        .run(),
    ).toThrow(/UNIQUE/);
  });

  it("rejects negative cents and a non-positive quantity", () => {
    const db = seed();
    expect(() => addItem(db, "est_cost_cents=-1")).toThrow(/CHECK/);
    expect(() => addItem(db, "actual_cost_cents=-1")).toThrow(/CHECK/);
    expect(() => addItem(db, "quantity=0")).toThrow(/CHECK/);
  });

  it("deletes the items with their list", () => {
    const db = seed();
    addItem(db);
    db.prepare("delete from shopping_list").run();
    expect(db.prepare("select count(*) n from shopping_item").get()).toEqual({
      n: 0,
    });
  });

  it("rejects a negative price or a non-positive pack", () => {
    const { $client: db } = freshDb();
    const ins = (price: number, qty: number) =>
      db
        .prepare(
          "insert into ingredient (name, category, source, kcal_100g, carbs_100g, protein_100g, fat_100g, default_unit, updated_at, price_cents, price_pack_qty, price_pack_unit) values (?, 'grains', 'manual', 0, 0, 0, 0, 'g', 'now', ?, ?, 'g')",
        )
        .run(`x${price}${qty}`, price, qty);
    expect(() => ins(-1, 500)).toThrow(/CHECK/);
    expect(() => ins(120, 0)).toThrow(/CHECK/);
    expect(() => ins(120, 500)).not.toThrow();
  });
});

describe("0005 ingredient columns", () => {
  it("keeps the ingredients and the recipe links to them", () => {
    const dir = mkdtempSync(join(tmpdir(), "nutrigo-"));
    const old = join(dir, "old");
    cpSync(new URL("./migrations", import.meta.url), old, { recursive: true });
    const journal = join(old, "meta/_journal.json");
    const j = JSON.parse(readFileSync(journal, "utf8"));
    j.entries = j.entries.filter(
      (e: { tag: string }) => !e.tag.startsWith("0005"),
    );
    writeFileSync(journal, JSON.stringify(j));
    const path = join(dir, "old.db");
    const sqlite = new Database(path);
    migrate(drizzle(sqlite), { migrationsFolder: old });
    sqlite.exec(`insert into ingredient (id, name, category, source, kcal_100g, carbs_100g, protein_100g, fat_100g, default_unit, updated_at) values (1, 'Oats', 'grains', 'manual', 370, 60, 13, 7, 'g', 'x');
      insert into recipe (id, name, meal_type, servings, updated_at) values (1, 'R', 'lunch', 1, 'x');
      insert into recipe_ingredient (recipe_id, ingredient_id, quantity, unit, position) values (1, 1, 50, 'g', 0)`);
    sqlite.close();
    const { $client: db } = openDb(path);
    expect(
      db.prepare("select name, price_cents from ingredient").all(),
    ).toEqual([{ name: "Oats", price_cents: null }]);
    expect(
      db.prepare("select count(*) n from recipe_ingredient").get(),
    ).toEqual({ n: 1 });
    expect(db.pragma("foreign_key_check")).toEqual([]);
  });
});
