import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.ts";

afterEach(() => vi.restoreAllMocks());

describe("createApp", () => {
  it("answers an unknown route with 404 NOT_FOUND", async () => {
    const res = await createApp().request("/api/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "No route GET /api/nope" },
    });
  });

  it("answers an unexpected error with 500 INTERNAL, logs the stack to stderr and never returns it", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createApp();
    app.get("/boom", () => {
      throw new Error("secret detail");
    });

    const res = await app.request("/boom");

    expect(res.status).toBe(500);
    const body = await res.text();
    expect(JSON.parse(body)).toEqual({
      error: { code: "INTERNAL", message: "Unexpected error" },
    });
    expect(body).not.toContain("secret detail");
    expect(stderr).toHaveBeenCalledOnce();
  });
});
