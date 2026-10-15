import { describe, expect, it } from "vitest";
import {
  IsoDate,
  IsoWeek,
  MealEntryInput,
  copyWeek,
  isoWeekOf,
  plannedKcal,
  weekDays,
  weekLabel,
} from "./plan.ts";

describe("isoWeekOf", () => {
  it("SPEC-003 AC-1: Wed 2026-09-30 is in 2026-W40", () => {
    expect(isoWeekOf("2026-09-30")).toBe("2026-W40");
  });

  it("starts the week on Monday and ends it on Sunday", () => {
    expect(isoWeekOf("2026-09-27")).toBe("2026-W39");
    expect(isoWeekOf("2026-09-28")).toBe("2026-W40");
    expect(isoWeekOf("2026-10-04")).toBe("2026-W40");
    expect(isoWeekOf("2026-10-05")).toBe("2026-W41");
  });

  it("handles the year boundaries (2026 has a W53)", () => {
    expect(isoWeekOf("2026-12-31")).toBe("2026-W53");
    expect(isoWeekOf("2027-01-03")).toBe("2026-W53");
    expect(isoWeekOf("2027-01-04")).toBe("2027-W01");
    expect(isoWeekOf("2025-12-29")).toBe("2026-W01");
    expect(isoWeekOf("2026-01-01")).toBe("2026-W01");
    expect(isoWeekOf("2021-01-03")).toBe("2020-W53");
  });

  it("does not move across the DST changes", () => {
    expect(isoWeekOf("2026-03-29")).toBe("2026-W13");
    expect(isoWeekOf("2026-03-30")).toBe("2026-W14");
    expect(isoWeekOf("2026-10-25")).toBe("2026-W43");
    expect(isoWeekOf("2026-10-26")).toBe("2026-W44");
  });
});

describe("weekDays", () => {
  it("returns 7 dates from Monday to Sunday", () => {
    expect(weekDays("2026-W40")).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it("crosses the year and the DST changes", () => {
    expect(weekDays("2026-W53")[0]).toBe("2026-12-28");
    expect(weekDays("2026-W53")[6]).toBe("2027-01-03");
    expect(weekDays("2027-W01")[0]).toBe("2027-01-04");
    expect(weekDays("2026-W13")[6]).toBe("2026-03-29");
    expect(weekDays("2026-W43")[6]).toBe("2026-10-25");
  });

  it("round-trips with isoWeekOf", () => {
    for (const week of ["2026-W01", "2026-W40", "2026-W53", "2027-W52"])
      for (const day of weekDays(week)) expect(isoWeekOf(day)).toBe(week);
  });
});

describe("weekLabel", () => {
  it("SPEC-003 AC-2: one month is shown once", () => {
    expect(weekLabel("2026-W41")).toBe("Oct 5 – 11, 2026");
  });

  it("shows both months when the week spans two", () => {
    expect(weekLabel("2026-W40")).toBe("Sep 28 – Oct 4, 2026");
  });

  it("shows both years when the week spans two", () => {
    expect(weekLabel("2026-W53")).toBe("Dec 28, 2026 – Jan 3, 2027");
  });
});

describe("IsoWeek and IsoDate", () => {
  it("accept real weeks and dates only", () => {
    expect(IsoWeek.safeParse("2026-W53").success).toBe(true);
    expect(IsoWeek.safeParse("2027-W53").success).toBe(false);
    expect(IsoWeek.safeParse("2026-W00").success).toBe(false);
    expect(IsoWeek.safeParse("2026-40").success).toBe(false);
    expect(IsoDate.safeParse("2026-09-30").success).toBe(true);
    expect(IsoDate.safeParse("2026-02-30").success).toBe(false);
    expect(IsoDate.safeParse("30/09/2026").success).toBe(false);
  });

  it("MealEntryInput needs a slot, a recipe and positive servings", () => {
    const ok = {
      date: "2026-09-30",
      slot: "lunch",
      recipeId: 1,
      servings: 1.5,
    };
    expect(MealEntryInput.safeParse(ok).success).toBe(true);
    expect(MealEntryInput.safeParse({ ...ok, servings: 0 }).success).toBe(
      false,
    );
    expect(MealEntryInput.safeParse({ ...ok, slot: "brunch" }).success).toBe(
      false,
    );
  });
});

describe("plannedKcal", () => {
  it("sums kcal per serving times servings", () => {
    expect(
      plannedKcal([
        { servings: 2, kcalPerServing: 400 },
        { servings: 1, kcalPerServing: 150 },
      ]),
    ).toBe(950);
  });

  it("is 0 for an empty slot", () => {
    expect(plannedKcal([])).toBe(0);
  });
});

describe("copyWeek", () => {
  const entry = (id: number, date: string, slot = "lunch" as const) => ({
    id,
    date,
    slot,
    recipeId: id * 10,
    servings: 2,
  });
  const source = [entry(1, "2026-09-28"), entry(2, "2026-10-02", "dinner")];

  it("SPEC-003 AC-7: keeps the weekday and the slot", () => {
    expect(copyWeek(source, "2026-W40", "2026-W41", [], "merge")).toEqual({
      remove: [],
      add: [
        { date: "2026-10-05", slot: "lunch", recipeId: 10, servings: 2 },
        { date: "2026-10-09", slot: "dinner", recipeId: 20, servings: 2 },
      ],
    });
  });

  it("merge keeps what the target week has", () => {
    const target = [entry(9, "2026-10-05")];
    const { remove, add } = copyWeek(
      source,
      "2026-W40",
      "2026-W41",
      target,
      "merge",
    );
    expect(remove).toEqual([]);
    expect(add).toHaveLength(2);
  });

  it("replace removes every entry of the target week first", () => {
    const target = [entry(9, "2026-10-05"), entry(8, "2026-10-06")];
    const { remove, add } = copyWeek(
      source,
      "2026-W40",
      "2026-W41",
      target,
      "replace",
    );
    expect(remove).toEqual([9, 8]);
    expect(add).toHaveLength(2);
  });

  it("works across the year boundary", () => {
    const { add } = copyWeek(
      [entry(1, "2026-12-31")],
      "2026-W53",
      "2027-W01",
      [],
      "merge",
    );
    expect(add[0]?.date).toBe("2027-01-07");
  });
});
