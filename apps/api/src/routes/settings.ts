import { SettingsInput } from "@nutrigo/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "../db/client.ts";
import { settings } from "../db/schema.ts";
import { parseBody } from "./http.ts";

// SPEC-008 §5 (S1: locale only).
export function settingsRoutes(db: Db) {
  return new Hono()
    .get("/", (c) => {
      const row = db
        .select({ locale: settings.locale })
        .from(settings)
        .where(eq(settings.id, 1))
        .get();
      return c.json(row);
    })
    .put("/", async (c) => {
      const body = await parseBody(c, SettingsInput);
      if ("error" in body) return body.error;
      const row = db
        .update(settings)
        .set({ locale: body.data.locale })
        .where(eq(settings.id, 1))
        .returning({ locale: settings.locale })
        .get();
      return c.json(row);
    });
}
