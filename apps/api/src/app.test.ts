import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.ts";
import { freshDb } from "./test-db.ts";

afterEach(() => vi.restoreAllMocks());

const app = (db = freshDb()) => createApp({ db, version: "1.2.3" });

describe("GET /api/health", () => {
  it("returns 200 with status ok, db ok and the app version on a migrated database", async () => {
    const res = await app().request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "ok",
      db: "ok",
      version: "1.2.3",
    });
  });

  it("returns 503 with db error when the database can't be read, logging to stderr", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    const db = freshDb();
    db.$client.close();

    const res = await app(db).request("/api/health");

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      status: "error",
      db: "error",
      version: "1.2.3",
    });
    expect(stderr).toHaveBeenCalledOnce();
  });
});

describe("errors", () => {
  it("answers an unknown route with 404 NOT_FOUND", async () => {
    const res = await app().request("/api/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "No route GET /api/nope" },
    });
  });

  it("answers an unexpected error with 500 INTERNAL, logs the stack to stderr and never returns it", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    const a = app();
    a.get("/boom", () => {
      throw new Error("secret detail");
    });

    const res = await a.request("/boom");

    expect(res.status).toBe(500);
    const body = await res.text();
    expect(JSON.parse(body)).toEqual({
      error: { code: "INTERNAL", message: "Unexpected error" },
    });
    expect(body).not.toContain("secret detail");
    expect(stderr).toHaveBeenCalledOnce();
  });
});
