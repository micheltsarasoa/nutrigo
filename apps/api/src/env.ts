import { fileURLToPath } from "node:url";
import { z } from "zod";

// The repo-root data/ folder (git-ignored); Docker sets DATABASE_PATH=/data/nutrigo.db.
const defaultDbPath = fileURLToPath(
  new URL("../../../data/nutrigo.db", import.meta.url),
);

const Env = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_PATH: z.string().min(1).default(defaultDbPath),
  // The web build to serve (Docker). Unset in dev, where Vite serves the web app.
  WEB_ROOT: z.string().min(1).optional(),
});

export const parseEnv = (env: Record<string, string | undefined>) =>
  Env.parse(env);
