import { describe, expect, it } from "vitest";
import type { Category } from "./recipes.ts";
import { buildList, estimateCost } from "./shopping.ts";

type Ing = {
  id: number;
  name: string;
  category: Category;
  gramsPerUnit?: number | null;
};

const oats = {
  id: 1,
  name: "Oats",
  category: "grains" as const,
  priceCents: 120,
  pricePackQty: 500,
  pricePackUnit: "g" as const,
};
const egg = {
  id: 2,
  name: "Egg",
  category: "protein" as const,
  gramsPerUnit: 50,
};
const milk = { id: 3, name: "Milk", category: "dairy" as const };
const salt = {
  id: 4,
  name: "Salt",
  category: "others" as const,
  priceCents: null,
};
const line = (
  ingredient: Ing,
  quantity: number,
  unit: "g" | "ml" | "piece",
) => ({ ingredient, quantity, unit });
const plan = (...entries: [number, number][]) =>
  entries.map(([recipeId, servings]) => ({ recipeId, servings }));

describe("buildList", () => {
  it("SPEC-005 AC-1: oats in 3 recipes merge into one 180 g item", () => {
    const recipes = [60, 80, 40].map((q, i) => ({
      id: i + 1,
      servings: 1,
      lines: [line(oats, q, "g")],
    }));
    expect(buildList(plan([1, 1], [2, 1], [3, 1]), recipes)).toEqual([
      {
        ingredientId: 1,
        label: "Oats",
        category: "grains",
        quantity: 180,
        unit: "g",
      },
    ]);
  });

  it("scales by entry servings ÷ recipe servings", () => {
    const recipes = [{ id: 1, servings: 4, lines: [line(oats, 200, "g")] }];
    expect(buildList(plan([1, 2]), recipes)[0]?.quantity).toBe(100);
  });

  it("sums the same entry planned twice", () => {
    const recipes = [{ id: 1, servings: 1, lines: [line(oats, 50, "g")] }];
    expect(buildList(plan([1, 1], [1, 1]), recipes)[0]?.quantity).toBe(100);
  });

  it("SPEC-005 AC-2: pieces and grams merge in grams when convertible", () => {
    const recipes = [
      { id: 1, servings: 1, lines: [line(egg, 2, "piece")] },
      { id: 2, servings: 1, lines: [line(egg, 100, "g")] },
    ];
    expect(buildList(plan([1, 1], [2, 1]), recipes)).toEqual([
      {
        ingredientId: 2,
        label: "Egg",
        category: "protein",
        quantity: 200,
        unit: "g",
      },
    ]);
  });

  it("keeps a single unit as is (pieces stay pieces)", () => {
    const recipes = [{ id: 1, servings: 1, lines: [line(egg, 2, "piece")] }];
    expect(buildList(plan([1, 1], [1, 1]), recipes)[0]).toMatchObject({
      quantity: 4,
      unit: "piece",
    });
  });

  it("SPEC-005 AC-2: unmergeable units stay separate lines", () => {
    const noWeight = { id: 5, name: "Basil", category: "veggies" as const };
    const recipes = [
      { id: 1, servings: 1, lines: [line(noWeight, 2, "piece")] },
      { id: 2, servings: 1, lines: [line(noWeight, 10, "g")] },
    ];
    expect(
      buildList(plan([1, 1], [2, 1]), recipes).map((i) => [i.quantity, i.unit]),
    ).toEqual([
      [2, "piece"],
      [10, "g"],
    ]);
  });

  it("ignores entries whose recipe is unknown and returns [] for an empty plan", () => {
    expect(buildList(plan([9, 1]), [])).toEqual([]);
    expect(buildList([], [])).toEqual([]);
  });
});

describe("estimateCost", () => {
  it("SPEC-005 AC-3: 180 g at €1.20 per 500 g is one whole pack = 120 cents", () => {
    expect(estimateCost(180, "g", oats)).toBe(120);
  });

  it("rounds up to whole packs", () => {
    expect(estimateCost(500, "g", oats)).toBe(120);
    expect(estimateCost(501, "g", oats)).toBe(240);
  });

  it("is not thrown off by float sums", () => {
    expect(estimateCost(0.1 * 3 * 1000 + 200, "g", oats)).toBe(120);
  });

  it("SPEC-005 AC-4: no price gives null", () => {
    expect(estimateCost(100, "g", salt)).toBeNull();
    expect(estimateCost(100, "g", { ...oats, priceCents: null })).toBeNull();
  });

  it("converts through grams when units differ", () => {
    const packPieces = {
      ...egg,
      priceCents: 300,
      pricePackQty: 6,
      pricePackUnit: "piece" as const,
    };
    expect(estimateCost(300, "g", packPieces)).toBe(300); // 6 eggs = 1 pack
    expect(estimateCost(350, "g", packPieces)).toBe(600); // 7 eggs = 2 packs
  });

  it("gives null when the units cannot be converted", () => {
    const packPieces = {
      ...milk,
      priceCents: 300,
      pricePackQty: 6,
      pricePackUnit: "piece" as const,
    };
    expect(estimateCost(350, "g", packPieces)).toBeNull();
  });
});
