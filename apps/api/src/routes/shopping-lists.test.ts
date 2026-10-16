import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import {
  ingredient,
  mealEntry,
  planWeek,
  recipe,
  recipeIngredient,
} from "../db/schema.ts";
import { freshDb } from "../test-db.ts";

type Item = {
  id: number;
  ingredientId: number | null;
  label: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  estCostCents: number | null;
  actualCostCents: number | null;
  purchasedAt: string | null;
  updatedAt: string;
  noLongerInPlan?: boolean;
};
type List = {
  isoWeek: string;
  items: Item[];
  estimatedCents: number;
  actualCents: number;
  excludedCount: number;
};
const json = <T>(res: Response) => res.json() as Promise<T>;
const W = "/api/shopping-lists/2026-W40";

// W40 plan: oats 60 g + 80 g + 40 g (3 recipes, priced €1.20 per 500 g) and salt 1 g (no price).
const setup = () => {
  const db = freshDb();
  const app = createApp({ db, version: "test" });
  const ing = (id: number, name: string, price?: boolean) =>
    db
      .insert(ingredient)
      .values({
        id,
        name,
        category: id === 1 ? "grains" : "others",
        source: "manual",
        kcal100g: 1,
        carbs100g: 0,
        protein100g: 0,
        fat100g: 0,
        defaultUnit: "g",
        updatedAt: "x",
        ...(price
          ? { priceCents: 120, pricePackQty: 500, pricePackUnit: "g" as const }
          : {}),
      })
      .run();
  ing(1, "Oats", true);
  ing(2, "Salt");
  db.insert(planWeek).values({ isoWeek: "2026-W40" }).run();
  [60, 80, 40].forEach((grams, i) => {
    const id = i + 1;
    db.insert(recipe)
      .values({
        id,
        name: `R${id}`,
        mealType: "lunch",
        servings: 1,
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
    db.insert(mealEntry)
      .values({
        isoWeek: "2026-W40",
        date: "2026-09-28",
        slot: "lunch",
        recipeId: id,
        servings: 1,
        position: i,
      })
      .run();
  });
  db.insert(recipeIngredient)
    .values({
      recipeId: 1,
      ingredientId: 2,
      quantity: 1,
      unit: "g",
      position: 1,
    })
    .run();
  const send = (method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const generate = (mode = "create", week = W) =>
    send("POST", `${week}/generate`, { mode });
  const list = async () => json<List>(await send("GET", W));
  return { db, send, generate, list };
};

describe("POST /generate", () => {
  it("AC-1/AC-3/AC-4: merges oats to 180 g, costs one pack, flags the unpriced item", async () => {
    const { generate } = setup();
    const res = await generate();
    expect(res.status).toBe(200);
    const body = await json<List>(res);
    expect(body.items.find((i) => i.label === "Oats")).toMatchObject({
      quantity: 180,
      unit: "g",
      category: "grains",
      estCostCents: 120,
    });
    expect(body.items.find((i) => i.label === "Salt")?.estCostCents).toBeNull();
    expect(body.estimatedCents).toBe(120);
    expect(body.excludedCount).toBe(1);
  });

  it("404 without a plan, 409 when the list exists", async () => {
    const { generate } = setup();
    expect(
      (await generate("create", "/api/shopping-lists/2026-W41")).status,
    ).toBe(404);
    await generate();
    expect((await generate()).status).toBe(409);
  });

  it("400 for an invalid week or mode", async () => {
    const { send } = setup();
    expect(
      (
        await send("POST", "/api/shopping-lists/nope/generate", {
          mode: "create",
        })
      ).status,
    ).toBe(400);
    expect((await send("POST", `${W}/generate`, { mode: "x" })).status).toBe(
      400,
    );
  });

  it("freezes est_cost_cents: a later price change does not rewrite it", async () => {
    const { db, generate, list } = setup();
    await generate();
    db.$client
      .prepare("update ingredient set price_cents = 999 where id = 1")
      .run();
    expect(
      (await list()).items.find((i) => i.label === "Oats")?.estCostCents,
    ).toBe(120);
  });

  it("AC-5: regenerate keeps ticks, actual prices and manual items, flags removed ticked ones", async () => {
    const { db, send, generate, list } = setup();
    await generate();
    const before = await list();
    const oats = before.items.find((i) => i.label === "Oats")!;
    const salt = before.items.find((i) => i.label === "Salt")!;
    await send("PATCH", `${W}/items`, [
      {
        id: oats.id,
        patch: { purchased: true, actualCostCents: 300 },
        updatedAt: "2099-01-01T00:00:00Z",
      },
      {
        id: salt.id,
        patch: { purchased: true },
        updatedAt: "2099-01-01T00:00:00Z",
      },
    ]);
    await send("POST", `${W}/items`, { label: "Candles", category: "others" });
    // The plan changes: recipe 1 (with the salt) leaves, oats drop to 120 g.
    db.$client.prepare("delete from meal_entry where recipe_id = 1").run();
    const res = await generate("regenerate");
    expect(res.status).toBe(200);
    const after = await json<List>(res);
    expect(after.items.find((i) => i.label === "Oats")).toMatchObject({
      id: oats.id,
      quantity: 120,
      actualCostCents: 300,
    });
    expect(
      after.items.find((i) => i.label === "Oats")?.purchasedAt,
    ).not.toBeNull();
    expect(after.items.find((i) => i.label === "Salt")?.noLongerInPlan).toBe(
      true,
    );
    expect(after.items.some((i) => i.label === "Candles")).toBe(true);
  });

  it("regenerate drops an unticked item that left the plan", async () => {
    const { db, generate, list } = setup();
    await generate();
    db.$client.prepare("delete from meal_entry where recipe_id = 1").run();
    await generate("regenerate");
    expect((await list()).items.map((i) => i.label)).toEqual(["Oats"]);
  });

  it("regenerate on a week without a list creates it", async () => {
    const { generate } = setup();
    expect((await generate("regenerate")).status).toBe(200);
  });
});

describe("GET", () => {
  it("404 before generation", async () => {
    const { send } = setup();
    expect((await send("GET", W)).status).toBe(404);
  });
});

describe("POST /items", () => {
  it("201 adds a manual item without ingredient or cost", async () => {
    const { send, generate, list } = setup();
    await generate();
    const res = await send("POST", `${W}/items`, {
      label: "Candles",
      category: "others",
      quantity: 2,
      unit: "piece",
    });
    expect(res.status).toBe(201);
    expect(await json<Item>(res)).toMatchObject({
      ingredientId: null,
      label: "Candles",
      quantity: 2,
      estCostCents: null,
    });
    expect((await list()).items).toHaveLength(3);
  });

  it("400 for an empty label, 404 without a list", async () => {
    const { send, generate } = setup();
    expect(
      (await send("POST", `${W}/items`, { label: "x", category: "others" }))
        .status,
    ).toBe(404);
    await generate();
    expect(
      (await send("POST", `${W}/items`, { label: " ", category: "others" }))
        .status,
    ).toBe(400);
  });
});

describe("PATCH /items (batch, last-write-wins)", () => {
  it("AC-9: ticks and stores the actual price; totals follow", async () => {
    const { send, generate, list } = setup();
    const { items } = await json<List>(await generate());
    const oats = items.find((i) => i.label === "Oats")!;
    const res = await send("PATCH", `${W}/items`, [
      {
        id: oats.id,
        patch: { purchased: true, actualCostCents: 300 },
        updatedAt: "2099-01-01T00:00:00Z",
      },
    ]);
    expect(res.status).toBe(200);
    const [resolved] = await json<Item[]>(res);
    expect(resolved).toMatchObject({
      actualCostCents: 300,
      updatedAt: "2099-01-01T00:00:00Z",
    });
    expect(resolved?.purchasedAt).toBe("2099-01-01T00:00:00Z");
    expect((await list()).actualCents).toBe(300);
  });

  it("AC-8: a stale updatedAt loses and the stored item is returned", async () => {
    const { send, generate, list } = setup();
    const { items } = await json<List>(await generate());
    const oats = items.find((i) => i.label === "Oats")!;
    await send("PATCH", `${W}/items`, [
      {
        id: oats.id,
        patch: { quantity: 200 },
        updatedAt: "2099-01-01T00:00:00Z",
      },
    ]);
    const res = await send("PATCH", `${W}/items`, [
      {
        id: oats.id,
        patch: { quantity: 5 },
        updatedAt: "2098-01-01T00:00:00Z",
      },
    ]);
    expect((await json<Item[]>(res))[0]?.quantity).toBe(200);
    expect((await list()).items.find((i) => i.id === oats.id)?.quantity).toBe(
      200,
    );
  });

  it("AC-7: resolves each item on its own; unticking clears purchasedAt; unknown ids are skipped", async () => {
    const { send, generate } = setup();
    const { items } = await json<List>(await generate());
    const [a, b] = items as [Item, Item];
    await send("PATCH", `${W}/items`, [
      {
        id: a.id,
        patch: { purchased: true },
        updatedAt: "2099-01-01T00:00:00Z",
      },
    ]);
    const res = await send("PATCH", `${W}/items`, [
      {
        id: a.id,
        patch: { purchased: false },
        updatedAt: "2099-06-01T00:00:00Z",
      },
      {
        id: b.id,
        patch: { purchased: true },
        updatedAt: "2000-01-01T00:00:00Z",
      },
      {
        id: 9999,
        patch: { purchased: true },
        updatedAt: "2099-01-01T00:00:00Z",
      },
    ]);
    const out = await json<Item[]>(res);
    expect(out.map((i) => [i.id, i.purchasedAt])).toEqual([
      [a.id, null],
      [b.id, null],
    ]);
  });

  it("400 for fractional cents or a missing updatedAt", async () => {
    const { send, generate } = setup();
    const { items } = await json<List>(await generate());
    const id = items[0]!.id;
    expect(
      (
        await send("PATCH", `${W}/items`, [
          { id, patch: { actualCostCents: 1.5 }, updatedAt: "x" },
        ])
      ).status,
    ).toBe(400);
    expect(
      (await send("PATCH", `${W}/items`, [{ id, patch: {} }])).status,
    ).toBe(400);
  });

  it("only touches items of that week's list", async () => {
    const { db, send, generate } = setup();
    await generate();
    db.insert(planWeek).values({ isoWeek: "2026-W41" }).run();
    db.$client
      .prepare(
        "insert into shopping_list (iso_week, generated_at) values ('2026-W41', 'x')",
      )
      .run();
    db.$client
      .prepare(
        "insert into shopping_item (list_id, label, category, updated_at) values (2, 'Other', 'others', 'x')",
      )
      .run();
    const res = await send("PATCH", `${W}/items`, [
      { id: 3, patch: { quantity: 9 }, updatedAt: "2099-01-01T00:00:00Z" },
    ]);
    expect(await json<Item[]>(res)).toEqual([]);
  });
});

describe("DELETE /items/:id", () => {
  it("204 then 404", async () => {
    const { send, generate, list } = setup();
    const { items } = await json<List>(await generate());
    const id = items[0]!.id;
    expect((await send("DELETE", `${W}/items/${id}`)).status).toBe(204);
    expect((await send("DELETE", `${W}/items/${id}`)).status).toBe(404);
    expect((await list()).items).toHaveLength(1);
  });
});
