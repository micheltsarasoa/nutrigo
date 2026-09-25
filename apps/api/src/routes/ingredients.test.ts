import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import { freshDb } from "../test-db.ts";

const oats = {
  name: "Oats",
  category: "grains",
  kcal100g: 389,
  carbs100g: 66,
  protein100g: 17,
  fat100g: 7,
  defaultUnit: "g",
};

const setup = () => {
  const db = freshDb();
  const app = createApp({ db, version: "test" });
  const send = (method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const create = async (body: object = oats) =>
    (await (await send("POST", "/api/ingredients", body)).json()) as {
      id: number;
    };
  return { db, send, create };
};

describe("POST /api/ingredients", () => {
  it("SPEC-002 AC-1: creates Oats with source manual and returns 201", async () => {
    const { send } = setup();
    const res = await send("POST", "/api/ingredients", oats);
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      ...oats,
      id: expect.any(Number),
      source: "manual",
    });
  });

  it("SPEC-002 AC-2: returns 400 with field errors for a negative value or a missing kcal, and saves nothing", async () => {
    const { send } = setup();
    const res = await send("POST", "/api/ingredients", {
      ...oats,
      kcal100g: undefined,
      fat100g: -1,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(body.error.fields)).toEqual(["kcal100g", "fat100g"]);
    expect(await (await send("GET", "/api/ingredients")).json()).toEqual([]);
  });

  it("returns 400 for a body that isn't JSON", async () => {
    const { send } = setup();
    const res = await send("POST", "/api/ingredients");
    expect(res.status).toBe(400);
  });

  it("returns 409 when the name exists", async () => {
    const { send, create } = setup();
    await create();
    const res = await send("POST", "/api/ingredients", oats);
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("CONFLICT");
  });
});

describe("GET /api/ingredients", () => {
  it("lists by name and filters with ?q=, case-insensitive", async () => {
    const { send, create } = setup();
    await create({ ...oats, name: "Rice" });
    await create();
    const all = await (await send("GET", "/api/ingredients")).json();
    expect(all.map((i: { name: string }) => i.name)).toEqual(["Oats", "Rice"]);
    const some = await (await send("GET", "/api/ingredients?q=OA")).json();
    expect(some.map((i: { name: string }) => i.name)).toEqual(["Oats"]);
  });
});

describe("GET, PATCH and DELETE /api/ingredients/:id", () => {
  it("reads one ingredient", async () => {
    const { send, create } = setup();
    const { id } = await create();
    const res = await send("GET", `/api/ingredients/${id}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject(oats);
  });

  it("patches some fields and keeps the others", async () => {
    const { send, create } = setup();
    const { id } = await create();
    const res = await send("PATCH", `/api/ingredients/${id}`, {
      kcal100g: 380,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ...oats, kcal100g: 380 });
  });

  it("returns 400 for an invalid patch and 409 for a taken name", async () => {
    const { send, create } = setup();
    const { id } = await create();
    await create({ ...oats, name: "Rice" });
    expect(
      (await send("PATCH", `/api/ingredients/${id}`, { kcal100g: -1 })).status,
    ).toBe(400);
    expect(
      (await send("PATCH", `/api/ingredients/${id}`, { name: "Rice" })).status,
    ).toBe(409);
  });

  it("deletes an unused ingredient with 204", async () => {
    const { send, create } = setup();
    const { id } = await create();
    expect((await send("DELETE", `/api/ingredients/${id}`)).status).toBe(204);
    expect((await send("GET", `/api/ingredients/${id}`)).status).toBe(404);
  });

  it("SPEC-002 AC-9: returns 409 listing the recipes that use it, and keeps it", async () => {
    const { db, send, create } = setup();
    const { id } = await create();
    for (const [rid, name] of [
      [1, "Porridge"],
      [2, "Granola"],
    ] as const) {
      db.$client
        .prepare(
          "insert into recipe (id, name, meal_type, servings, updated_at) values (?, ?, 'breakfast', 1, 'x')",
        )
        .run(rid, name);
      db.$client
        .prepare("insert into recipe_ingredient values (?, ?, 50, 'g', 0)")
        .run(rid, id);
    }
    const res = await send("DELETE", `/api/ingredients/${id}`);
    expect(res.status).toBe(409);
    expect((await res.json()).error.message).toBe(
      "Used by 2 recipes: Granola, Porridge",
    );
    expect((await send("GET", `/api/ingredients/${id}`)).status).toBe(200);
  });

  it.each([
    ["GET", undefined],
    ["PATCH", { kcal100g: 1 }],
    ["DELETE", undefined],
  ])("%s returns 404 for an unknown or malformed id", async (method, body) => {
    const { send } = setup();
    expect((await send(method, "/api/ingredients/999", body)).status).toBe(404);
    expect((await send(method, "/api/ingredients/abc", body)).status).toBe(404);
  });
});
