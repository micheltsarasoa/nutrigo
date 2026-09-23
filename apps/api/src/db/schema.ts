import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// The only table in Sprint 0 (SPEC-001 §6). /api/health reads it to prove migrations ran.
export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
