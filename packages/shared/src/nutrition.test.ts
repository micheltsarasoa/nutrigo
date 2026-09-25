import { describe, expect, it } from "vitest";
import {
  healthScore,
  nutritionPerServing,
  scaleQuantities,
  toGrams,
  totalTime,
  type Nutrition,
} from "./nutrition.ts";

const per100 = (kcal100g: number, protein100g = 0) => ({
  kcal100g,
  carbs100g: 0,
  protein100g,
  fat100g: 0,
});
const turkey = { ...per100(135, 30), fat100g: 1, gramsPerUnit: null };
const egg = { ...per100(143, 13), gramsPerUnit: 50 };
const milk = { ...per100(47, 3.4), gramsPerUnit: 1.03 };

describe("toGrams", () => {
  it.each([
    ["g stays g", 200, "g" as const, turkey, 200],
    ["ml uses grams per unit", 100, "ml" as const, milk, 103],
    ["ml defaults to 1 g/ml", 100, "ml" as const, turkey, 100],
    ["2 eggs × 50 g = 100 g", 2, "piece" as const, egg, 100],
    ["0 is 0", 0, "g" as const, turkey, 0],
  ])("%s", (_, qty, unit, ingredient, grams) => {
    expect(toGrams(qty, unit, ingredient)).toBeCloseTo(grams);
  });

  it("throws for a piece without grams per unit", () => {
    expect(() => toGrams(1, "piece", turkey)).toThrow(/grams per unit/);
  });
});

describe("nutritionPerServing", () => {
  it("200 g turkey (135 kcal/100 g) for 2 servings → 135 kcal", () => {
    const n = nutritionPerServing({
      servings: 2,
      ingredients: [{ quantity: 200, unit: "g", ingredient: turkey }],
    });
    expect(n).toEqual({
      kcal: 135,
      carbs: 0,
      protein: 30,
      fat: 1,
      fibre: 0,
      sugars: 0,
      sodiumMg: 0,
    });
  });

  it("sums every ingredient, counting a missing optional nutrient as 0", () => {
    const n = nutritionPerServing({
      servings: 1,
      ingredients: [
        {
          quantity: 2,
          unit: "piece",
          ingredient: { ...egg, sodiumMg100g: 140 },
        },
        {
          quantity: 100,
          unit: "g",
          ingredient: { ...per100(350), fibre100g: 10, sugars100g: null },
        },
      ],
    });
    expect(n.kcal).toBeCloseTo(143 + 350);
    expect(n.protein).toBeCloseTo(13);
    expect(n.fibre).toBeCloseTo(10);
    expect(n.sugars).toBe(0);
    expect(n.sodiumMg).toBeCloseTo(140);
  });

  it("is all zeros for a recipe without ingredients", () => {
    expect(nutritionPerServing({ servings: 4, ingredients: [] }).kcal).toBe(0);
  });
});

describe("scaleQuantities", () => {
  it("200 g at 2 servings → 300 g at 3", () => {
    const lines = [{ quantity: 200, unit: "g" as const }];
    expect(scaleQuantities({ servings: 2, ingredients: lines }, 3)).toEqual([
      { quantity: 300, unit: "g" },
    ]);
  });

  it("rounds to at most 2 decimals", () => {
    const lines = [{ quantity: 1, unit: "piece" as const }];
    expect(
      scaleQuantities({ servings: 3, ingredients: lines }, 1)[0]!.quantity,
    ).toBe(0.33);
  });
});

describe("totalTime", () => {
  it.each([
    [10, 15, 25],
    [10, null, 10],
    [undefined, 20, 20],
    [0, 0, 0],
    [null, null, null],
    [undefined, undefined, null],
  ])("prep %s + cook %s = %s", (prepMin, cookMin, total) => {
    expect(totalTime({ prepMin, cookMin })).toBe(total);
  });
});

describe("healthScore", () => {
  const base: Nutrition = {
    kcal: 200,
    carbs: 30,
    protein: 5,
    fat: 2,
    fibre: 0,
    sugars: 0,
    sodiumMg: 0,
  };

  it("turkey, rice, asparagus → 9", () => {
    const bowl = { ...base, kcal: 520, protein: 42, fat: 8, fibre: 3 };
    expect(healthScore(bowl, ["protein", "grains", "veggies"])).toBe(9);
  });

  it.each<[string, Partial<Nutrition>, string[], number]>([
    ["starts at 5", {}, [], 5],
    ["+2 for protein ≥ 20 g", { protein: 20 }, [], 7],
    ["+1 for fibre ≥ 5 g", { fibre: 5 }, [], 6],
    ["+1 for 300 ≤ kcal ≤ 700 (lower bound)", { kcal: 300 }, [], 6],
    ["+1 for 300 ≤ kcal ≤ 700 (upper bound)", { kcal: 700 }, [], 6],
    ["no bonus above 700 kcal", { kcal: 701 }, [], 5],
    [
      "+1 for 3 food categories, counted once each",
      {},
      ["grains", "veggies", "veggies", "dairy"],
      6,
    ],
    ["no bonus for 2 categories", {}, ["grains", "grains", "dairy"], 5],
    ["−1 for sugars > 15 g", { sugars: 15.1 }, [], 4],
    ["−1 for sodium > 800 mg", { sodiumMg: 801 }, [], 4],
    ["−1 when fat supplies > 40 % of kcal", { kcal: 200, fat: 9 }, [], 4],
    ["no fat penalty at 0 kcal", { kcal: 0, fat: 0 }, [], 5],
  ])("%s", (_, change, categories, score) => {
    expect(healthScore({ ...base, ...change }, categories)).toBe(score);
  });

  it("clamps to 0–10", () => {
    const best = { ...base, kcal: 500, protein: 40, fibre: 8, fat: 5 };
    expect(healthScore(best, ["grains", "veggies", "protein"])).toBe(10);
    const worst = { ...base, kcal: 900, fat: 60, sugars: 40, sodiumMg: 2000 };
    expect(healthScore(worst, [])).toBe(2);
  });
});
