import { openDb } from "../src/db/client.ts";
import { parseEnv } from "../src/env.ts";

// Opening the DB applies pending migrations; the API also does this at boot.
openDb(parseEnv(process.env).DATABASE_PATH).$client.close();
