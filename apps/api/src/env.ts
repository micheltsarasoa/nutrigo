import { fileURLToPath } from "node:url";
import { z } from "zod";

// The repo-root data/ folder (git-ignored); Docker sets DATABASE_PATH=/data/nutrigo.db.
const defaultDbPath = fileURLToPath(
  new URL("../../../data/nutrigo.db", import.meta.url),
);

const Env = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_PATH: z.string().min(1).default(defaultDbPath),
});

export const parseEnv = (env: Record<string, string | undefined>) =>
  Env.parse(env);
