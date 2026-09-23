import { describe, expect, it } from "vitest";
import { ApiError, apiError } from "./api-error.ts";

describe("apiError", () => {
  it("builds the error envelope from backend.md §3", () => {
    expect(apiError("NOT_FOUND", "No route GET /x")).toEqual({
      error: { code: "NOT_FOUND", message: "No route GET /x" },
    });
  });

  it("includes field errors when given", () => {
    const body = apiError("VALIDATION_FAILED", "Servings must be > 0", {
      servings: "too_small",
    });
    expect(body.error.fields).toEqual({ servings: "too_small" });
  });
});

describe("ApiError schema", () => {
  it("accepts an envelope built by apiError", () => {
    expect(
      ApiError.parse(apiError("INTERNAL", "Unexpected error")),
    ).toBeTruthy();
  });

  it("rejects an unknown error code", () => {
    expect(
      ApiError.safeParse({ error: { code: "TEAPOT", message: "no" } }).success,
    ).toBe(false);
  });
});
