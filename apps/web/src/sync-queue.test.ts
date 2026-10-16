import { beforeEach, describe, expect, it } from "vitest";
import { createSyncQueue, memoryStore } from "./sync-queue.ts";

type Call = { method: string; url: string; body: unknown };
let calls: Call[];
let reply: (call: Call) => Response;
const send = async (method: string, url: string, body?: unknown) => {
  const call = { method, url, body };
  calls.push(call);
  return reply(call);
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const patch = (id: number, at = "2026-10-01T10:00:00.000Z") => ({
  kind: "patch" as const,
  isoWeek: "2026-W40",
  id,
  patch: { purchased: true },
  updatedAt: at,
});

beforeEach(() => {
  calls = [];
  reply = () => json([]);
});

describe("sync queue", () => {
  it("counts what is waiting and survives a new queue on the same store", async () => {
    const store = memoryStore();
    await createSyncQueue(store, send).enqueue(patch(1));
    expect(await createSyncQueue(store, send).pending()).toBe(1);
  });

  it("sends all patches of a week as one batch, then empties", async () => {
    const q = createSyncQueue(memoryStore(), send);
    await q.enqueue(patch(1));
    await q.enqueue(patch(2));
    expect(await q.flush()).toEqual({ ok: true, added: 0 });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      method: "PATCH",
      url: "/api/shopping-lists/2026-W40/items",
    });
    expect((calls[0]!.body as unknown[]).length).toBe(2);
    expect(await q.pending()).toBe(0);
  });

  it("keeps everything when the network fails, and retries", async () => {
    const q = createSyncQueue(memoryStore(), send);
    await q.enqueue(patch(1));
    reply = () => {
      throw new TypeError("offline");
    };
    expect(await q.flush()).toEqual({ ok: false });
    expect(await q.pending()).toBe(1);
    reply = () => json([]);
    expect(await q.flush()).toEqual({ ok: true, added: 0 });
    expect(await q.pending()).toBe(0);
  });

  it("keeps everything on a server error", async () => {
    const q = createSyncQueue(memoryStore(), send);
    await q.enqueue(patch(1));
    reply = () => json({}, 500);
    expect(await q.flush()).toEqual({ ok: false });
    expect(await q.pending()).toBe(1);
  });

  it("drops the changes of a week whose list is gone (404)", async () => {
    const q = createSyncQueue(memoryStore(), send);
    await q.enqueue(patch(1));
    reply = () => json({}, 404);
    expect(await q.flush()).toEqual({ ok: true, added: 0 });
    expect(await q.pending()).toBe(0);
  });

  it("creates offline items first, then sends patches on them with the real id", async () => {
    const q = createSyncQueue(memoryStore(), send);
    await q.enqueue({
      kind: "add",
      isoWeek: "2026-W40",
      tempId: -5,
      input: { label: "Tape", category: "others", quantity: null, unit: null },
      updatedAt: "2026-10-01T10:00:00.000Z",
    });
    await q.enqueue(patch(-5));
    reply = (c) => (c.method === "POST" ? json({ id: 77 }, 201) : json([]));
    expect(await q.flush()).toEqual({ ok: true, added: 1 });
    expect(calls[0]).toMatchObject({
      method: "POST",
      url: "/api/shopping-lists/2026-W40/items",
      body: { label: "Tape", category: "others", quantity: null, unit: null },
    });
    expect(calls[1]!.body).toEqual([
      {
        id: 77,
        patch: { purchased: true },
        updatedAt: "2026-10-01T10:00:00.000Z",
      },
    ]);
    expect(await q.pending()).toBe(0);
  });

  it("does not create an item twice when the patch batch fails after the add", async () => {
    const q = createSyncQueue(memoryStore(), send);
    await q.enqueue({
      kind: "add",
      isoWeek: "2026-W40",
      tempId: -5,
      input: { label: "Tape", category: "others", quantity: null, unit: null },
      updatedAt: "2026-10-01T10:00:00.000Z",
    });
    await q.enqueue(patch(-5));
    reply = (c) =>
      c.method === "POST" ? json({ id: 77 }, 201) : json({}, 500);
    expect(await q.flush()).toEqual({ ok: false });
    expect(await q.pending()).toBe(1);
    reply = () => json([]);
    await q.flush();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1);
    expect((calls.at(-1)!.body as { id: number }[])[0]!.id).toBe(77);
  });
});
