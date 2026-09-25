import { describe, expect, it } from "vitest";
import { IngredientInput, IngredientPatch, RecipeInput } from "./recipes.ts";

const oats = {
  name: "Oats",
  category: "grains",
  kcal100g: 389,
  carbs100g: 66,
  protein100g: 17,
  fat100g: 7,
  defaultUnit: "g",
};

const fields = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
}) => result.error?.issues.map((i) => i.path.join("."));

describe("IngredientInput", () => {
  it("SPEC-002 AC-1: accepts Oats with its four nutrients per 100 g", () => {
    expect(IngredientInput.parse(oats)).toEqual(oats);
  });

  it("accepts the optional nutrients and grams per unit", () => {
    const egg = {
      ...oats,
      name: "Egg",
      defaultUnit: "piece",
      gramsPerUnit: 50,
      fibre100g: 0,
      sugars100g: null,
      sodiumMg100g: 140,
    };
    expect(IngredientInput.parse(egg)).toEqual(egg);
  });

  it("trims the name and rejects an empty one", () => {
    expect(IngredientInput.parse({ ...oats, name: "  Oats " }).name).toBe(
      "Oats",
    );
    expect(fields(IngredientInput.safeParse({ ...oats, name: "  " }))).toEqual([
      "name",
    ]);
  });

  it("SPEC-002 AC-2: rejects a negative value and a missing kcal", () => {
    const noKcal = { ...oats, kcal100g: undefined };
    expect(
      fields(IngredientInput.safeParse({ ...noKcal, fat100g: -1 })),
    ).toEqual(["kcal100g", "fat100g"]);
  });

  it("rejects an unknown category or unit and a grams per unit of 0", () => {
    expect(
      fields(
        IngredientInput.safeParse({
          ...oats,
          category: "sweets",
          defaultUnit: "cup",
          gramsPerUnit: 0,
        }),
      ),
    ).toEqual(["category", "defaultUnit", "gramsPerUnit"]);
  });
});

describe("IngredientPatch", () => {
  it("accepts any subset of the fields, still validated", () => {
    expect(IngredientPatch.parse({ kcal100g: 380 })).toEqual({ kcal100g: 380 });
    expect(IngredientPatch.safeParse({ kcal100g: -5 }).success).toBe(false);
  });
});

const recipe = {
  name: "Turkey rice bowl",
  mealType: "lunch",
  servings: 2,
  ingredients: [
    { ingredientId: 1, quantity: 200, unit: "g" },
    { ingredientId: 2, quantity: 150, unit: "g" },
    { ingredientId: 3, quantity: 2, unit: "piece" },
  ],
  steps: [
    { title: "Cook the rice", body: "15 minutes in salted water." },
    { title: "Sear the turkey", body: "" },
  ],
  tools: [{ name: "Pan" }],
};

describe("RecipeInput", () => {
  it("SPEC-002 AC-3: accepts 2 servings, 3 ingredients, 2 titled steps and a tool", () => {
    expect(RecipeInput.parse(recipe)).toEqual(recipe);
  });

  it("accepts the optional details", () => {
    const full = {
      ...recipe,
      description: "Quick lunch",
      difficulty: "easy",
      prepMin: 10,
      cookMin: 15,
      rating: 5,
      notes: "Keeps 2 days.",
    };
    expect(RecipeInput.parse(full)).toEqual(full);
  });

  it("rejects servings of 0 and an unknown meal type", () => {
    expect(
      fields(
        RecipeInput.safeParse({ ...recipe, servings: 0, mealType: "brunch" }),
      ),
    ).toEqual(["mealType", "servings"]);
  });

  it("rejects a quantity of 0, a rating out of 1–5 and negative minutes", () => {
    const bad = {
      ...recipe,
      ingredients: [{ ingredientId: 1, quantity: 0, unit: "g" }],
      rating: 6,
      prepMin: -1,
    };
    expect(fields(RecipeInput.safeParse(bad))).toEqual([
      "prepMin",
      "rating",
      "ingredients.0.quantity",
    ]);
  });

  it("rejects a step without a title", () => {
    expect(
      fields(
        RecipeInput.safeParse({
          ...recipe,
          steps: [{ title: " ", body: "x" }],
        }),
      ),
    ).toEqual(["steps.0.title"]);
  });

  it("rejects the same ingredient twice", () => {
    const twice = {
      ...recipe,
      ingredients: [
        recipe.ingredients[0],
        { ...recipe.ingredients[0], quantity: 50 },
      ],
    };
    expect(fields(RecipeInput.safeParse(twice))).toEqual([
      "ingredients.1.ingredientId",
    ]);
  });
});
