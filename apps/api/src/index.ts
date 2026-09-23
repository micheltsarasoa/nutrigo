import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: createApp().fetch, port }, () =>
  console.log(`api on http://localhost:${port}`),
);
