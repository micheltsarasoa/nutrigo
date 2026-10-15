import {
  CopyMode,
  IsoWeek,
  MealEntryInput,
  MealEntryPatch,
  apiError,
  copyWeek,
  weekDays,
  type MealEntry,
} from "@nutrigo/shared";
import { and, asc, eq, inArray, max, ne, type SQL } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Db } from "../db/client.ts";
import { mealEntry, planWeek, recipe } from "../db/schema.ts";
import { loadRecipes } from "./recipes.ts";
import { idParam, notFound, parseBody } from "./http.ts";

const SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;
const bad = (c: Context, field: string, message: string) =>
  c.json(apiError("VALIDATION_FAILED", message, { [field]: message }), 400);

// SPEC-003 §5. Each entry carries its recipe's name and kcal per serving, so the grid needs no second fetch.
export function planRoutes(db: Db) {
  const entries = (where: SQL): MealEntry[] => {
    const rows = db
      .select()
      .from(mealEntry)
      .where(where)
      .orderBy(asc(mealEntry.position), asc(mealEntry.id))
      .all();
    const recipes = new Map(
      loadRecipes(
        db,
        inArray(
          recipe.id,
          rows.map((r) => r.recipeId),
        ),
      ).map((r) => [r.id, r]),
    );
    return rows.map((r) => ({
      ...r,
      recipeName: recipes.get(r.recipeId)?.name ?? "",
      kcalPerServing: recipes.get(r.recipeId)?.nutritionPerServing.kcal ?? 0,
    }));
  };
  const one = (id: number) => entries(eq(mealEntry.id, id))[0];
  const weekParam = (c: Context) => {
    const week = IsoWeek.safeParse(c.req.param("isoWeek"));
    return week.success ? week.data : null;
  };
  const badWeek = (c: Context) => bad(c, "isoWeek", "Invalid ISO week");

  // Rewrites the positions of one slot with `id` at `index` (the end when omitted).
  const place = (
    id: number,
    date: string,
    slot: (typeof SLOTS)[number],
    index?: number,
  ) => {
    const ids = db
      .select({ id: mealEntry.id })
      .from(mealEntry)
      .where(
        and(
          eq(mealEntry.date, date),
          eq(mealEntry.slot, slot),
          ne(mealEntry.id, id),
        ),
      )
      .orderBy(asc(mealEntry.position), asc(mealEntry.id))
      .all()
      .map((r) => r.id);
    ids.splice(index ?? ids.length, 0, id);
    ids.forEach((entryId, position) =>
      db
        .update(mealEntry)
        .set({ position })
        .where(eq(mealEntry.id, entryId))
        .run(),
    );
  };

  const plan = (isoWeek: string) => {
    const all = entries(eq(mealEntry.isoWeek, isoWeek));
    return {
      isoWeek,
      days: weekDays(isoWeek).map((date) => ({
        date,
        slots: Object.fromEntries(
          SLOTS.map((slot) => [
            slot,
            all.filter((e) => e.date === date && e.slot === slot),
          ]),
        ),
      })),
    };
  };

  // Adds the entry at the end of its slot; the week row is created on the first one.
  const append = (
    tx: Pick<Db, "insert" | "select">,
    v: MealEntryInput & { isoWeek: string },
  ) => {
    tx.insert(planWeek)
      .values({ isoWeek: v.isoWeek })
      .onConflictDoNothing()
      .run();
    const last = tx
      .select({ n: max(mealEntry.position) })
      .from(mealEntry)
      .where(and(eq(mealEntry.date, v.date), eq(mealEntry.slot, v.slot)))
      .get();
    return tx
      .insert(mealEntry)
      .values({ ...v, position: (last?.n ?? -1) + 1 })
      .returning({ id: mealEntry.id })
      .get().id;
  };

  return new Hono()
    .get("/:isoWeek", (c) => {
      const isoWeek = weekParam(c);
      return isoWeek ? c.json(plan(isoWeek)) : badWeek(c);
    })
    .post("/:isoWeek/entries", async (c) => {
      const isoWeek = weekParam(c);
      if (!isoWeek) return badWeek(c);
      const body = await parseBody(c, MealEntryInput);
      if ("error" in body) return body.error;
      const { date, slot, recipeId, servings } = body.data;
      if (!weekDays(isoWeek).includes(date))
        return bad(c, "date", "Date is outside the week");
      if (!db.select().from(recipe).where(eq(recipe.id, recipeId)).get())
        return notFound(c, "Recipe");
      const id = db.transaction((tx) =>
        append(tx, { isoWeek, date, slot, recipeId, servings }),
      );
      return c.json(one(id), 201);
    })
    .patch("/:isoWeek/entries/:id", async (c) => {
      const isoWeek = weekParam(c);
      if (!isoWeek) return badWeek(c);
      const id = idParam(c);
      const current = id && one(id);
      if (!current || current.isoWeek !== isoWeek)
        return notFound(c, "Meal entry");
      const body = await parseBody(c, MealEntryPatch);
      if ("error" in body) return body.error;
      const { date = current.date, slot = current.slot } = body.data;
      if (!weekDays(isoWeek).includes(date))
        return bad(c, "date", "Date is outside the week");
      db.transaction(() => {
        db.update(mealEntry)
          .set({ date, slot, servings: body.data.servings ?? current.servings })
          .where(eq(mealEntry.id, current.id))
          .run();
        const moved = date !== current.date || slot !== current.slot;
        if (moved || body.data.position !== undefined)
          place(current.id, date, slot, body.data.position);
      });
      return c.json(one(current.id));
    })
    .post("/:isoWeek/copy-from/:otherWeek", async (c) => {
      const to = weekParam(c);
      const from = IsoWeek.safeParse(c.req.param("otherWeek"));
      if (!to || !from.success) return badWeek(c);
      const body = await parseBody(c, z.object({ mode: CopyMode }));
      if ("error" in body) return body.error;
      if (from.data === to) return bad(c, "otherWeek", "Pick another week");
      const source = entries(eq(mealEntry.isoWeek, from.data));
      if (!source.length) return notFound(c, "Source week");
      const target = entries(eq(mealEntry.isoWeek, to));
      const { remove, add } = copyWeek(
        source,
        from.data,
        to,
        target,
        body.data.mode,
      );
      db.transaction((tx) => {
        tx.delete(mealEntry).where(inArray(mealEntry.id, remove)).run();
        for (const entry of add) append(tx, { ...entry, isoWeek: to });
      });
      return c.json(plan(to));
    })
    .delete("/:isoWeek/entries/:id", (c) => {
      const isoWeek = weekParam(c);
      if (!isoWeek) return badWeek(c);
      const id = idParam(c);
      const row =
        id &&
        db
          .delete(mealEntry)
          .where(and(eq(mealEntry.id, id), eq(mealEntry.isoWeek, isoWeek)))
          .returning()
          .get();
      return row ? c.body(null, 204) : notFound(c, "Meal entry");
    });
}
