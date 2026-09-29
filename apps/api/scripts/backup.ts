import { backupDb } from "../src/db/backup.ts";
import { parseEnv } from "../src/env.ts";

console.log(
  `backup written to ${await backupDb(parseEnv(process.env).DATABASE_PATH)}`,
);
