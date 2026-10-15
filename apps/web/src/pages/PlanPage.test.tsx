import {
  type MealEntry,
  type MealType,
  type Plan,
  weekDays,
} from "@nutrigo/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { axeViolations } from "../axe.ts";
import { PlanPage } from "./PlanPage.tsx";

// jsdom has no modal dialogs yet: see SettingsDialog.test.tsx.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

const SLOTS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const recipes = [
  { id: 1, name: "Porridge", mealType: "breakfast", kcalPerServing: 300 },
  { id: 2, name: "Chicken curry", mealType: "dinner", kcalPerServing: 640 },
].map((r) => ({
  ...r,
  rating: null,
  photoPath: null,
  healthScore: 7,
  totalMin: null,
}));

type Call = { method: string; url: string; body: unknown };

// A small fake of the plan API: entries live in memory, so a refetch after a
// mutation shows what the page just did. Today is Wed 2026-09-30, in 2026-W40.
function fakeApi(initial: Partial<MealEntry>[] = []) {
  let nextId = 1;
  const entries: MealEntry[] = [];
  const add = (e: Partial<MealEntry>) => {
    const recipe = recipes.find((r) => r.id === e.recipeId)!;
    entries.push({
      id: nextId++,
      isoWeek: weekOf(e.date!),
      position: 0,
      recipeName: recipe.name,
      kcalPerServing: recipe.kcalPerServing,
      servings: 1,
      ...e,
    } as MealEntry);
  };
  const weekOf = (date: string) =>
    ["2026-W40", "2026-W41", "2026-W42"].find((w) =>
      weekDays(w).includes(date),
    )!;
  initial.forEach(add);
  const calls: Call[] = [];
  const planOf = (isoWeek: string): Plan => ({
    isoWeek,
    days: weekDays(isoWeek).map((date) => ({
      date,
      slots: Object.fromEntries(
        SLOTS.map((s) => [
          s,
          entries.filter((e) => e.date === date && e.slot === s),
        ]),
      ) as Plan["days"][number]["slots"],
    })),
  });
  const reply = (body: unknown, status = 200) =>
    Promise.resolve({
      ok: status < 400,
      status,
      json: () => Promise.resolve(body),
    });
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    calls.push({ method, url, body });
    if (url.startsWith("/api/recipes")) {
      const q = new URL(url, "http://x").searchParams.get("q") ?? "";
      return reply(
        recipes.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())),
      );
    }
    const [, , , week, kind, id] = url.split("/");
    if (kind === "copy-from") {
      if (body.mode === "replace")
        for (const e of entries.filter((e) => e.isoWeek === week))
          entries.splice(entries.indexOf(e), 1);
      for (const { id: _id, isoWeek: _w, ...e } of entries.filter(
        (e) => e.isoWeek === id,
      ))
        add({ ...e, date: weekDays(week!)[weekDays(id!).indexOf(e.date)]! });
      return reply(planOf(week!));
    }
    if (method === "POST") add(body);
    if (method === "PATCH")
      Object.assign(
        entries.find((e) => e.id === Number(id))!,
        body,
      );
    if (method === "DELETE")
      entries.splice(
        entries.findIndex((e) => e.id === Number(id)),
        1,
      );
    return method === "GET" ? reply(planOf(week!)) : reply(null, 200);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, entries };
}

beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-30T12:00:00"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
});

const button = (name: string | RegExp) => screen.getByRole("button", { name });
const mutations = (calls: Call[]) => calls.filter((c) => c.method !== "GET");

describe("PlanPage", () => {
  it("AC-1: /plan redirects to the current week and highlights today", async () => {
    fakeApi();
    history.replaceState(null, "", "/plan");
    render(<PlanPage />);
    await waitFor(() => expect(location.pathname).toBe("/plan/2026-W40"));
    expect(await screen.findByText("Sep 28 – Oct 4, 2026")).toBeTruthy();
    expect(button(/^Wed\s?30/).getAttribute("aria-current")).toBe("date");
  });

  it("AC-2: next and previous week change the URL and the label", async () => {
    fakeApi();
    history.replaceState(null, "", "/plan/2026-W40");
    render(<PlanPage isoWeek="2026-W40" />);
    await screen.findByText("Sep 28 – Oct 4, 2026");
    fireEvent.click(button("Next week"));
    expect(location.pathname).toBe("/plan/2026-W41");
    fireEvent.click(button("Previous week"));
    expect(location.pathname).toBe("/plan/2026-W40");
  });

  it("AC-3: adds a recipe to an empty slot with 1 serving", async () => {
    const { calls } = fakeApi();
    render(<PlanPage isoWeek="2026-W40" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Add lunch on Tue" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /Chicken curry/ }),
    );
    fireEvent.click(button("Add"));
    expect(
      await screen.findByRole("button", { name: /Chicken curry/ }),
    ).toBeTruthy();
    expect(mutations(calls)[0]).toMatchObject({
      method: "POST",
      url: "/api/plans/2026-W40/entries",
      body: { date: "2026-09-29", slot: "lunch", recipeId: 2, servings: 1 },
    });
  });

  it("Add meal uses the selected day and the recipe's meal type", async () => {
    const { calls } = fakeApi();
    render(<PlanPage isoWeek="2026-W40" />);
    fireEvent.click(await screen.findByRole("button", { name: /^Fri\s?2/ }));
    fireEvent.click(button("Add meal"));
    fireEvent.click(await screen.findByRole("button", { name: /Porridge/ }));
    fireEvent.click(button("Add"));
    await waitFor(() => expect(mutations(calls)).toHaveLength(1));
    expect(mutations(calls)[0]!.body).toMatchObject({
      date: "2026-10-02",
      slot: "breakfast",
      recipeId: 1,
    });
  });

  it("AC-4: changing servings doubles the kcal", async () => {
    const { calls } = fakeApi([
      { date: "2026-09-29", slot: "lunch", recipeId: 2 },
    ]);
    render(<PlanPage isoWeek="2026-W40" />);
    fireEvent.click(
      await screen.findByRole("button", { name: /Chicken curry/ }),
    );
    fireEvent.click(button("Change servings"));
    fireEvent.click(button("Increase Servings"));
    fireEvent.click(button("Save"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Chicken curry/ }).textContent,
      ).toContain("1280 kcal"),
    );
    expect(mutations(calls)[0]).toMatchObject({
      method: "PATCH",
      url: "/api/plans/2026-W40/entries/1",
      body: { servings: 2 },
    });
  });

  it("AC-5: moves a meal to another day and slot", async () => {
    const { calls } = fakeApi([
      { date: "2026-09-29", slot: "lunch", recipeId: 2 },
    ]);
    render(<PlanPage isoWeek="2026-W40" />);
    fireEvent.click(
      await screen.findByRole("button", { name: /Chicken curry/ }),
    );
    fireEvent.click(button("Move"));
    fireEvent.change(screen.getByLabelText("Day"), {
      target: { value: "2026-10-01" },
    });
    fireEvent.change(screen.getByLabelText("Slot"), {
      target: { value: "dinner" },
    });
    fireEvent.click(button("Move"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Add lunch on Tue" }),
      ).toBeTruthy(),
    );
    expect(mutations(calls)[0]).toMatchObject({
      method: "PATCH",
      body: { date: "2026-10-01", slot: "dinner" },
    });
  });

  it("AC-6: removes a meal after confirming; the slot shows + again", async () => {
    const { calls } = fakeApi([
      { date: "2026-09-29", slot: "lunch", recipeId: 2 },
    ]);
    render(<PlanPage isoWeek="2026-W40" />);
    fireEvent.click(
      await screen.findByRole("button", { name: /Chicken curry/ }),
    );
    fireEvent.click(button("Remove"));
    expect(mutations(calls)).toEqual([]);
    fireEvent.click(button("Remove"));
    expect(
      await screen.findByRole("button", { name: "Add lunch on Tue" }),
    ).toBeTruthy();
    expect(mutations(calls)[0]).toMatchObject({
      method: "DELETE",
      url: "/api/plans/2026-W40/entries/1",
    });
  });

  it("AC-7: copies the previous week into an empty one", async () => {
    const { calls } = fakeApi([
      { date: "2026-09-29", slot: "lunch", recipeId: 2 },
    ]);
    render(<PlanPage isoWeek="2026-W41" />);
    await screen.findByText("Oct 5 – 11, 2026");
    fireEvent.click(button("Copy previous week"));
    expect(
      await screen.findByRole("button", { name: /Chicken curry/ }),
    ).toBeTruthy();
    expect(mutations(calls)[0]).toMatchObject({
      method: "POST",
      url: "/api/plans/2026-W41/copy-from/2026-W40",
    });
  });

  it("AC-8: asks to replace or merge when the week has meals; Cancel changes nothing", async () => {
    const { calls } = fakeApi([
      { date: "2026-09-29", slot: "lunch", recipeId: 2 },
      { date: "2026-10-06", slot: "breakfast", recipeId: 1 },
    ]);
    render(<PlanPage isoWeek="2026-W41" />);
    await screen.findByRole("button", { name: /Porridge/ });
    fireEvent.click(button("Copy previous week"));
    expect(mutations(calls)).toEqual([]);
    fireEvent.click(button("Cancel"));
    expect(mutations(calls)).toEqual([]);
    fireEvent.click(button("Copy previous week"));
    fireEvent.click(button("Replace"));
    await waitFor(() => expect(mutations(calls)).toHaveLength(1));
    expect(mutations(calls)[0]!.body).toEqual({ mode: "replace" });
  });

  it("AC-9: stacks two recipes in a slot", async () => {
    fakeApi([
      { date: "2026-09-29", slot: "lunch", recipeId: 2, position: 0 },
      { date: "2026-09-29", slot: "lunch", recipeId: 1, position: 1 },
    ]);
    render(<PlanPage isoWeek="2026-W40" />);
    const cards = await screen.findAllByRole("button", {
      name: /Chicken curry|Porridge/,
    });
    expect(cards.map((c) => c.textContent)).toEqual([
      expect.stringContaining("Chicken curry"),
      expect.stringContaining("Porridge"),
    ]);
  });

  it("shows an error with Try again when the plan can't load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        }),
      ),
    );
    render(<PlanPage isoWeek="2026-W40" />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "load the meal plan",
    );
    fakeApi();
    fireEvent.click(button("Try again"));
    expect(await screen.findByText("Sep 28 – Oct 4, 2026")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  it("keeps the dialog and shows an error when an action fails", async () => {
    const api = fakeApi();
    render(<PlanPage isoWeek="2026-W40" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Add lunch on Tue" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /Chicken curry/ }),
    );
    const ok = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation((url, init) =>
      init?.method === "POST"
        ? Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({}),
          } as Response)
        : ok(url, init),
    );
    fireEvent.click(button("Add"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Couldn’t",
    );
    expect(api.entries).toEqual([]);
  });

  it("has no axe violations", async () => {
    fakeApi([{ date: "2026-09-29", slot: "lunch", recipeId: 2 }]);
    const { container } = render(<PlanPage isoWeek="2026-W40" />);
    await screen.findByRole("button", { name: /Chicken curry/ });
    expect(await axeViolations(container)).toEqual([]);
  });
});
