import { serveStatic } from "@hono/node-server/serve-static";
import { Hono, type MiddlewareHandler } from "hono";
import { apiError } from "@nutrigo/shared";
import type { Db } from "./db/client.ts";
import { meta } from "./db/schema.ts";

export function createApp({
  db,
  version,
  webRoot,
}: {
  db: Db;
  version: string;
  webRoot?: string;
}) {
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

  if (webRoot) {
    // One image serves web + api (ADR-0005): built files first, then index.html for client-side routes.
    // /api/* never falls through, so an unknown API route stays a JSON 404.
    const notApi =
      (handler: MiddlewareHandler): MiddlewareHandler =>
      (c, next) =>
        c.req.path.startsWith("/api/") ? next() : handler(c, next);
    app.use("*", notApi(serveStatic({ root: webRoot })));
    app.get("*", notApi(serveStatic({ root: webRoot, path: "index.html" })));
  }

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
