import {
  IsoDate,
  IsoWeek,
  dayNutrition,
  nextMealId,
  weekNutrition,
  type Targets,
} from "@nutrigo/shared";
import { eq, inArray, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "../db/client.ts";
import { mealEntry, recipe, targets } from "../db/schema.ts";
import { validationFailed } from "./http.ts";
import { loadRecipes } from "./recipes.ts";
import { z } from "zod";

// SPEC-004 §5. The week answer also carries the kcal target (null until saved, AC-6).
export function nutritionRoutes(db: Db, now: () => Date = () => new Date()) {
  const load = (where: SQL) => {
    const entries = db.select().from(mealEntry).where(where).all();
    const ids = [...new Set(entries.map((e) => e.recipeId))];
    const recipes = Object.fromEntries(
      loadRecipes(db, inArray(recipe.id, ids)).map((r) => [
        r.id,
        r.nutritionPerServing,
      ]),
    );
    const row = db.select().from(targets).where(eq(targets.id, 1)).get();
    const goal: Targets | null = row
      ? {
          kcal: row.kcal,
          carbs: row.carbsG,
          protein: row.proteinG,
          fat: row.fatG,
        }
      : null;
    return { entries, recipes, goal };
  };
  const param = <T extends z.ZodType>(schema: T, v: string) =>
    z.object({ v: schema }).safeParse({ v });

  return new Hono()
    .get("/day/:date", (c) => {
      const p = param(IsoDate, c.req.param("date"));
      if (!p.success) return validationFailed(c, p.error);
      const { entries, recipes, goal } = load(eq(mealEntry.date, p.data.v));
      const at = now();
      const local = new Date(at.getTime() - at.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16); // the server's local "YYYY-MM-DDTHH:MM"
      return c.json({
        ...dayNutrition(entries, recipes, goal),
        nextMealId: nextMealId(entries, local),
      });
    })
    .get("/week/:isoWeek", (c) => {
      const p = param(IsoWeek, c.req.param("isoWeek"));
      if (!p.success) return validationFailed(c, p.error);
      const { entries, recipes, goal } = load(eq(mealEntry.isoWeek, p.data.v));
      const at = now();
      const today = new Date(at.getTime() - at.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      return c.json({
        ...weekNutrition(entries, recipes, p.data.v, today),
        target: goal?.kcal ?? null,
      });
    });
}
