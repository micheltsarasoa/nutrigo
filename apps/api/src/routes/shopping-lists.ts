import {
  GenerateInput,
  IsoWeek,
  ItemPatchBatch,
  ShoppingItemInput,
  apiError,
  buildList,
  estimateCost,
  regenerate,
  resolveConflict,
  type ListItem,
  type ShoppingList,
} from "@nutrigo/shared";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Hono, type Context } from "hono";
import type { Db } from "../db/client.ts";
import {
  ingredient,
  mealEntry,
  recipe,
  recipeIngredient,
  shoppingItem,
  shoppingList,
} from "../db/schema.ts";
import { idParam, notFound, parseBody } from "./http.ts";

type Row = typeof shoppingItem.$inferSelect;
const asItem = (r: Row): ListItem => ({
  id: r.id,
  ingredientId: r.ingredientId,
  label: r.label,
  category: r.category,
  quantity: r.quantity,
  unit: r.unit,
  estCostCents: r.estCostCents,
  actualCostCents: r.actualCostCents,
  purchasedAt: r.purchasedAt,
  updatedAt: r.updatedAt,
});

const asRow = (i: ListItem) => ({
  ingredientId: i.ingredientId,
  label: i.label,
  category: i.category,
  quantity: i.quantity,
  unit: i.unit,
  estCostCents: i.estCostCents,
  actualCostCents: i.actualCostCents,
  purchasedAt: i.purchasedAt,
  updatedAt: i.updatedAt,
});

// SPEC-005 §5. The estimate is frozen at generation; the "no longer in plan" flag is derived from the current plan.
export function shoppingListRoutes(db: Db, now: () => Date = () => new Date()) {
  const weekParam = (c: Context) => {
    const week = IsoWeek.safeParse(c.req.param("isoWeek"));
    return week.success ? week.data : null;
  };
  const badWeek = (c: Context) =>
    c.json(
      apiError("VALIDATION_FAILED", "Invalid ISO week", {
        isoWeek: "Invalid ISO week",
      }),
      400,
    );
  const listOf = (isoWeek: string) =>
    db
      .select()
      .from(shoppingList)
      .where(eq(shoppingList.isoWeek, isoWeek))
      .get();
  const rowsOf = (listId: number) =>
    db
      .select()
      .from(shoppingItem)
      .where(eq(shoppingItem.listId, listId))
      .orderBy(asc(shoppingItem.id))
      .all();

  /** What the week's plan needs now, with the frozen-at-generation estimate. */
  const planned = (isoWeek: string) => {
    const entries = db
      .select({ recipeId: mealEntry.recipeId, servings: mealEntry.servings })
      .from(mealEntry)
      .where(eq(mealEntry.isoWeek, isoWeek))
      .all();
    if (!entries.length) return null;
    const recipes = db
      .select()
      .from(recipe)
      .where(
        inArray(
          recipe.id,
          entries.map((e) => e.recipeId),
        ),
      )
      .all();
    const lines = db
      .select({ line: recipeIngredient, ingredient })
      .from(recipeIngredient)
      .innerJoin(ingredient, eq(ingredient.id, recipeIngredient.ingredientId))
      .where(
        inArray(
          recipeIngredient.recipeId,
          recipes.map((r) => r.id),
        ),
      )
      .orderBy(asc(recipeIngredient.position))
      .all();
    const ingredients = new Map(
      lines.map((l) => [l.ingredient.id, l.ingredient]),
    );
    return buildList(
      entries,
      recipes.map((r) => ({
        id: r.id,
        servings: r.servings,
        lines: lines
          .filter((l) => l.line.recipeId === r.id)
          .map((l) => ({
            ingredient: l.ingredient,
            quantity: l.line.quantity,
            unit: l.line.unit,
          })),
      })),
    ).map((item) => ({
      ...item,
      estCostCents: estimateCost(
        item.quantity,
        item.unit,
        ingredients.get(item.ingredientId)!,
      ),
    }));
  };

  const body = (isoWeek: string): ShoppingList | null => {
    const list = listOf(isoWeek);
    if (!list) return null;
    const inPlan = new Set(
      (planned(isoWeek) ?? []).map((i) => `${i.ingredientId}/${i.unit}`),
    );
    const items = rowsOf(list.id).map((row) => ({
      ...asItem(row),
      id: row.id,
      ...(row.ingredientId !== null &&
      row.purchasedAt &&
      !inPlan.has(`${row.ingredientId}/${row.unit}`)
        ? { noLongerInPlan: true }
        : {}),
    }));
    const sum = (key: "estCostCents" | "actualCostCents") =>
      items.reduce((n, i) => n + (i[key] ?? 0), 0);
    return {
      isoWeek,
      generatedAt: list.generatedAt,
      items,
      estimatedCents: sum("estCostCents"),
      actualCents: sum("actualCostCents"),
      excludedCount: items.filter((i) => i.estCostCents === null).length,
    };
  };

  return new Hono()
    .post("/:isoWeek/generate", async (c) => {
      const isoWeek = weekParam(c);
      if (!isoWeek) return badWeek(c);
      const input = await parseBody(c, GenerateInput);
      if ("error" in input) return input.error;
      const fresh = planned(isoWeek);
      if (!fresh) return notFound(c, "Plan");
      const existing = listOf(isoWeek);
      if (existing && input.data.mode === "create")
        return c.json(
          apiError("CONFLICT", "A list already exists for this week"),
          409,
        );
      const at = now().toISOString();
      db.transaction((tx) => {
        if (!existing) {
          const { id: listId } = tx
            .insert(shoppingList)
            .values({ isoWeek, generatedAt: at })
            .returning({ id: shoppingList.id })
            .get();
          for (const item of fresh)
            tx.insert(shoppingItem)
              .values({ ...item, listId, updatedAt: at })
              .run();
          return;
        }
        const old = rowsOf(existing.id).map(asItem);
        const next = regenerate(old, fresh);
        const keep = new Set(next.map((i) => i.id));
        const gone = old.flatMap((o) => (keep.has(o.id) ? [] : [o.id!]));
        if (gone.length)
          tx.delete(shoppingItem).where(inArray(shoppingItem.id, gone)).run();
        for (const item of next) {
          if (item.id === undefined)
            tx.insert(shoppingItem)
              .values({ ...asRow(item), listId: existing.id })
              .run();
          else
            tx.update(shoppingItem)
              .set({
                quantity: item.quantity,
                estCostCents: item.estCostCents,
              })
              .where(eq(shoppingItem.id, item.id))
              .run();
        }
      });
      return c.json(body(isoWeek));
    })
    .get("/:isoWeek", (c) => {
      const isoWeek = weekParam(c);
      if (!isoWeek) return badWeek(c);
      const list = body(isoWeek);
      return list ? c.json(list) : notFound(c, "Shopping list");
    })
    .post("/:isoWeek/items", async (c) => {
      const isoWeek = weekParam(c);
      if (!isoWeek) return badWeek(c);
      const input = await parseBody(c, ShoppingItemInput);
      if ("error" in input) return input.error;
      const list = listOf(isoWeek);
      if (!list) return notFound(c, "Shopping list");
      const row = db
        .insert(shoppingItem)
        .values({
          ...input.data,
          listId: list.id,
          updatedAt: now().toISOString(),
        })
        .returning()
        .get();
      return c.json(asItem(row), 201);
    })
    .patch("/:isoWeek/items", async (c) => {
      const isoWeek = weekParam(c);
      if (!isoWeek) return badWeek(c);
      const input = await parseBody(c, ItemPatchBatch);
      if ("error" in input) return input.error;
      const list = listOf(isoWeek);
      if (!list) return notFound(c, "Shopping list");
      // Last-write-wins per item (AC-8); ids of other weeks or deleted items are skipped.
      const resolved = db.transaction((tx) =>
        input.data.flatMap(({ id, patch, updatedAt }) => {
          const row = tx
            .select()
            .from(shoppingItem)
            .where(
              and(eq(shoppingItem.id, id), eq(shoppingItem.listId, list.id)),
            )
            .get();
          if (!row) return [];
          const stored = asItem(row);
          const incoming: ListItem = {
            ...stored,
            quantity: patch.quantity ?? stored.quantity,
            actualCostCents:
              patch.actualCostCents === undefined
                ? stored.actualCostCents
                : patch.actualCostCents,
            purchasedAt:
              patch.purchased === undefined
                ? stored.purchasedAt
                : patch.purchased
                  ? updatedAt
                  : null,
            updatedAt,
          };
          const winner = resolveConflict(stored, incoming);
          if (winner !== stored)
            tx.update(shoppingItem)
              .set({
                quantity: winner.quantity,
                actualCostCents: winner.actualCostCents,
                purchasedAt: winner.purchasedAt,
                updatedAt: winner.updatedAt,
              })
              .where(eq(shoppingItem.id, id))
              .run();
          return [winner];
        }),
      );
      return c.json(resolved);
    })
    .delete("/:isoWeek/items/:id", (c) => {
      const isoWeek = weekParam(c);
      if (!isoWeek) return badWeek(c);
      const id = idParam(c);
      const list = listOf(isoWeek);
      const gone =
        id && list
          ? db
              .delete(shoppingItem)
              .where(
                and(eq(shoppingItem.id, id), eq(shoppingItem.listId, list.id)),
              )
              .returning({ id: shoppingItem.id })
              .all()
          : [];
      return gone.length ? c.body(null, 204) : notFound(c, "Item");
    });
}
