import { desc, eq, gt, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../db/client.ts";
import { shoppingItem, shoppingList } from "../db/schema.ts";
import { validationFailed } from "./http.ts";

const Query = z.object({
  weeks: z.coerce.number().int().min(1).max(52).default(8),
});

// SPEC-005 §5 (AC-10): the N most recent weeks that have a list, oldest first.
// By category, an item counts at its actual price when known, else its estimate.
export function spendingRoutes(db: Db) {
  return new Hono().get("/", (c) => {
    const query = Query.safeParse(c.req.query());
    if (!query.success) return validationFailed(c, query.error);
    const recent = db
      .select({ isoWeek: shoppingList.isoWeek })
      .from(shoppingList)
      .orderBy(desc(shoppingList.isoWeek))
      .limit(query.data.weeks)
      .all()
      .map((r) => r.isoWeek);
    if (!recent.length) return c.json({ weeks: [], byCategory: [] });
    const inRecent = inArray(shoppingList.isoWeek, recent);
    const weeks = db
      .select({
        isoWeek: shoppingList.isoWeek,
        estimatedCents: sql<number>`coalesce(sum(${shoppingItem.estCostCents}), 0)`,
        actualCents: sql<number>`coalesce(sum(${shoppingItem.actualCostCents}), 0)`,
      })
      .from(shoppingList)
      .leftJoin(shoppingItem, eq(shoppingItem.listId, shoppingList.id))
      .where(inRecent)
      .groupBy(shoppingList.isoWeek)
      .orderBy(shoppingList.isoWeek)
      .all();
    const cents = sql<number>`sum(coalesce(${shoppingItem.actualCostCents}, ${shoppingItem.estCostCents}, 0))`;
    const byCategory = db
      .select({ category: shoppingItem.category, cents })
      .from(shoppingItem)
      .innerJoin(shoppingList, eq(shoppingList.id, shoppingItem.listId))
      .where(inRecent)
      .groupBy(shoppingItem.category)
      .having(gt(cents, 0))
      .orderBy(desc(cents), shoppingItem.category)
      .all();
    return c.json({ weeks, byCategory });
  });
}
