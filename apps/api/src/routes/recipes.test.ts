import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import {
  ingredient,
  recipe,
  recipeIngredient,
  recipeStep,
  recipeTool,
} from "../db/schema.ts";
import { freshDb } from "../test-db.ts";

type ErrorBody = { error: { code: string; fields: Record<string, string> } };
const json = <T = ErrorBody>(res: Response) => res.json() as Promise<T>;
type Summary = {
  id: number;
  name: string;
  kcalPerServing: number;
  healthScore: number;
  totalMin: number | null;
};

const now = "2026-09-25T00:00:00Z";
const per100 = {
  carbs100g: 0,
  fat100g: 0,
  defaultUnit: "g",
  source: "manual",
  updatedAt: now,
} as const;

const setup = () => {
  const db = freshDb();
  const app = createApp({ db, version: "test" });
  db.insert(ingredient)
    .values([
      {
        id: 1,
        name: "Turkey breast",
        category: "protein",
        kcal100g: 135,
        protein100g: 30,
        ...per100,
        fat100g: 1,
      },
      {
        id: 2,
        name: "Rice",
        category: "grains",
        kcal100g: 350,
        protein100g: 7,
        ...per100,
        carbs100g: 78,
        fibre100g: 1,
      },
      {
        id: 3,
        name: "Asparagus",
        category: "veggies",
        kcal100g: 20,
        protein100g: 2,
        ...per100,
        fibre100g: 2,
      },
      {
        id: 4,
        name: "Egg",
        category: "protein",
        kcal100g: 143,
        protein100g: 13,
        ...per100,
        defaultUnit: "piece",
        gramsPerUnit: 50,
      },
    ])
    .run();
  let nextId = 1;
  const seed = (
    name: string,
    more: Partial<typeof recipe.$inferInsert> = {},
    lines: [number, number, "g" | "piece"][] = [[1, 100, "g"]],
  ) => {
    const id = nextId++;
    db.insert(recipe)
      .values({
        id,
        name,
        mealType: "lunch",
        servings: 1,
        updatedAt: now,
        ...more,
      })
      .run();
    lines.forEach(([ingredientId, quantity, unit], position) =>
      db
        .insert(recipeIngredient)
        .values({ recipeId: id, ingredientId, quantity, unit, position })
        .run(),
    );
    return id;
  };
  const get = (path: string) => app.request(path);
  return { db, seed, get };
};

describe("GET /api/recipes", () => {
  it("lists summaries with kcal per serving, health score and total time, sorted by name", async () => {
    const { seed, get } = setup();
    seed("Bowl", { servings: 2, prepMin: 10, cookMin: 15 }, [[1, 200, "g"]]);
    seed("Apple eggs", { mealType: "breakfast" }, [[4, 2, "piece"]]);
    const list = await json<Summary[]>(await get("/api/recipes"));
    expect(list.map((r) => r.name)).toEqual(["Apple eggs", "Bowl"]);
    expect(list[1]).toMatchObject({
      mealType: "lunch",
      kcalPerServing: 135,
      healthScore: 7,
      totalMin: 25,
      rating: null,
      photoPath: null,
    });
    expect(list[0]!.kcalPerServing).toBeCloseTo(143);
  });

  it("SPEC-002 AC-4: '?q=chick' keeps only names containing it, case-insensitive", async () => {
    const { seed, get } = setup();
    for (const name of [
      "Chickpea curry",
      "Roast CHICKEN",
      "Beef stew",
      "Lentil soup",
    ])
      seed(name);
    const list = await json<Summary[]>(await get("/api/recipes?q=chick"));
    expect(list.map((r) => r.name)).toEqual([
      "Chickpea curry",
      "Roast CHICKEN",
    ]);
  });

  it("SPEC-002 AC-5: '?mealType=lunch' keeps only lunch recipes", async () => {
    const { seed, get } = setup();
    seed("Porridge", { mealType: "breakfast" });
    seed("Salad", { mealType: "lunch" });
    seed("Soup", { mealType: "dinner" });
    const list = await json<Summary[]>(
      await get("/api/recipes?mealType=lunch"),
    );
    expect(list.map((r) => r.name)).toEqual(["Salad"]);
  });

  it.each([
    ["kcal", ["Light", "Mid", "Heavy"]],
    ["health", ["Heavy", "Mid", "Light"]],
    ["time", ["Mid", "Light", "Heavy"]],
    ["rating", ["Heavy", "Light", "Mid"]],
  ])("sorts by %s (best first; missing values last)", async (sort, order) => {
    const { seed, get } = setup();
    // Heavy: 520 kcal, protein 42 → score 8; Mid: 270 kcal → 7; Light: 20 kcal → 5.
    seed("Heavy", { rating: 5 }, [
      [1, 300, "g"],
      [2, 33, "g"],
    ]);
    seed("Light", { rating: 2, prepMin: 30 }, [[3, 100, "g"]]);
    seed("Mid", { prepMin: 5, cookMin: 5 }, [[1, 200, "g"]]);
    const list = await json<Summary[]>(await get(`/api/recipes?sort=${sort}`));
    expect(list.map((r) => r.name)).toEqual(order);
  });

  it("returns 400 for an unknown sort or meal type", async () => {
    const { get } = setup();
    const res = await get("/api/recipes?sort=price&mealType=brunch");
    expect(res.status).toBe(400);
    expect(Object.keys((await json(res)).error.fields)).toEqual([
      "mealType",
      "sort",
    ]);
  });
});

describe("GET /api/recipes/:id", () => {
  it("returns the recipe with ordered lists, nutrition per serving and health score", async () => {
    const { db, seed, get } = setup();
    const id = seed(
      "Turkey rice bowl",
      {
        servings: 2,
        difficulty: "easy",
        prepMin: 10,
        cookMin: 15,
        rating: 4,
        notesMd: "Keeps 2 days.",
        description: "Quick",
      },
      [
        [1, 200, "g"],
        [2, 100, "g"],
        [3, 100, "g"],
      ],
    );
    db.insert(recipeStep)
      .values([
        { recipeId: id, position: 1, title: "Sear", body: "5 min" },
        { recipeId: id, position: 0, title: "Boil rice", body: "" },
      ])
      .run();
    db.insert(recipeTool)
      .values({ recipeId: id, position: 0, name: "Pan" })
      .run();

    const res = await get(`/api/recipes/${id}`);
    expect(res.status).toBe(200);
    const body = await json<Record<string, unknown>>(res);
    expect(body).toMatchObject({
      id,
      name: "Turkey rice bowl",
      description: "Quick",
      mealType: "lunch",
      servings: 2,
      difficulty: "easy",
      prepMin: 10,
      cookMin: 15,
      totalMin: 25,
      rating: 4,
      notes: "Keeps 2 days.",
      photoPath: null,
      ingredients: [
        { ingredientId: 1, name: "Turkey breast", quantity: 200, unit: "g" },
        { ingredientId: 2, name: "Rice", quantity: 100, unit: "g" },
        { ingredientId: 3, name: "Asparagus", quantity: 100, unit: "g" },
      ],
      steps: [
        { title: "Boil rice", body: "" },
        { title: "Sear", body: "5 min" },
      ],
      tools: [{ name: "Pan" }],
      // 320 kcal (+1), 34.5 g protein (+2), 3 categories (+1).
      healthScore: 9,
    });
    expect((body.nutritionPerServing as { kcal: number }).kcal).toBeCloseTo(
      135 + 175 + 10,
    );
  });

  it("returns 404 for an unknown or malformed id", async () => {
    const { get } = setup();
    expect((await get("/api/recipes/999")).status).toBe(404);
    expect((await get("/api/recipes/abc")).status).toBe(404);
  });
});
