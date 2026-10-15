import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  type MealEntry,
  type Plan,
  type MealType,
  weekDays,
} from "@nutrigo/shared";
import { axeViolations } from "../../../axe.ts";
import { MealPlanGrid } from "./MealPlanGrid.tsx";

const SLOTS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const entry = (
  id: number,
  date: string,
  slot: MealType,
  recipeName: string,
  kcalPerServing: number,
  servings = 1,
  position = 0,
): MealEntry => ({
  id,
  date,
  slot,
  recipeId: id,
  servings,
  isoWeek: "2026-W41",
  position,
  recipeName,
  kcalPerServing,
});
const planOf = (entries: MealEntry[] = []): Plan => ({
  isoWeek: "2026-W41",
  days: weekDays("2026-W41").map((date) => ({
    date,
    slots: Object.fromEntries(
      SLOTS.map((s) => [
        s,
        entries.filter((e) => e.date === date && e.slot === s),
      ]),
    ) as Plan["days"][number]["slots"],
  })),
});

const salad = entry(1, "2026-10-06", "lunch", "Grilled Chicken Salad", 450);
const soup = entry(2, "2026-10-06", "lunch", "Tomato Soup", 120, 2, 1);
const oats = entry(3, "2026-10-06", "breakfast", "Oat Bowl", 300);

const props = (
  over: Partial<ComponentProps<typeof MealPlanGrid>> = {},
): ComponentProps<typeof MealPlanGrid> => ({
  plan: planOf(),
  today: "2026-10-07",
  selectedDate: "2026-10-06",
  onSelectDay: vi.fn(),
  onAdd: vi.fn(),
  onOpenEntry: vi.fn(),
  onRetry: vi.fn(),
  ...over,
});

describe("MealPlanGrid", () => {
  it("SPEC-003 AC-1: seven day heads, Monday first, today marked", () => {
    render(<MealPlanGrid {...props()} />);
    const heads = screen.getAllByRole("button", {
      name: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\d/,
    });
    expect(
      heads.map((h) => within(h).getByText(/^[A-Z][a-z]{2}$/).textContent),
    ).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(heads.map((h) => within(h).getByText(/^\d+$/).textContent)).toEqual([
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
    ]);
    expect(
      heads.filter((h) => h.getAttribute("aria-current") === "date"),
    ).toEqual([heads[2]]);
  });

  it("selects a day from its head, and marks the selected one", () => {
    const p = props();
    render(<MealPlanGrid {...p} />);
    const tue = screen.getByRole("button", { name: /^Tue/ });
    expect(tue.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /^Thu/ }));
    expect(p.onSelectDay).toHaveBeenCalledWith("2026-10-08");
  });

  it("shows a day's planned kcal under its head", () => {
    render(<MealPlanGrid {...props({ plan: planOf([salad, soup, oats]) })} />);
    // 450 + 120 × 2 + 300
    expect(
      within(screen.getByRole("button", { name: /^Tue/ })).getByText(
        "990 kcal",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("button", { name: /^Mon/ })).getByText(
        "No meals",
      ),
    ).toBeTruthy();
  });

  it("lists the four slots in order, with the selected day's kcal per slot", () => {
    render(<MealPlanGrid {...props({ plan: planOf([salad, soup, oats]) })} />);
    const rows = SLOTS.map((s) =>
      screen.getByText(s[0]!.toUpperCase() + s.slice(1)),
    );
    expect(
      rows.every(
        (row, i) =>
          i === 0 ||
          rows[i - 1]!.compareDocumentPosition(row) &
            Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
    // Lunch on Tue: 450 + 120 × 2; the other slots show their own totals.
    expect(
      screen.getByText("690 kcal", { selector: "[data-slot-kcal]" }),
    ).toBeTruthy();
    expect(
      screen.getByText("300 kcal", { selector: "[data-slot-kcal]" }),
    ).toBeTruthy();
    expect(
      screen.getAllByText("0 kcal", { selector: "[data-slot-kcal]" }),
    ).toHaveLength(2);
  });

  it("SPEC-003 AC-9: stacks a slot's recipes in the given order (the API sorts by position)", () => {
    render(<MealPlanGrid {...props({ plan: planOf([salad, soup]) })} />);
    const names = screen.getAllByText(/Salad|Soup/).map((n) => n.textContent);
    expect(names).toEqual(["Grilled Chicken Salad", "Tomato Soup"]);
  });

  it("SPEC-003 AC-3: an empty slot offers an add button for its day and slot", () => {
    const p = props({ plan: planOf([salad]) });
    render(<MealPlanGrid {...p} />);
    expect(
      screen.queryByRole("button", { name: "Add lunch on Tue" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add dinner on Tue" }));
    expect(p.onAdd).toHaveBeenCalledWith("2026-10-06", "dinner");
    expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(27);
  });

  it("opens an entry from its card", () => {
    const p = props({ plan: planOf([salad]) });
    render(<MealPlanGrid {...p} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Grilled Chicken Salad/ }),
    );
    expect(p.onOpenEntry).toHaveBeenCalledWith(salad);
  });

  it("while loading, says so and shows no grid", () => {
    render(<MealPlanGrid {...props({ loading: true })} />);
    expect(screen.getByRole("status").textContent).toBe(
      "Loading the meal plan…",
    );
    expect(screen.queryByRole("button", { name: /^Mon/ })).toBeNull();
  });

  it("on error, shows an alert and retries", () => {
    const p = props({ error: true });
    render(<MealPlanGrid {...p} />);
    expect(screen.getByRole("alert").textContent).toMatch(/couldn.t load/i);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(p.onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /^Mon/ })).toBeNull();
  });

  it("has no axe violations in each state", async () => {
    const { container } = render(
      <>
        <MealPlanGrid {...props()} />
        <MealPlanGrid {...props({ plan: planOf([salad, soup, oats]) })} />
        <MealPlanGrid {...props({ loading: true })} />
        <MealPlanGrid {...props({ error: true })} />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
