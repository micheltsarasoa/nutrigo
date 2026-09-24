import { readFileSync } from "node:fs";
import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { openDb } from "./db/client.ts";
import { parseEnv } from "./env.ts";

// One version for the whole app (ADR-0005); release-please bumps the root package.json.
const { version } = JSON.parse(
  readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
);
const env = parseEnv(process.env);
const app = createApp({
  db: openDb(env.DATABASE_PATH),
  version,
  webRoot: env.WEB_ROOT,
});

serve({ fetch: app.fetch, port: env.PORT }, () =>
  console.log(`api on http://localhost:${env.PORT}`),
);
