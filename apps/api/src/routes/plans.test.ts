import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app.ts";
import { ingredient, recipe, recipeIngredient } from "../db/schema.ts";
import { freshDb } from "../test-db.ts";

type Entry = {
  id: number;
  isoWeek: string;
  date: string;
  slot: string;
  recipeId: number;
  recipeName: string;
  kcalPerServing: number;
  servings: number;
  position: number;
};
type Plan = {
  isoWeek: string;
  days: { date: string; slots: Record<string, Entry[]> }[];
};
type ErrorBody = { error: { code: string; fields?: Record<string, string> } };
const json = <T>(res: Response) => res.json() as Promise<T>;

// Two recipes: Bowl = 100 kcal per serving, Soup = 50.
const setup = () => {
  const db = freshDb();
  const app = createApp({ db, version: "test" });
  db.insert(ingredient)
    .values({
      id: 1,
      name: "Rice",
      category: "grains",
      source: "manual",
      kcal100g: 200,
      carbs100g: 0,
      protein100g: 0,
      fat100g: 0,
      defaultUnit: "g",
      updatedAt: "x",
    })
    .run();
  for (const [id, name, grams] of [
    [1, "Bowl", 100],
    [2, "Soup", 50],
  ] as const) {
    db.insert(recipe)
      .values({ id, name, mealType: "lunch", servings: 2, updatedAt: "x" })
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
  const send = (method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const add = async (over: Record<string, unknown> = {}) =>
    json<Entry>(
      await send("POST", "/api/plans/2026-W40/entries", {
        date: "2026-09-30",
        slot: "lunch",
        recipeId: 1,
        servings: 1,
        ...over,
      }),
    );
  const week = async (w = "2026-W40") =>
    json<Plan>(await send("GET", `/api/plans/${w}`));
  const lunch = async () =>
    (await week()).days[2]?.slots.lunch?.map((e) => e.id);
  return { db, send, add, week, lunch };
};

describe("GET /api/plans/:isoWeek", () => {
  it("returns 7 days Mon → Sun with 4 empty slots, without creating the week", async () => {
    const { db, week } = setup();
    const plan = await week();
    expect(plan.isoWeek).toBe("2026-W40");
    expect(plan.days.map((d) => d.date)).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(plan.days[0]?.slots).toEqual({
      breakfast: [],
      lunch: [],
      snack: [],
      dinner: [],
    });
    expect(db.$client.prepare("select * from plan_week").all()).toEqual([]);
  });

  it("returns 400 for a bad week", async () => {
    const { send } = setup();
    for (const w of ["abc", "2027-W53", "2026-W00"]) {
      const res = await send("GET", `/api/plans/${w}`);
      expect(res.status).toBe(400);
      expect((await json<ErrorBody>(res)).error.code).toBe("VALIDATION_FAILED");
    }
  });

  it("SPEC-003 AC-9: stacks a slot's entries by position", async () => {
    const { add, week } = setup();
    const a = await add();
    const b = await add({ recipeId: 2 });
    const lunch = (await week()).days[2]?.slots.lunch;
    expect(lunch?.map((e) => e.id)).toEqual([a.id, b.id]);
    expect(lunch?.map((e) => e.position)).toEqual([0, 1]);
  });
});

describe("POST /api/plans/:isoWeek/entries", () => {
  it("SPEC-003 AC-3: creates the entry with the recipe name and kcal per serving", async () => {
    const { db, send } = setup();
    const res = await send("POST", "/api/plans/2026-W40/entries", {
      date: "2026-09-30",
      slot: "lunch",
      recipeId: 1,
      servings: 1.5,
    });
    expect(res.status).toBe(201);
    expect(await json(res)).toMatchObject({
      isoWeek: "2026-W40",
      date: "2026-09-30",
      slot: "lunch",
      recipeId: 1,
      recipeName: "Bowl",
      kcalPerServing: 100,
      servings: 1.5,
      position: 0,
    });
    expect(db.$client.prepare("select * from plan_week").all()).toEqual([
      { iso_week: "2026-W40" },
    ]);
  });

  it("returns 400 for a bad week, a date outside the week or a bad body", async () => {
    const { send } = setup();
    const ok = { date: "2026-09-30", slot: "lunch", recipeId: 1, servings: 1 };
    expect((await send("POST", "/api/plans/abc/entries", ok)).status).toBe(400);
    const outside = await send("POST", "/api/plans/2026-W40/entries", {
      ...ok,
      date: "2026-10-05",
    });
    expect(outside.status).toBe(400);
    expect((await json<ErrorBody>(outside)).error.fields).toHaveProperty(
      "date",
    );
    for (const bad of [{ servings: 0 }, { slot: "brunch" }, { date: "nope" }])
      expect(
        (await send("POST", "/api/plans/2026-W40/entries", { ...ok, ...bad }))
          .status,
      ).toBe(400);
  });

  it("returns 404 for an unknown recipe and creates nothing", async () => {
    const { db, send } = setup();
    const res = await send("POST", "/api/plans/2026-W40/entries", {
      date: "2026-09-30",
      slot: "lunch",
      recipeId: 99,
      servings: 1,
    });
    expect(res.status).toBe(404);
    expect(db.$client.prepare("select * from meal_entry").all()).toEqual([]);
  });
});

describe("PATCH /api/plans/:isoWeek/entries/:id", () => {
  it("SPEC-003 AC-4: changes the servings", async () => {
    const { send, add } = setup();
    const { id } = await add();
    const res = await send("PATCH", `/api/plans/2026-W40/entries/${id}`, {
      servings: 2,
    });
    expect(res.status).toBe(200);
    expect(await json(res)).toMatchObject({ id, servings: 2 });
  });

  it("SPEC-003 AC-5: moves to another day and slot, at the end of it", async () => {
    const { send, add, week } = setup();
    const existing = await add({ date: "2026-10-01", slot: "dinner" });
    const { id } = await add();
    const res = await send("PATCH", `/api/plans/2026-W40/entries/${id}`, {
      date: "2026-10-01",
      slot: "dinner",
    });
    expect(await json(res)).toMatchObject({
      date: "2026-10-01",
      slot: "dinner",
      position: 1,
    });
    const plan = await week();
    expect(plan.days[2]?.slots.lunch).toEqual([]);
    expect(plan.days[3]?.slots.dinner?.map((e) => e.id)).toEqual([
      existing.id,
      id,
    ]);
  });

  it("reorders inside a slot with position", async () => {
    const { send, add, lunch } = setup();
    const a = await add();
    const b = await add({ recipeId: 2 });
    const c = await add();
    await send("PATCH", `/api/plans/2026-W40/entries/${c.id}`, { position: 0 });
    expect(await lunch()).toEqual([c.id, a.id, b.id]);
  });

  it("returns 400 for a date outside the week or a bad body", async () => {
    const { send, add } = setup();
    const { id } = await add();
    for (const bad of [{ date: "2026-10-05" }, { servings: -1 }, { slot: "x" }])
      expect(
        (await send("PATCH", `/api/plans/2026-W40/entries/${id}`, bad)).status,
      ).toBe(400);
  });

  it("returns 404 for an unknown entry, another week's entry or a bad id", async () => {
    const { send, add } = setup();
    const { id } = await add();
    expect(
      (await send("PATCH", "/api/plans/2026-W40/entries/999", {})).status,
    ).toBe(404);
    expect(
      (await send("PATCH", `/api/plans/2026-W41/entries/${id}`, {})).status,
    ).toBe(404);
    expect(
      (await send("PATCH", "/api/plans/2026-W40/entries/abc", {})).status,
    ).toBe(404);
  });
});

describe("DELETE /api/plans/:isoWeek/entries/:id", () => {
  it("SPEC-003 AC-6: removes the entry, then 404s", async () => {
    const { send, add, lunch } = setup();
    const { id } = await add();
    expect(
      (await send("DELETE", `/api/plans/2026-W40/entries/${id}`)).status,
    ).toBe(204);
    expect(await lunch()).toEqual([]);
    expect(
      (await send("DELETE", `/api/plans/2026-W40/entries/${id}`)).status,
    ).toBe(404);
  });

  it("does not delete another week's entry", async () => {
    const { send, add, lunch } = setup();
    const { id } = await add();
    expect(
      (await send("DELETE", `/api/plans/2026-W41/entries/${id}`)).status,
    ).toBe(404);
    expect(await lunch()).toEqual([id]);
  });
});

describe("POST /api/plans/:isoWeek/copy-from/:otherWeek", () => {
  const copy = (
    send: ReturnType<typeof setup>["send"],
    mode: unknown = "merge",
    to = "2026-W41",
    from = "2026-W40",
  ) => send("POST", `/api/plans/${to}/copy-from/${from}`, { mode });
  const seed = async (add: ReturnType<typeof setup>["add"]) => {
    await add();
    await add({ recipeId: 2, servings: 2 });
    await add({ date: "2026-10-04", slot: "dinner" });
  };

  it("SPEC-003 AC-7: copies into an empty week, same weekday and slot", async () => {
    const { send, add, week } = setup();
    await seed(add);
    const res = await copy(send);
    expect(res.status).toBe(200);
    const plan = await json<Plan>(res);
    expect(plan.isoWeek).toBe("2026-W41");
    const lunch = plan.days[2]?.slots.lunch;
    expect(lunch?.map((e) => [e.date, e.recipeName, e.servings])).toEqual([
      ["2026-10-07", "Bowl", 1],
      ["2026-10-07", "Soup", 2],
    ]);
    expect(plan.days[6]?.slots.dinner).toHaveLength(1);
    expect((await week("2026-W40")).days[2]?.slots.lunch).toHaveLength(2);
  });

  it("SPEC-003 AC-8: merge keeps the target's meals and appends", async () => {
    const { send, add } = setup();
    await seed(add);
    await send("POST", "/api/plans/2026-W41/entries", {
      date: "2026-10-07",
      slot: "lunch",
      recipeId: 2,
      servings: 3,
    });
    const plan = await json<Plan>(await copy(send, "merge"));
    const lunch = plan.days[2]?.slots.lunch;
    expect(lunch?.map((e) => e.servings)).toEqual([3, 1, 2]);
    expect(lunch?.map((e) => e.position)).toEqual([0, 1, 2]);
  });

  it("replace deletes the target's meals first", async () => {
    const { send, add } = setup();
    await seed(add);
    await send("POST", "/api/plans/2026-W41/entries", {
      date: "2026-10-05",
      slot: "snack",
      recipeId: 1,
      servings: 1,
    });
    const plan = await json<Plan>(await copy(send, "replace"));
    expect(plan.days[0]?.slots.snack).toEqual([]);
    expect(plan.days[2]?.slots.lunch).toHaveLength(2);
  });

  it("a failed replace leaves the target unchanged", async () => {
    const { db, send, add, week } = setup();
    await seed(add);
    await send("POST", "/api/plans/2026-W41/entries", {
      date: "2026-10-05",
      slot: "snack",
      recipeId: 1,
      servings: 1,
    });
    db.$client.exec(`create trigger boom before insert on meal_entry
      when new.slot = 'dinner' begin select raise(abort, 'boom'); end`);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await copy(send, "replace")).status).toBe(500);
    spy.mockRestore();
    const plan = await week("2026-W41");
    expect(plan.days[0]?.slots.snack).toHaveLength(1);
    expect(plan.days[2]?.slots.lunch).toEqual([]);
  });

  it("returns 400 for a bad week, a bad mode or the same week", async () => {
    const { send, add } = setup();
    await seed(add);
    expect((await copy(send, "merge", "abc")).status).toBe(400);
    expect((await copy(send, "merge", "2026-W41", "2027-W53")).status).toBe(
      400,
    );
    expect((await copy(send, "swap")).status).toBe(400);
    expect((await copy(send, "merge", "2026-W40")).status).toBe(400);
  });

  it("returns 404 when the source week has no meals", async () => {
    const { send } = setup();
    expect((await copy(send, "merge", "2026-W41", "2026-W39")).status).toBe(
      404,
    );
  });
});
