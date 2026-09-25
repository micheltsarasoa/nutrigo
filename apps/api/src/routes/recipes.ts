import {
  apiError,
  healthScore,
  nutritionPerServing,
  RecipeInput,
  RecipeQuery,
  totalTime,
  type RecipeDetail,
  type RecipeSort,
} from "@nutrigo/shared";
import { and, asc, eq, inArray, like, type SQL } from "drizzle-orm";
import { Hono, type Context } from "hono";
import type { Db } from "../db/client.ts";
import {
  ingredient,
  recipe,
  recipeIngredient,
  recipeStep,
  recipeTool,
} from "../db/schema.ts";
import { idParam, notFound, parseBody, validationFailed } from "./http.ts";

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

// Checks Zod can't do: each ingredient exists, and pieces have grams per unit (toGrams needs it).
function lineErrors(db: Db, input: RecipeInput) {
  const found = db
    .select()
    .from(ingredient)
    .where(
      inArray(
        ingredient.id,
        input.ingredients.map((l) => l.ingredientId),
      ),
    )
    .all();
  const fields: Record<string, string> = {};
  input.ingredients.forEach((line, i) => {
    const ing = found.find((f) => f.id === line.ingredientId);
    if (!ing) fields[`ingredients.${i}.ingredientId`] = "not_found";
    else if (line.unit === "piece" && !ing.gramsPerUnit)
      fields[`ingredients.${i}.unit`] = "grams_per_unit_missing";
  });
  return Object.keys(fields).length ? fields : null;
}

// Replaces the recipe row and all its lists; the caller wraps it in a transaction.
function writeRecipe(
  tx: Pick<Db, "insert" | "update" | "delete">,
  input: RecipeInput,
  id?: number,
) {
  const { ingredients, steps, tools, notes, ...fields } = input;
  const values = {
    ...fields,
    notesMd: notes,
    updatedAt: new Date().toISOString(),
  };
  const row = id
    ? tx
        .update(recipe)
        .set(values)
        .where(eq(recipe.id, id))
        .returning({ id: recipe.id })
        .get()
    : tx.insert(recipe).values(values).returning({ id: recipe.id }).get();
  if (!row) return null;
  for (const table of [recipeIngredient, recipeStep, recipeTool])
    tx.delete(table).where(eq(table.recipeId, row.id)).run();
  const recipeId = row.id;
  if (ingredients.length)
    tx.insert(recipeIngredient)
      .values(ingredients.map((l, position) => ({ ...l, recipeId, position })))
      .run();
  if (steps.length)
    tx.insert(recipeStep)
      .values(steps.map((s, position) => ({ ...s, recipeId, position })))
      .run();
  if (tools.length)
    tx.insert(recipeTool)
      .values(tools.map((t, position) => ({ ...t, recipeId, position })))
      .run();
  return recipeId;
}

export function recipeRoutes(db: Db) {
  const save = async (c: Context, id?: number) => {
    const body = await parseBody(c, RecipeInput);
    if ("error" in body) return body.error;
    const fields = lineErrors(db, body.data);
    if (fields)
      return c.json(
        apiError("VALIDATION_FAILED", "Invalid ingredients", fields),
        400,
      );
    const savedId = db.transaction((tx) => writeRecipe(tx, body.data, id));
    if (!savedId) return notFound(c, "Recipe");
    return c.json(loadRecipes(db, eq(recipe.id, savedId))[0], id ? 200 : 201);
  };

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
    })
    .post("/", (c) => save(c))
    .patch("/:id", (c) => {
      const id = idParam(c);
      return id ? save(c, id) : notFound(c, "Recipe");
    })
    .delete("/:id", (c) => {
      const id = idParam(c);
      // AC-8's 409 for a planned recipe arrives with meal_entry (SPEC-003 AC-12).
      const row =
        id && db.delete(recipe).where(eq(recipe.id, id)).returning().get();
      return row ? c.body(null, 204) : notFound(c, "Recipe");
    });
}
