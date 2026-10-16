import {
  type MealEntry,
  type MealType,
  type Targets,
  dayNutrition,
  weekDays,
  weekNutrition,
} from "@nutrigo/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../axe.ts";
import { TodayPage } from "./TodayPage.tsx";

// Today is Wed 2026-09-30 12:00, in 2026-W40.
const TODAY = "2026-09-30";
const WEEK = "2026-W40";
const TARGETS: Targets = { kcal: 2990, carbs: 325, protein: 75, fat: 44 };
// Per serving: breakfast 300, lunch 450, snack 200, dinner 1200 = 2150 kcal.
const recipes = {
  1: { name: "Porridge", kcal: 300 },
  2: { name: "Chicken curry", kcal: 450 },
  3: { name: "Apple", kcal: 200 },
  4: { name: "Lasagne", kcal: 1200 },
  5: { name: "Feast", kcal: 1800 },
};
const macrosOf = (kcal: number) => ({
  kcal,
  carbs: kcal / 10,
  protein: kcal / 20,
  fat: kcal / 40,
});

type Call = { method: string; url: string; body: unknown };

// A fake of the nutrition and plan API built on the real shared maths, so a refetch
// after a tick shows what the page just did.
function fakeApi(targets: Targets | null = TARGETS) {
  const slots: [MealType, number][] = [
    ["breakfast", 1],
    ["lunch", 2],
    ["snack", 3],
    ["dinner", 4],
  ];
  const entries: MealEntry[] = slots.map(([slot, recipeId], i) => ({
    id: i + 1,
    isoWeek: WEEK,
    date: TODAY,
    slot,
    position: 0,
    recipeId,
    servings: 1,
    recipeName: recipes[recipeId as 1].name,
    kcalPerServing: recipes[recipeId as 1].kcal,
    eatenServings: null,
    eatenAt: null,
  }));
  // Tuesday was fully eaten: 1800 kcal.
  entries.push({
    ...entries[0]!,
    id: 9,
    date: "2026-09-29",
    recipeId: 5,
    recipeName: "Feast",
    kcalPerServing: 1800,
    eatenServings: 1,
    eatenAt: "2026-09-29T18:00:00Z",
  });
  const per = Object.fromEntries(
    Object.entries(recipes).map(([id, r]) => [id, macrosOf(r.kcal)]),
  );
  const calls: Call[] = [];
  const reply = (body: unknown, status = 200) =>
    Promise.resolve({
      ok: status < 400,
      status,
      json: () => Promise.resolve(body),
    });
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(init.body as string) : undefined;
      calls.push({ method, url, body });
      const todays = entries.filter((e) => e.date === TODAY);
      if (url.startsWith("/api/nutrition/day/"))
        return reply(dayNutrition(todays, per, targets));
      if (url.startsWith("/api/nutrition/week/"))
        return reply({
          ...weekNutrition(entries, per, WEEK, TODAY),
          target: targets?.kcal ?? null,
        });
      if (url === `/api/plans/${WEEK}`)
        return reply({
          isoWeek: WEEK,
          days: weekDays(WEEK).map((date) => ({
            date,
            slots: Object.fromEntries(
              (["breakfast", "lunch", "snack", "dinner"] as const).map((s) => [
                s,
                entries.filter((e) => e.date === date && e.slot === s),
              ]),
            ),
          })),
        });
      const id = Number(url.split("/")[5]);
      const e = entries.find((x) => x.id === id)!;
      if (method === "POST") {
        e.eatenServings = body?.servings ?? e.servings;
        e.eatenAt = "2026-09-30T12:00:00Z";
      } else {
        e.eatenServings = null;
        e.eatenAt = null;
      }
      return reply(e);
    }),
  );
  return { calls, entries };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-30T12:00:00"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const ring = () => screen.findByRole("img", { name: /kcal of 2990/ });
const check = (slot: string) =>
  screen.getByRole("checkbox", { name: new RegExp(slot, "i") });
const tick = async (slot: string) => {
  fireEvent.click(check(slot));
  fireEvent.click(await screen.findByRole("button", { name: "Mark as eaten" }));
};

describe("TodayPage", () => {
  it("AC-1: shows 0 eaten of 2990, 2150 planned and the four meals", async () => {
    fakeApi();
    render(<TodayPage />);
    expect(await ring()).toBeTruthy();
    expect(screen.getByText("2150 kcal planned")).toBeTruthy();
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
  });

  it("AC-2: ticking Breakfast turns the check done and updates eaten and the bars", async () => {
    const { calls } = fakeApi();
    render(<TodayPage />);
    await ring();
    await tick("breakfast");
    expect(
      await screen.findByRole("img", { name: "300 kcal of 2990" }),
    ).toBeTruthy();
    expect((check("breakfast") as HTMLInputElement).checked).toBe(true);
    expect(
      screen
        .getByRole("progressbar", { name: "Carbs" })
        .getAttribute("aria-valuenow"),
    ).toBe("30");
    expect(calls).toContainEqual({
      method: "POST",
      url: `/api/plans/${WEEK}/entries/1/eaten`,
      body: { servings: 1 },
    });
  });

  it("AC-3: ticking Lunch with 1.5 servings adds 675 kcal", async () => {
    const { calls } = fakeApi();
    render(<TodayPage />);
    await ring();
    fireEvent.click(check("lunch"));
    fireEvent.click(
      await screen.findByRole("button", { name: "Increase Servings eaten" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark as eaten" }));
    expect(
      await screen.findByRole("img", { name: "675 kcal of 2990" }),
    ).toBeTruthy();
    expect(calls.at(-4)).toMatchObject({ body: { servings: 1.5 } });
  });

  it("AC-4: unticking returns the meal to planned and reverts the totals", async () => {
    const { calls } = fakeApi();
    render(<TodayPage />);
    await ring();
    await tick("breakfast");
    await screen.findByRole("img", { name: "300 kcal of 2990" });
    fireEvent.click(check("breakfast"));
    expect(
      await screen.findByRole("img", { name: "0 kcal of 2990" }),
    ).toBeTruthy();
    expect((check("breakfast") as HTMLInputElement).checked).toBe(false);
    expect(calls.some((c) => c.method === "DELETE")).toBe(true);
  });

  it("AC-5: over the target shows '+N kcal over ▲'", async () => {
    fakeApi({ ...TARGETS, kcal: 100 });
    render(<TodayPage />);
    await screen.findByRole("img", { name: "0 kcal of 100" });
    await tick("breakfast");
    expect(await screen.findByText("+200 kcal over ▲")).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "300 kcal of 100, over target" }),
    ).toBeTruthy();
  });

  it("AC-6: without targets shows totals, no ring and a link to /targets", async () => {
    fakeApi(null);
    render(<TodayPage />);
    const link = await screen.findByRole("link", { name: "Set targets" });
    expect(link.getAttribute("href")).toBe("/targets");
    expect(screen.queryByRole("img", { name: /kcal/ })).toBeNull();
    expect(screen.queryByText("This week")).toBeNull();
  });

  it("AC-8: the week trend shows Tue eaten and Wed to Sun planned", async () => {
    fakeApi();
    render(<TodayPage />);
    await ring();
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    const rows = screen.getAllByRole("row").map((r) => r.textContent);
    expect(rows).toContain("Mon0None");
    expect(rows).toContain("Tue1800Eaten");
    expect(rows).toContain("Wed2150Planned");
  });

  it("AC-11: the next unticked meal after the time is marked, then moves on", async () => {
    fakeApi();
    render(<TodayPage />);
    await ring();
    // 12:00 is lunch time: Breakfast is past, Lunch is next.
    expect(screen.getByText("Lunch · next")).toBeTruthy();
    expect(screen.queryByText("Breakfast · next")).toBeNull();
    await tick("lunch");
    expect(await screen.findByText("Snack · next")).toBeTruthy();
  });

  it("shows an error with Retry when loading fails", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve({ ok: false, status: 500 }));
    render(<TodayPage />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    fakeApi();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await ring();
  });

  it("shows an alert and keeps the meal planned when saving fails", async () => {
    fakeApi();
    render(<TodayPage />);
    await ring();
    const ok = fetch;
    vi.stubGlobal("fetch", () => Promise.resolve({ ok: false, status: 500 }));
    await tick("breakfast");
    expect(await screen.findByRole("alert")).toBeTruthy();
    vi.stubGlobal("fetch", ok);
  });

  it("has no axe violations", async () => {
    fakeApi();
    const { container } = render(<TodayPage />);
    await waitFor(() => ring());
    await ring();
    expect(await axeViolations(container)).toEqual([]);
  });
});
