import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { freshDb } from "./test-db.ts";

// A fake web build: index.html plus one hashed asset.
function webBuild() {
  const root = mkdtempSync(join(tmpdir(), "nutrigo-web-"));
  mkdirSync(join(root, "assets"));
  writeFileSync(
    join(root, "index.html"),
    "<!doctype html><h1>NutriGo shell</h1>",
  );
  writeFileSync(join(root, "assets", "app-123.js"), "console.log('app')");
  return root;
}

const app = (webRoot?: string) =>
  createApp({ db: freshDb(), version: "1.2.3", webRoot });

describe("serving the web build (ADR-0005: one image serves web + api)", () => {
  it("serves index.html at /", async () => {
    const res = await app(webBuild()).request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("NutriGo shell");
  });

  it("serves built assets", async () => {
    const res = await app(webBuild()).request("/assets/app-123.js");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("console.log('app')");
  });

  it("falls back to index.html for client-side routes", async () => {
    const res = await app(webBuild()).request("/recipes/12");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("NutriGo shell");
  });

  it("never serves the shell for an unknown /api route", async () => {
    const res = await app(webBuild()).request("/api/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "No route GET /api/nope" },
    });
  });

  it("still answers /api/health", async () => {
    expect(
      await (await app(webBuild()).request("/api/health")).json(),
    ).toMatchObject({ status: "ok" });
  });

  it("serves nothing but the API when no web root is configured (dev: Vite serves the web)", async () => {
    expect((await app().request("/")).status).toBe(404);
  });
});
