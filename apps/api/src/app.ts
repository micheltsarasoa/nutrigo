import { Hono } from "hono";
import { apiError } from "@nutrigo/shared";
import type { Db } from "./db/client.ts";
import { meta } from "./db/schema.ts";

export function createApp({ db, version }: { db: Db; version: string }) {
  const app = new Hono();

  app.get("/api/health", (c) => {
    try {
      db.select().from(meta).limit(1).all();
      return c.json({ status: "ok", db: "ok", version });
    } catch (err) {
      console.error(err);
      return c.json({ status: "error", db: "error", version }, 503);
    }
  });

  app.notFound((c) =>
    c.json(
      apiError("NOT_FOUND", `No route ${c.req.method} ${c.req.path}`),
      404,
    ),
  );
  app.onError((err, c) => {
    console.error(err); // stderr only (CLAUDE.md rule 8)
    return c.json(apiError("INTERNAL", "Unexpected error"), 500);
  });
  return app;
}
