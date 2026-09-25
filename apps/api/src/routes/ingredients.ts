import { apiError, IngredientInput, IngredientPatch } from "@nutrigo/shared";
import { asc, eq, like, sql } from "drizzle-orm";
import { Hono, type Context } from "hono";
import type { Db } from "../db/client.ts";
import { ingredient, recipe, recipeIngredient } from "../db/schema.ts";
import { idParam, isUniqueViolation, notFound, parseBody } from "./http.ts";

// SPEC-002 §5.
export function ingredientRoutes(db: Db) {
  const nameTaken = (c: Context) =>
    c.json(apiError("CONFLICT", "An ingredient with this name exists"), 409);

  return new Hono()
    .get("/", (c) => {
      const q = c.req.query("q");
      const rows = db
        .select()
        .from(ingredient)
        .where(q ? like(ingredient.name, `%${q}%`) : undefined)
        .orderBy(sql`${ingredient.name} collate nocase`)
        .all();
      return c.json(rows);
    })
    .post("/", async (c) => {
      const body = await parseBody(c, IngredientInput);
      if ("error" in body) return body.error;
      try {
        const row = db
          .insert(ingredient)
          .values({
            ...body.data,
            source: "manual",
            updatedAt: new Date().toISOString(),
          })
          .returning()
          .get();
        return c.json(row, 201);
      } catch (err) {
        if (isUniqueViolation(err)) return nameTaken(c);
        throw err;
      }
    })
    .get("/:id", (c) => {
      const id = idParam(c);
      const row =
        id && db.select().from(ingredient).where(eq(ingredient.id, id)).get();
      return row ? c.json(row) : notFound(c, "Ingredient");
    })
    .patch("/:id", async (c) => {
      const id = idParam(c);
      if (!id) return notFound(c, "Ingredient");
      const body = await parseBody(c, IngredientPatch);
      if ("error" in body) return body.error;
      try {
        const row = db
          .update(ingredient)
          .set({ ...body.data, updatedAt: new Date().toISOString() })
          .where(eq(ingredient.id, id))
          .returning()
          .get();
        return row ? c.json(row) : notFound(c, "Ingredient");
      } catch (err) {
        if (isUniqueViolation(err)) return nameTaken(c);
        throw err;
      }
    })
    .delete("/:id", (c) => {
      const id = idParam(c);
      if (!id) return notFound(c, "Ingredient");
      // AC-9: name the recipes instead of surfacing the RESTRICT error.
      const users = db
        .select({ name: recipe.name })
        .from(recipeIngredient)
        .innerJoin(recipe, eq(recipe.id, recipeIngredient.recipeId))
        .where(eq(recipeIngredient.ingredientId, id))
        .orderBy(asc(recipe.name))
        .all()
        .map((r) => r.name);
      if (users.length)
        return c.json(
          apiError("CONFLICT", `Used by these recipes: ${users.join(", ")}`),
          409,
        );
      const row = db
        .delete(ingredient)
        .where(eq(ingredient.id, id))
        .returning()
        .get();
      return row ? c.body(null, 204) : notFound(c, "Ingredient");
    });
}
