import { describe, expect, it } from "vitest";
import { Targets, dayNutrition, nextMealId, weekNutrition } from "./diary.ts";
import { MealEntry } from "./plan.ts";

const recipes = {
  1: { kcal: 300, carbs: 40, protein: 10, fat: 5 },
  2: { kcal: 450, carbs: 50, protein: 30, fat: 15 },
};
const e = (id: number, recipeId: number, over = {}) => ({
  id,
  date: "2026-10-14",
  slot: "breakfast" as const,
  recipeId,
  servings: 1,
  ...over,
});
const targets = { kcal: 2990, carbs: 325, protein: 75, fat: 44 };

describe("dayNutrition", () => {
  const entries = [e(1, 1), e(2, 2, { slot: "lunch" })];

  it("AC-1: nothing ticked: eaten 0, left = target", () => {
    const d = dayNutrition(entries, recipes, targets);
    expect(d.planned.kcal).toBe(750);
    expect(d.eaten.kcal).toBe(0);
    expect(d.left).toBe(2990);
    expect(d.target).toBe(2990);
  });

  it("AC-2: a ticked meal counts as eaten, with its macros", () => {
    const d = dayNutrition(
      [e(1, 1, { eatenAt: "2026-10-14T08:00" }), entries[1]!],
      recipes,
      targets,
    );
    expect(d.eaten).toEqual({ kcal: 300, carbs: 40, protein: 10, fat: 5 });
    expect(d.left).toBe(2690);
    expect(d.planned.kcal).toBe(750);
  });

  it("AC-3: custom eaten servings replace the planned ones", () => {
    const d = dayNutrition(
      [e(2, 2, { eatenAt: "x", eatenServings: 1.5 })],
      recipes,
      targets,
    );
    expect(d.eaten.kcal).toBe(675);
    expect(d.planned.kcal).toBe(450);
  });

  it("all ticked: eaten equals planned", () => {
    const d = dayNutrition(
      entries.map((x) => ({ ...x, eatenAt: "x" })),
      recipes,
      targets,
    );
    expect(d.eaten).toEqual(d.planned);
  });

  it("AC-5: over target gives a negative left", () => {
    const d = dayNutrition(
      [e(2, 2, { eatenAt: "x", eatenServings: 10 })],
      recipes,
      { kcal: 4000 },
    );
    expect(d.left).toBe(-500);
  });

  it("AC-6: no targets: target and left are null", () => {
    expect(dayNutrition(entries, recipes, null).left).toBeNull();
    expect(dayNutrition(entries, recipes, null).target).toBeNull();
  });
});

describe("nextMealId", () => {
  const day = "2026-10-14";
  const all = [
    e(1, 1, { slot: "breakfast" }),
    e(2, 1, { slot: "lunch" }),
    e(3, 1, { slot: "snack" }),
    e(4, 1, { slot: "dinner" }),
  ];
  const at = (time: string) => nextMealId(all, `${day}T${time}`);

  it("AC-11: picks the slot matching the time", () => {
    expect(at("07:00")).toBe(1);
    expect(at("10:29")).toBe(1);
    expect(at("10:30")).toBe(2);
    expect(at("14:59")).toBe(2);
    expect(at("15:00")).toBe(3);
    expect(at("17:59")).toBe(3);
    expect(at("18:00")).toBe(4);
    expect(at("23:59")).toBe(4);
  });

  it("skips ticked entries and moves to later slots", () => {
    const some = all.map((x) => (x.id === 2 ? { ...x, eatenAt: "x" } : x));
    expect(nextMealId(some, `${day}T12:00`)).toBe(3);
  });

  it("ignores unticked meals of earlier slots", () => {
    expect(nextMealId([all[0]!], `${day}T12:00`)).toBeNull();
  });

  it("takes the lowest position inside a slot", () => {
    const two = [e(5, 1, { position: 1 }), e(6, 1, { position: 0 })];
    expect(nextMealId(two, `${day}T08:00`)).toBe(6);
  });

  it("future and past days have no next meal", () => {
    expect(nextMealId(all, "2026-10-13T08:00")).toBeNull();
    expect(nextMealId(all, "2026-10-15T08:00")).toBeNull();
  });

  it("all eaten: none", () => {
    const done = all.map((x) => ({ ...x, eatenAt: "x" }));
    expect(nextMealId(done, `${day}T08:00`)).toBeNull();
  });
});

describe("weekNutrition", () => {
  // 2026-W42: Mon 10-12 ... Sun 10-18. Today is Wed 10-14.
  const entries = [
    e(1, 1, { date: "2026-10-12", eatenAt: "x" }),
    e(2, 2, { date: "2026-10-12" }), // planned, not eaten, past
    e(3, 2, { date: "2026-10-13", eatenAt: "x", eatenServings: 2 }),
    e(4, 1, { date: "2026-10-14", eatenAt: "x" }),
    e(5, 2, { date: "2026-10-16" }),
  ];
  const w = weekNutrition(entries, recipes, "2026-W42", "2026-10-14");

  it("AC-8: seven days from Monday, past days flagged", () => {
    expect(w.days.map((d) => d.date)).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
    expect(w.days.map((d) => d.isPast)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("each day carries planned and eaten", () => {
    expect(w.days[0]!.planned.kcal).toBe(750);
    expect(w.days[0]!.eaten.kcal).toBe(300);
    expect(w.days[1]!.eaten.kcal).toBe(900);
    expect(w.days[6]!.planned.kcal).toBe(0);
  });

  it("total = eaten for past days, planned for the rest", () => {
    // Mon 300 + Tue 900 + Wed planned 300 + Fri planned 450
    expect(w.total).toEqual({ kcal: 1950, carbs: 230, protein: 110, fat: 55 });
  });
});

describe("schemas", () => {
  it("Targets: kcal is a positive integer", () => {
    expect(Targets.safeParse({ kcal: 2990 }).success).toBe(true);
    expect(Targets.safeParse({ kcal: 0 }).success).toBe(false);
    expect(Targets.safeParse({ kcal: 2000.5 }).success).toBe(false);
  });

  it("Targets: macros optional, non-negative, nullable when cleared", () => {
    expect(
      Targets.safeParse({ kcal: 1, carbs: 0, protein: null }).success,
    ).toBe(true);
    expect(Targets.safeParse({ kcal: 1, fat: -1 }).success).toBe(false);
  });

  it("MealEntry has the eaten fields, nullable and optional", () => {
    const base = {
      id: 1,
      date: "2026-10-14",
      slot: "lunch",
      recipeId: 1,
      servings: 1,
      isoWeek: "2026-W42",
      position: 0,
      recipeName: "x",
      kcalPerServing: 1,
    };
    expect(MealEntry.parse(base).eatenAt).toBeUndefined();
    const ticked = MealEntry.parse({
      ...base,
      eatenServings: 1.5,
      eatenAt: "2026-10-14T12:00:00Z",
    });
    expect(ticked.eatenServings).toBe(1.5);
    expect(
      MealEntry.safeParse({ ...base, eatenServings: null, eatenAt: null })
        .success,
    ).toBe(true);
    expect(MealEntry.safeParse({ ...base, eatenServings: 0 }).success).toBe(
      false,
    );
  });
});
