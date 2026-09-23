import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "./db/client.ts";

// A fresh SQLite file with every migration applied (testing strategy §2).
export const freshDb = () =>
  openDb(join(mkdtempSync(join(tmpdir(), "nutrigo-")), "test.db"));
