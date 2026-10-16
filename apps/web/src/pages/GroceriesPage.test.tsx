import type { ShoppingItem, ShoppingList } from "@nutrigo/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../axe.ts";
import { createSyncQueue, memoryStore } from "../sync-queue.ts";
import { GroceriesPage } from "./GroceriesPage.tsx";

const item = (over: Partial<ShoppingItem>): ShoppingItem => ({
  id: 1,
  ingredientId: 1,
  label: "Oats",
  category: "grains",
  quantity: 180,
  unit: "g",
  estCostCents: 120,
  actualCostCents: null,
  purchasedAt: null,
  updatedAt: "2026-10-01T08:00:00.000Z",
  ...over,
});
const list = (items: ShoppingItem[]): ShoppingList => ({
  isoWeek: "2026-W40",
  generatedAt: "2026-10-01T08:00:00.000Z",
  items,
  estimatedCents: items.reduce((n, i) => n + (i.estCostCents ?? 0), 0),
  actualCents: 0,
  excludedCount: items.filter((i) => i.estCostCents === null).length,
});
const ITEMS = [
  item({ id: 1 }),
  item({ id: 2, label: "Carrots", category: "veggies", estCostCents: 90 }),
  item({
    id: 3,
    label: "Kitchen paper",
    ingredientId: null,
    estCostCents: null,
  }),
];

type Call = { method: string; url: string; body: unknown };
let calls: Call[];
let routes: Record<string, (call: Call) => Response>;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

beforeEach(() => {
  calls = [];
  routes = {};
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const call = {
      method: init?.method ?? "GET",
      url,
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    };
    calls.push(call);
    const handler = routes[`${call.method} ${url}`];
    return handler
      ? handler(call)
      : json({ error: { code: "NOT_FOUND" } }, 404);
  });
});
afterEach(() => vi.unstubAllGlobals());

const W = "/api/shopping-lists/2026-W40";
const withList = (items = ITEMS) => {
  routes[`GET ${W}`] = () => json(list(items));
};
const page = (wide = true) =>
  render(<GroceriesPage isoWeek="2026-W40" wide={wide} />);

describe("GroceriesPage", () => {
  it("shows the KPIs and one row per item on desktop", async () => {
    withList();
    page();
    expect(await screen.findByLabelText("Mark Oats as bought")).toBeTruthy();
    expect(screen.getByLabelText("Mark Carrots as bought")).toBeTruthy();
    expect(screen.getByText("~€2.10")).toBeTruthy();
    expect(screen.getByText("Estimate excludes 1 item")).toBeTruthy();
  });

  it("compares the estimate with last week and says so", async () => {
    withList();
    routes["GET /api/shopping-lists/2026-W39"] = () =>
      json({ ...list([item({ estCostCents: 100 })]), isoWeek: "2026-W39" });
    page();
    expect(await screen.findByText(/\+€1\.10 vs last week/)).toBeTruthy();
    expect(screen.getByText(/\+2 vs last week/)).toBeTruthy();
  });

  it("shows the phone list below the desktop breakpoint", async () => {
    withList([
      item({ id: 1, purchasedAt: "2026-10-01T09:00:00.000Z" }),
      ITEMS[1]!,
    ]);
    page(false);
    expect(await screen.findByText("1 of 2")).toBeTruthy();
  });

  it("generates a list when the week has a plan but no list", async () => {
    routes[`GET /api/plans/2026-W40`] = () =>
      json({
        isoWeek: "2026-W40",
        days: [{ date: "2026-09-28", slots: { dinner: [{ id: 1 }] } }],
      });
    routes[`POST ${W}/generate`] = () => json(list(ITEMS));
    page();
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate list" }),
    );
    expect(await screen.findByLabelText("Mark Oats as bought")).toBeTruthy();
    expect(calls.find((c) => c.url === `${W}/generate`)?.body).toEqual({
      mode: "create",
    });
  });

  it("sends the owner to the meal plan when there is no plan", async () => {
    routes[`GET /api/plans/2026-W40`] = () =>
      json({ isoWeek: "2026-W40", days: [{ date: "2026-09-28", slots: {} }] });
    page();
    expect(await screen.findByText("No plan for week 40")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Go to meal plan" }));
    expect(location.pathname).toBe("/plan/2026-W40");
  });

  it("ticks at once and sends a patch with the time", async () => {
    withList();
    routes[`PATCH ${W}/items`] = () => json([]);
    page();
    const box = await screen.findByLabelText("Mark Oats as bought");
    fireEvent.click(box);
    expect(
      await screen.findByLabelText("Mark Oats as not bought"),
    ).toBeTruthy();
    await waitFor(() =>
      expect(calls.some((c) => c.method === "PATCH")).toBe(true),
    );
    const [sent] = calls.find((c) => c.method === "PATCH")!.body as {
      id: number;
      patch: unknown;
      updatedAt: string;
    }[];
    expect(sent).toMatchObject({ id: 1, patch: { purchased: true } });
    expect(Number.isNaN(Date.parse(sent!.updatedAt))).toBe(false);
  });

  it("saves the actual price in cents", async () => {
    withList([item({ purchasedAt: "2026-10-01T09:00:00.000Z" })]);
    routes[`PATCH ${W}/items`] = () => json([]);
    page();
    const box = await screen.findByLabelText("Actual price of Oats");
    fireEvent.change(box, { target: { value: "3,00" } });
    fireEvent.blur(box);
    await waitFor(() =>
      expect(calls.some((c) => c.method === "PATCH")).toBe(true),
    );
    expect(
      (
        calls.find((c) => c.method === "PATCH")!.body as { patch: unknown }[]
      )[0]!.patch,
    ).toEqual({
      actualCostCents: 300,
    });
  });

  it("regenerates the list", async () => {
    withList();
    routes[`POST ${W}/generate`] = () => json(list(ITEMS));
    page();
    fireEvent.click(await screen.findByRole("button", { name: "Regenerate" }));
    await waitFor(() =>
      expect(calls.find((c) => c.url === `${W}/generate`)?.body).toEqual({
        mode: "regenerate",
      }),
    );
  });

  it("adds a manual item", async () => {
    withList();
    routes[`POST ${W}/items`] = () =>
      json(
        item({
          id: 9,
          label: "Bin bags",
          ingredientId: null,
          estCostCents: null,
        }),
        201,
      );
    page();
    fireEvent.click(await screen.findByRole("button", { name: "Add item" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Bin bags" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save item" }));
    expect(
      await screen.findByLabelText("Mark Bin bags as bought"),
    ).toBeTruthy();
    expect(calls.find((c) => c.url === `${W}/items`)?.body).toMatchObject({
      label: "Bin bags",
      category: "others",
    });
  });

  it("offers a retry when the list cannot load", async () => {
    routes[`GET ${W}`] = () => json({}, 500);
    page();
    expect(await screen.findByRole("alert")).toBeTruthy();
    withList();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByLabelText("Mark Oats as bought")).toBeTruthy();
  });

  it("has no axe violations", async () => {
    withList();
    const { container } = page();
    await screen.findByLabelText("Mark Oats as bought");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("GroceriesPage offline", () => {
  const online = (on: boolean) =>
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(on);
  const freshPage = () => {
    const queue = createSyncQueue(memoryStore(), (method, to, body) =>
      fetch(to, {
        method,
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    return render(
      <GroceriesPage isoWeek="2026-W40" wide={true} queue={queue} />,
    );
  };
  afterEach(() => vi.restoreAllMocks());

  it("keeps ticks and a new item locally and counts them (AC-6)", async () => {
    online(false);
    withList();
    freshPage();
    fireEvent.click(await screen.findByLabelText("Mark Oats as bought"));
    fireEvent.click(screen.getByLabelText("Mark Carrots as bought"));
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Tape" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save item" }));
    expect(await screen.findByText("Offline · 3 changes pending")).toBeTruthy();
    expect(screen.getByText("Tape")).toBeTruthy();
    expect(screen.getByLabelText("Mark Oats as not bought")).toBeTruthy();
    expect(calls.filter((c) => c.method !== "GET")).toEqual([]);
  });

  it("sends the queue when the connection returns and clears the banner (AC-7)", async () => {
    const net = online(false);
    withList();
    routes[`PATCH ${W}/items`] = () => json([]);
    routes[`POST ${W}/items`] = () =>
      json({ ...item({ id: 9, label: "Tape", ingredientId: null }) }, 201);
    freshPage();
    fireEvent.click(await screen.findByLabelText("Mark Oats as bought"));
    await screen.findByText("Offline · 1 change pending");
    net.mockReturnValue(true);
    dispatchEvent(new Event("online"));
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.body).toMatchObject([{ id: 1, patch: { purchased: true } }]);
  });

  it("shows a sync error with Retry, and keeps the changes (AC-7 failure)", async () => {
    withList();
    routes[`PATCH ${W}/items`] = () => json({}, 500);
    freshPage();
    fireEvent.click(await screen.findByLabelText("Mark Oats as bought"));
    expect(await screen.findByRole("alert")).toBeTruthy();
    routes[`PATCH ${W}/items`] = () => json([]);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(calls.filter((c) => c.method === "PATCH")).toHaveLength(2);
  });
});
