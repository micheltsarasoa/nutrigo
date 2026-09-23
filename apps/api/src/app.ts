import { Hono } from "hono";
import { apiError } from "@nutrigo/shared";

export function createApp() {
  const app = new Hono();
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
