import {
  healthScore,
  nutritionPerServing,
  RecipeQuery,
  totalTime,
  type RecipeDetail,
  type RecipeSort,
} from "@nutrigo/shared";
import { and, asc, eq, inArray, like, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "../db/client.ts";
import {
  ingredient,
  recipe,
  recipeIngredient,
  recipeStep,
  recipeTool,
} from "../db/schema.ts";
import { idParam, notFound, validationFailed } from "./http.ts";

// Recipes with their ordered lists and computed nutrition (SPEC-002 §5, §7).
function loadRecipes(db: Db, where?: SQL): RecipeDetail[] {
  const rows = db.select().from(recipe).where(where).all();
  const ids = rows.map((r) => r.id);
  const lines = db
    .select({ line: recipeIngredient, ingredient })
    .from(recipeIngredient)
    .innerJoin(ingredient, eq(ingredient.id, recipeIngredient.ingredientId))
    .where(inArray(recipeIngredient.recipeId, ids))
    .orderBy(asc(recipeIngredient.position))
    .all();
  const steps = db
    .select()
    .from(recipeStep)
    .where(inArray(recipeStep.recipeId, ids))
    .orderBy(asc(recipeStep.position))
    .all();
  const tools = db
    .select()
    .from(recipeTool)
    .where(inArray(recipeTool.recipeId, ids))
    .orderBy(asc(recipeTool.position))
    .all();

  return rows.map(({ notesMd, ...r }) => {
    const own = lines.filter((l) => l.line.recipeId === r.id);
    const nutrition = nutritionPerServing({
      servings: r.servings,
      ingredients: own.map((l) => ({ ...l.line, ingredient: l.ingredient })),
    });
    return {
      ...r,
      notes: notesMd,
      ingredients: own.map(({ line, ingredient: i }) => ({
        ingredientId: i.id,
        name: i.name,
        quantity: line.quantity,
        unit: line.unit,
      })),
      steps: steps
        .filter((s) => s.recipeId === r.id)
        .map(({ title, body }) => ({ title, body })),
      tools: tools
        .filter((t) => t.recipeId === r.id)
        .map(({ name }) => ({ name })),
      nutritionPerServing: nutrition,
      healthScore: healthScore(
        nutrition,
        own.map((l) => l.ingredient.category),
      ),
      totalMin: totalTime(r),
    };
  });
}

// Best first; a missing value (null) sorts last.
const SORTS: Record<RecipeSort, (r: RecipeDetail) => number | string | null> = {
  name: (r) => r.name.toLowerCase(),
  kcal: (r) => r.nutritionPerServing.kcal,
  health: (r) => -r.healthScore,
  time: (r) => r.totalMin,
  rating: (r) => (r.rating == null ? null : -r.rating),
};

export function recipeRoutes(db: Db) {
  return new Hono()
    .get("/", (c) => {
      const query = RecipeQuery.safeParse(c.req.query());
      if (!query.success) return validationFailed(c, query.error);
      const { q, mealType, sort } = query.data;
      const key = SORTS[sort];
      const list = loadRecipes(
        db,
        and(
          q ? like(recipe.name, `%${q}%`) : undefined,
          mealType ? eq(recipe.mealType, mealType) : undefined,
        ),
      ).sort((a, b) => {
        const [x, y] = [key(a), key(b)];
        if (x === y) return 0;
        if (x === null) return 1;
        if (y === null) return -1;
        return x < y ? -1 : 1;
      });
      return c.json(
        list.map((r) => ({
          id: r.id,
          name: r.name,
          mealType: r.mealType,
          rating: r.rating,
          photoPath: r.photoPath,
          kcalPerServing: r.nutritionPerServing.kcal,
          healthScore: r.healthScore,
          totalMin: r.totalMin,
        })),
      );
    })
    .get("/:id", (c) => {
      const id = idParam(c);
      const [found] = id ? loadRecipes(db, eq(recipe.id, id)) : [];
      return found ? c.json(found) : notFound(c, "Recipe");
    });
}
