import { z } from "zod";
import type { Nutrition } from "./nutrition.ts";

// SPEC-002 §5 and data-model.md. JSON is camelCase; the DB stays snake_case.
export const MealType = z.enum(["breakfast", "lunch", "snack", "dinner"]);
export type MealType = z.infer<typeof MealType>;
export const Category = z.enum([
  "grains",
  "veggies",
  "protein",
  "fruits",
  "dairy",
  "others",
]);
export type Category = z.infer<typeof Category>;
export const Unit = z.enum(["g", "ml", "piece"]);
export type Unit = z.infer<typeof Unit>;
export const Difficulty = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof Difficulty>;
export const Source = z.enum(["manual", "off", "ciqual", "ai_estimate"]);
export type Source = z.infer<typeof Source>;

const name = z.string().trim().min(1).max(100);
const amount = z.number().min(0);
const minutes = z.number().int().min(0);

export const IngredientInput = z.object({
  name,
  category: Category,
  kcal100g: amount,
  carbs100g: amount,
  protein100g: amount,
  fat100g: amount,
  fibre100g: amount.nullish(),
  sugars100g: amount.nullish(),
  sodiumMg100g: amount.nullish(),
  defaultUnit: Unit,
  gramsPerUnit: z.number().positive().nullish(),
});
export type IngredientInput = z.infer<typeof IngredientInput>;
export const IngredientPatch = IngredientInput.partial();
export type IngredientPatch = z.infer<typeof IngredientPatch>;
export const Ingredient = IngredientInput.extend({
  id: z.number().int(),
  source: Source,
  updatedAt: z.string(),
});
export type Ingredient = z.infer<typeof Ingredient>;

const RecipeIngredientInput = z.object({
  ingredientId: z.number().int().positive(),
  quantity: z.number().positive(),
  unit: Unit,
});
const Step = z.object({ title: name, body: z.string().trim().max(2000) });
const Tool = z.object({ name });

export const RecipeInput = z.object({
  name,
  description: z.string().trim().max(2000).nullish(),
  mealType: MealType,
  servings: z.number().int().positive(),
  difficulty: Difficulty.nullish(),
  prepMin: minutes.nullish(),
  cookMin: minutes.nullish(),
  rating: z.number().int().min(1).max(5).nullish(),
  notes: z.string().trim().max(5000).nullish(),
  // recipe_ingredient's primary key is (recipe_id, ingredient_id).
  ingredients: z.array(RecipeIngredientInput).superRefine((lines, ctx) => {
    lines.forEach((line, i) => {
      if (lines.findIndex((l) => l.ingredientId === line.ingredientId) < i)
        ctx.addIssue({
          code: "custom",
          path: [i, "ingredientId"],
          message: "Ingredient listed twice",
        });
    });
  }),
  steps: z.array(Step),
  tools: z.array(Tool),
});
export type RecipeInput = z.infer<typeof RecipeInput>;

export const Recipe = RecipeInput.extend({
  id: z.number().int(),
  photoPath: z.string().nullable(),
  updatedAt: z.string(),
  ingredients: z.array(RecipeIngredientInput.extend({ name })),
});
export type Recipe = z.infer<typeof Recipe>;

export const RecipeSummary = z.object({
  id: z.number().int(),
  name,
  mealType: MealType,
  rating: z.number().int().nullable(),
  photoPath: z.string().nullable(),
  kcalPerServing: z.number(),
  healthScore: z.number(),
  totalMin: z.number().nullable(),
});
export type RecipeSummary = z.infer<typeof RecipeSummary>;

// GET /api/recipes. Each sort puts the best first and missing values last.
export const RecipeSort = z.enum(["name", "kcal", "health", "time", "rating"]);
export type RecipeSort = z.infer<typeof RecipeSort>;
export const RecipeQuery = z.object({
  q: z.string().optional(),
  mealType: MealType.optional(),
  sort: RecipeSort.default("name"),
});

export type RecipeDetail = Recipe & {
  nutritionPerServing: Nutrition;
  healthScore: number;
  totalMin: number | null;
};
