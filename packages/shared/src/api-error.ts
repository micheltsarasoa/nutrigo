import { z } from "zod";

export const ErrorCode = z.enum([
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "CONFLICT",
  "UPSTREAM_FAILED",
  "INTERNAL",
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ApiError = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;

export function apiError(
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>,
): ApiError {
  return { error: fields ? { code, message, fields } : { code, message } };
}
