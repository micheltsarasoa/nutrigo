import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import { freshDb } from "../test-db.ts";

type ErrorBody = {
  error: { code: string; message: string; fields: Record<string, string> };
};
const json = <T = ErrorBody>(res: Response) => res.json() as Promise<T>;

const setup = () => {
  const db = freshDb();
  const app = createApp({ db, version: "test" });
  const send = (method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return { db, send };
};

describe("GET /api/settings", () => {
  it("SPEC-008 AC-1: GET returns the defaults on a fresh DB", async () => {
    const { send } = setup();
    const res = await send("GET", "/api/settings");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ locale: "fr-FR" });
  });
});

describe("PUT /api/settings", () => {
  it("SPEC-008 AC-2: PUT saves en-IE and GET reads it back", async () => {
    const { send } = setup();
    const putRes = await send("PUT", "/api/settings", { locale: "en-IE" });
    expect(putRes.status).toBe(200);
    expect(await putRes.json()).toEqual({ locale: "en-IE" });
    const getRes = await send("GET", "/api/settings");
    expect(await getRes.json()).toEqual({ locale: "en-IE" });
  });

  it("PUT rejects an unknown locale with 400", async () => {
    const { send } = setup();
    const res = await send("PUT", "/api/settings", { locale: "de-DE" });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.fields.locale).toBeDefined();
    const getRes = await send("GET", "/api/settings");
    expect(await getRes.json()).toEqual({ locale: "fr-FR" });
  });

  it("PUT rejects a missing body with 400", async () => {
    const { send } = setup();
    const res = await send("PUT", "/api/settings");
    expect(res.status).toBe(400);
    expect((await json(res)).error.code).toBe("VALIDATION_FAILED");
  });
});
