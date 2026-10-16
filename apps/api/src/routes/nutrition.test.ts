import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import {
  ingredient,
  mealEntry,
  planWeek,
  recipe,
  recipeIngredient,
  targets,
} from "../db/schema.ts";
import { freshDb } from "../test-db.ts";

type Macros = { kcal: number; carbs: number; protein: number; fat: number };
type Day = { date: string; planned: Macros; eaten: Macros; isPast: boolean };
type Body = {
  target: number | null;
  planned: Macros;
  eaten: Macros;
  left: number | null;
  macros: Record<string, { eaten: number; target: number | null }>;
  nextMealId: number | null;
  days: Day[];
  total: Macros;
  error: { code: string };
};
const body = async (res: Response) => (await res.json()) as Body;

// Bowl = 100 kcal, 20 g carbs, 5 g protein, 2.5 g fat per serving; Soup = half of that.
const setup = () => {
  const db = freshDb();
  // The clock is fixed to Wed 2026-09-30, 12:00 local.
  const app = createApp({
    db,
    version: "test",
    now: () => new Date(2026, 8, 30, 12, 0, 0),
  });
  db.insert(ingredient)
    .values({
      id: 1,
      name: "Rice",
      category: "grains",
      source: "manual",
      kcal100g: 200,
      carbs100g: 40,
      protein100g: 10,
      fat100g: 5,
      defaultUnit: "g",
      updatedAt: "x",
    })
    .run();
  for (const [id, grams] of [
    [1, 100],
    [2, 50],
  ] as const) {
    db.insert(recipe)
      .values({
        id,
        name: `R${id}`,
        mealType: "lunch",
        servings: 2,
        updatedAt: "x",
      })
      .run();
    db.insert(recipeIngredient)
      .values({
        recipeId: id,
        ingredientId: 1,
        quantity: grams,
        unit: "g",
        position: 0,
      })
      .run();
  }
  db.insert(planWeek).values({ isoWeek: "2026-W40" }).run();
  let n = 0;
  const entry = (
    date: string,
    slot: "breakfast" | "lunch" | "snack" | "dinner",
    recipeId: number,
    over: { eatenServings?: number; eatenAt?: string } = {},
  ) =>
    db
      .insert(mealEntry)
      .values({
        isoWeek: "2026-W40",
        date,
        slot,
        recipeId,
        servings: 1,
        position: n++,
        ...over,
      })
      .returning({ id: mealEntry.id })
      .get().id;
  const tick = { eatenAt: "2026-09-30T08:00:00.000Z" };
  const get = (path: string) => app.request(path);
  return { db, entry, tick, get };
};

describe("GET /api/nutrition/day/:date", () => {
  it("a day with no ticks: eaten 0, left = target, planned summed", async () => {
    const { db, entry, get } = setup();
    db.insert(targets)
      .values({ id: 1, kcal: 2000, carbsG: 250, proteinG: null, fatG: 70 })
      .run();
    entry("2026-09-30", "breakfast", 1);
    entry("2026-09-30", "lunch", 2);
    const res = await get("/api/nutrition/day/2026-09-30");
    expect(res.status).toBe(200);
    const b = await body(res);
    expect(b.target).toBe(2000);
    expect(b.planned).toEqual({
      kcal: 150,
      carbs: 30,
      protein: 7.5,
      fat: 3.75,
    });
    expect(b.eaten).toEqual({ kcal: 0, carbs: 0, protein: 0, fat: 0 });
    expect(b.left).toBe(2000);
    expect(b.macros).toEqual({
      carbs: { eaten: 0, target: 250 },
      protein: { eaten: 0, target: null },
      fat: { eaten: 0, target: 70 },
    });
  });

  it("partial ticks count only ticked entries of that day", async () => {
    const { db, entry, tick, get } = setup();
    db.insert(targets).values({ id: 1, kcal: 2000 }).run();
    entry("2026-09-30", "breakfast", 1, tick);
    entry("2026-09-30", "lunch", 2);
    entry("2026-10-01", "lunch", 1, tick); // another day
    const b = await body(await get("/api/nutrition/day/2026-09-30"));
    expect(b.eaten.kcal).toBe(100);
    expect(b.planned.kcal).toBe(150);
    expect(b.left).toBe(1900);
  });

  it("all ticked, custom servings counted, left may go negative", async () => {
    const { db, entry, tick, get } = setup();
    db.insert(targets).values({ id: 1, kcal: 200 }).run();
    entry("2026-09-30", "breakfast", 1, { ...tick, eatenServings: 3 });
    entry("2026-09-30", "lunch", 2, tick);
    const b = await body(await get("/api/nutrition/day/2026-09-30"));
    expect(b.eaten.kcal).toBe(350);
    expect(b.planned.kcal).toBe(150);
    expect(b.left).toBe(-150);
  });

  it("no targets: target and left are null, totals remain", async () => {
    const { entry, tick, get } = setup();
    entry("2026-09-30", "lunch", 1, tick);
    const b = await body(await get("/api/nutrition/day/2026-09-30"));
    expect(b.target).toBeNull();
    expect(b.left).toBeNull();
    expect(b.eaten.kcal).toBe(100);
    expect(b.macros.carbs).toEqual({ eaten: 20, target: null });
  });

  it("nextMealId: first unticked entry of today from the clock's slot", async () => {
    const { entry, tick, get } = setup(); // 12:00 -> lunch
    entry("2026-09-30", "breakfast", 1); // before the clock's slot
    entry("2026-09-30", "lunch", 1, tick);
    const snack = entry("2026-09-30", "snack", 2);
    entry("2026-09-30", "dinner", 2);
    entry("2026-10-01", "lunch", 2);
    const today = await body(await get("/api/nutrition/day/2026-09-30"));
    expect(today.nextMealId).toBe(snack);
    const other = await body(await get("/api/nutrition/day/2026-10-01"));
    expect(other.nextMealId).toBeNull();
  });

  it.each(["2026-02-30", "nope", "2026-9-1"])(
    "400 on bad date %s",
    async (d) => {
      const { get } = setup();
      const res = await get(`/api/nutrition/day/${d}`);
      expect(res.status).toBe(400);
      expect((await body(res)).error.code).toBe("VALIDATION_FAILED");
    },
  );
});

describe("GET /api/nutrition/week/:isoWeek", () => {
  it("past days show eaten, the rest planned; total follows", async () => {
    const { db, entry, tick, get } = setup(); // today = Wed
    db.insert(targets).values({ id: 1, kcal: 2000 }).run();
    entry("2026-09-28", "lunch", 1, tick); // Mon: eaten 100
    entry("2026-09-29", "lunch", 1, { ...tick, eatenServings: 2 }); // Tue: eaten 200, planned 100
    entry("2026-09-29", "dinner", 2); // Tue: planned only
    entry("2026-09-30", "lunch", 2, tick); // today: planned 50
    entry("2026-10-01", "lunch", 1); // Thu: planned 100
    const res = await get("/api/nutrition/week/2026-W40");
    expect(res.status).toBe(200);
    const b = await body(res);
    expect(b.days).toHaveLength(7);
    expect(b.days[0]?.date).toBe("2026-09-28");
    expect(b.days.map((d) => d.isPast)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(b.days[0]?.eaten.kcal).toBe(100);
    expect(b.days[1]?.eaten.kcal).toBe(200);
    expect(b.days[1]?.planned.kcal).toBe(150);
    expect(b.days[2]?.planned.kcal).toBe(50);
    expect(b.total.kcal).toBe(100 + 200 + 50 + 100);
    expect(b.target).toBe(2000);
  });

  it("no targets: target null", async () => {
    const { get } = setup();
    const b = await body(await get("/api/nutrition/week/2026-W40"));
    expect(b.target).toBeNull();
    expect(b.total.kcal).toBe(0);
  });

  it.each(["2026-W54", "nope", "2027-W53"])("400 on bad week %s", async (w) => {
    const { get } = setup();
    const res = await get(`/api/nutrition/week/${w}`);
    expect(res.status).toBe(400);
    expect((await body(res)).error.code).toBe("VALIDATION_FAILED");
  });
});
