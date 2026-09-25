import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.ts";
import { ingredient } from "../db/schema.ts";
import { freshDb } from "../test-db.ts";

afterEach(() => vi.restoreAllMocks());

type ErrorBody = { error: { code: string; fields: Record<string, string> } };
const json = <T = ErrorBody>(res: Response) => res.json() as Promise<T>;
type Detail = {
  id: number;
  name: string;
  ingredients: { name: string; quantity: number }[];
  steps: { title: string }[];
  tools: { name: string }[];
  nutritionPerServing: { kcal: number };
};

const now = "2026-09-25T00:00:00Z";
const bowl = {
  name: "Turkey rice bowl",
  mealType: "lunch",
  servings: 2,
  ingredients: [
    { ingredientId: 1, quantity: 200, unit: "g" },
    { ingredientId: 2, quantity: 100, unit: "g" },
    { ingredientId: 3, quantity: 2, unit: "piece" },
  ],
  steps: [
    { title: "Cook the rice", body: "15 min" },
    { title: "Sear the turkey", body: "" },
  ],
  tools: [{ name: "Pan" }],
};

const setup = () => {
  const db = freshDb();
  const app = createApp({ db, version: "test" });
  const base = {
    carbs100g: 0,
    fat100g: 0,
    protein100g: 0,
    source: "manual",
    updatedAt: now,
  } as const;
  db.insert(ingredient)
    .values([
      {
        id: 1,
        name: "Turkey breast",
        category: "protein",
        kcal100g: 135,
        defaultUnit: "g",
        ...base,
      },
      {
        id: 2,
        name: "Rice",
        category: "grains",
        kcal100g: 350,
        defaultUnit: "g",
        ...base,
      },
      {
        id: 3,
        name: "Egg",
        category: "protein",
        kcal100g: 143,
        defaultUnit: "piece",
        gramsPerUnit: 50,
        ...base,
      },
      {
        id: 4,
        name: "Butter",
        category: "dairy",
        kcal100g: 717,
        defaultUnit: "g",
        ...base,
      },
    ])
    .run();
  const send = (method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return { db, send };
};

describe("POST /api/recipes", () => {
  it("SPEC-002 AC-3: creates a recipe and returns 201 with its lists and nutrition per serving", async () => {
    const { send } = setup();
    const res = await send("POST", "/api/recipes", bowl);
    expect(res.status).toBe(201);
    const body = await json<Detail>(res);
    expect(body.ingredients.map((i) => i.name)).toEqual([
      "Turkey breast",
      "Rice",
      "Egg",
    ]);
    expect(body.steps.map((s) => s.title)).toEqual([
      "Cook the rice",
      "Sear the turkey",
    ]);
    expect(body.tools).toEqual([{ name: "Pan" }]);
    // (270 + 350 + 143) / 2
    expect(body.nutritionPerServing.kcal).toBeCloseTo(381.5);
    const list = await json<{ name: string }[]>(
      await send("GET", "/api/recipes?mealType=lunch"),
    );
    expect(list.map((r) => r.name)).toEqual(["Turkey rice bowl"]);
  });

  it("returns 400 for servings of 0", async () => {
    const { send } = setup();
    const res = await send("POST", "/api/recipes", { ...bowl, servings: 0 });
    expect(res.status).toBe(400);
    expect((await json(res)).error.fields).toEqual({ servings: "too_small" });
  });

  it("returns 400 for an unknown ingredient and for pieces of an ingredient without grams per unit", async () => {
    const { send } = setup();
    const res = await send("POST", "/api/recipes", {
      ...bowl,
      ingredients: [
        { ingredientId: 99, quantity: 1, unit: "g" },
        { ingredientId: 4, quantity: 1, unit: "piece" },
      ],
    });
    expect(res.status).toBe(400);
    expect((await json(res)).error.fields).toEqual({
      "ingredients.0.ingredientId": "not_found",
      "ingredients.1.unit": "grams_per_unit_missing",
    });
    expect(await json(await send("GET", "/api/recipes"))).toEqual([]);
  });
});

describe("PATCH /api/recipes/:id", () => {
  it("replaces the fields and every list", async () => {
    const { send } = setup();
    const { id } = await json<Detail>(await send("POST", "/api/recipes", bowl));
    const res = await send("PATCH", `/api/recipes/${id}`, {
      ...bowl,
      name: "Rice bowl",
      ingredients: [{ ingredientId: 2, quantity: 150, unit: "g" }],
      steps: [],
      tools: [{ name: "Pot" }, { name: "Bowl" }],
    });
    expect(res.status).toBe(200);
    const body = await json<Detail>(res);
    expect(body).toMatchObject({
      id,
      name: "Rice bowl",
      steps: [],
      tools: [{ name: "Pot" }, { name: "Bowl" }],
    });
    expect(body.ingredients).toEqual([
      { ingredientId: 2, name: "Rice", quantity: 150, unit: "g" },
    ]);
  });

  it("keeps the old recipe intact when the replace fails half-way", async () => {
    const { db, send } = setup();
    const { id } = await json<Detail>(await send("POST", "/api/recipes", bowl));
    db.$client.exec(
      "create trigger boom before insert on recipe_tool when new.name = 'boom' begin select raise(abort, 'boom'); end",
    );
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await send("PATCH", `/api/recipes/${id}`, {
      ...bowl,
      name: "Changed",
      tools: [{ name: "boom" }],
    });
    expect(res.status).toBe(500);
    expect(stderr).toHaveBeenCalled();
    const after = await json<Detail>(await send("GET", `/api/recipes/${id}`));
    expect(after.name).toBe("Turkey rice bowl");
    expect(after.ingredients).toHaveLength(3);
    expect(after.tools).toEqual([{ name: "Pan" }]);
  });

  it("returns 400 for an invalid body and 404 for an unknown id", async () => {
    const { send } = setup();
    expect(
      (await send("PATCH", "/api/recipes/1", { ...bowl, mealType: "brunch" }))
        .status,
    ).toBe(400);
    expect((await send("PATCH", "/api/recipes/999", bowl)).status).toBe(404);
    expect((await send("PATCH", "/api/recipes/abc", bowl)).status).toBe(404);
  });
});

describe("DELETE /api/recipes/:id", () => {
  it("deletes the recipe and its lists, then 404s", async () => {
    const { db, send } = setup();
    const { id } = await json<Detail>(await send("POST", "/api/recipes", bowl));
    expect((await send("DELETE", `/api/recipes/${id}`)).status).toBe(204);
    expect((await send("GET", `/api/recipes/${id}`)).status).toBe(404);
    expect(
      db.$client.prepare("select count(*) as n from recipe_ingredient").get(),
    ).toEqual({ n: 0 });
    expect((await send("DELETE", `/api/recipes/${id}`)).status).toBe(404);
    expect((await send("DELETE", "/api/recipes/abc")).status).toBe(404);
  });
});
