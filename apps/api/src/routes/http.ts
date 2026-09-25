import { apiError } from "@nutrigo/shared";
import type { Context } from "hono";
import type { z } from "zod";

// Shared by the route files: body validation (backend.md §3), ids and SQLite errors.
export async function parseBody<T extends z.ZodType>(
  c: Context,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: Response }> {
  const result = schema.safeParse(await c.req.json().catch(() => undefined));
  if (result.success) return { data: result.data };
  const fields = Object.fromEntries(
    result.error.issues.map((i) => [i.path.join("."), i.code]),
  );
  return {
    error: c.json(apiError("VALIDATION_FAILED", "Invalid input", fields), 400),
  };
}

/** The `:id` param as a positive integer, or null (then the route answers 404). */
export function idParam(c: Context) {
  const id = Number(c.req.param("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const notFound = (c: Context, what: string) =>
  c.json(apiError("NOT_FOUND", `${what} not found`), 404);

export const isUniqueViolation = (err: unknown) =>
  (err as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE";
