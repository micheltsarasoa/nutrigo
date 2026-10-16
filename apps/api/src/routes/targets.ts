import { Targets } from "@nutrigo/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "../db/client.ts";
import { targets } from "../db/schema.ts";
import { parseBody } from "./http.ts";

// SPEC-004 §5. One row (id 1); GET answers 200 null until it is saved (AC-6).
export function targetsRoutes(db: Db) {
  const read = () => {
    const r = db.select().from(targets).where(eq(targets.id, 1)).get();
    return r
      ? { kcal: r.kcal, carbs: r.carbsG, protein: r.proteinG, fat: r.fatG }
      : null;
  };
  return new Hono()
    .get("/", (c) => c.json(read()))
    .put("/", async (c) => {
      const body = await parseBody(c, Targets);
      if ("error" in body) return body.error;
      const { kcal, carbs = null, protein = null, fat = null } = body.data;
      const row = { kcal, carbsG: carbs, proteinG: protein, fatG: fat };
      db.insert(targets)
        .values({ id: 1, ...row })
        .onConflictDoUpdate({ target: targets.id, set: row })
        .run();
      return c.json(read());
    });
}
