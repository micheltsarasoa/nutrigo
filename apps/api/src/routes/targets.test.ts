import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import { freshDb } from "../test-db.ts";

const setup = () => {
  const app = createApp({ db: freshDb(), version: "test" });
  return (method: string, body?: unknown) =>
    app.request("/api/targets", {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
};

describe("/api/targets", () => {
  it("SPEC-004 AC-6: GET with nothing saved returns 200 null", async () => {
    const res = await setup()("GET");
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });

  it("SPEC-004 AC-7: PUT then GET returns the saved targets", async () => {
    const send = setup();
    const targets = { kcal: 2990, carbs: 325, protein: 75, fat: 44 };
    const put = await send("PUT", targets);
    expect(put.status).toBe(200);
    expect(await put.json()).toEqual(targets);
    expect(await (await send("GET")).json()).toEqual(targets);
  });

  it("PUT overwrites the previous targets", async () => {
    const send = setup();
    await send("PUT", { kcal: 2990, carbs: 325, protein: 75, fat: 44 });
    await send("PUT", { kcal: 2000, carbs: 200, protein: 60, fat: 30 });
    expect(await (await send("GET")).json()).toEqual({
      kcal: 2000,
      carbs: 200,
      protein: 60,
      fat: 30,
    });
  });

  it("PUT with a cleared macro stores null", async () => {
    const send = setup();
    await send("PUT", { kcal: 2990, carbs: 325, protein: 75, fat: 44 });
    await send("PUT", { kcal: 2990, carbs: 325, protein: null });
    expect(await (await send("GET")).json()).toEqual({
      kcal: 2990,
      carbs: 325,
      protein: null,
      fat: null,
    });
  });

  it.each([
    ["negative macro", { kcal: 2000, carbs: -1 }],
    ["non-numeric macro", { kcal: 2000, fat: "lots" }],
    ["non-numeric kcal", { kcal: "2000" }],
    ["kcal zero", { kcal: 0 }],
    ["kcal missing", { carbs: 100 }],
  ])("PUT rejects %s with 400 and saves nothing", async (_n, body) => {
    const send = setup();
    const res = await send("PUT", body);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
      "VALIDATION_FAILED",
    );
    expect(await (await send("GET")).json()).toBeNull();
  });
});
