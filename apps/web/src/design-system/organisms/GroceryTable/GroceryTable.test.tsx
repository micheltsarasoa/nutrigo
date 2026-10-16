import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { GroceryTable, type GroceryTableItem } from "./GroceryTable.tsx";

const base = {
  quantity: 100,
  unit: "g",
  kcal: 100,
  estCents: 100,
  actualCents: null,
  purchased: false,
  manual: false,
  noLongerInPlan: false,
  pendingSync: false,
};
const ITEMS: GroceryTableItem[] = [
  { ...base, id: "1", name: "Oats", category: "Grains", estCents: 120 },
  { ...base, id: "2", name: "Carrots", category: "Produce", estCents: 90 },
  { ...base, id: "3", name: "Spinach", category: "Produce", estCents: 150 },
];
const KPIS = [
  { label: "Estimated cost", value: "€3.60" },
  { label: "Total items", value: "3" },
  { label: "Total kcal", value: "300" },
];
const handlers = {
  onToggle: vi.fn(),
  onQuantity: vi.fn(),
  onActual: vi.fn(),
};
const ready = (over = {}) => (
  <GroceryTable
    state="ready"
    weekLabel="week 40"
    items={ITEMS}
    kpis={KPIS}
    locale="en-IE"
    {...handlers}
    {...over}
  />
);
const names = () =>
  screen.getAllByRole("checkbox").map((c) => c.getAttribute("aria-label"));

describe("GroceryTable", () => {
  it("shows the KPI row and one row per item", () => {
    render(ready());
    expect(screen.getByRole("group", { name: "Total items" })).toBeTruthy();
    expect(names()).toEqual([
      "Mark Oats as bought",
      "Mark Carrots as bought",
      "Mark Spinach as bought",
    ]);
  });

  it("offers All plus each category with a count, and filters by it", () => {
    render(ready());
    const tabs = screen.getByRole("radiogroup", { name: "Category" });
    expect(
      within(tabs)
        .getAllByRole("radio")
        .map((r) => r.parentElement?.textContent),
    ).toEqual(["All 3", "Grains 1", "Produce 2"]);
    fireEvent.click(within(tabs).getByLabelText("Produce 2"));
    expect(names()).toEqual([
      "Mark Carrots as bought",
      "Mark Spinach as bought",
    ]);
  });

  it("searches by name", () => {
    render(ready());
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "spin" },
    });
    expect(names()).toEqual(["Mark Spinach as bought"]);
  });

  it("says when nothing matches", () => {
    render(ready());
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No items match")).toBeTruthy();
  });

  it("sorts by name or cost", () => {
    render(ready());
    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: { value: "name" },
    });
    expect(names()[0]).toBe("Mark Carrots as bought");
    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: { value: "cost" },
    });
    expect(names()[0]).toBe("Mark Spinach as bought");
  });

  it("sends the item id with each change", () => {
    render(ready());
    fireEvent.click(screen.getByLabelText("Mark Carrots as bought"));
    expect(handlers.onToggle).toHaveBeenCalledWith("2", true);
  });

  it("offers Regenerate", () => {
    const onRegenerate = vi.fn();
    render(ready({ onRegenerate }));
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(onRegenerate).toHaveBeenCalledOnce();
  });

  it("celebrates when everything is bought, and keeps the rows", () => {
    const onInsights = vi.fn();
    const all = ITEMS.map((i) => ({ ...i, purchased: true, actualCents: 100 }));
    render(ready({ items: all, onInsights }));
    expect(screen.getByText("All 3 items bought")).toBeTruthy();
    expect(screen.getByText("Estimated €3.60 · actual €3.00")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View insights" }));
    expect(onInsights).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("empty: no plan, goes to the meal plan", () => {
    const onGoToPlan = vi.fn();
    render(
      <GroceryTable
        state="noPlan"
        weekLabel="week 40"
        onGoToPlan={onGoToPlan}
      />,
    );
    expect(screen.getByText("No plan for week 40")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Go to meal plan" }));
    expect(onGoToPlan).toHaveBeenCalledOnce();
  });

  it("empty: plan but no list yet, generates one", () => {
    const onGenerate = vi.fn();
    render(
      <GroceryTable
        state="noList"
        weekLabel="week 40"
        onGenerate={onGenerate}
      />,
    );
    expect(screen.getByText("No list yet")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate list" }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });

  it("has no axe violations", async () => {
    const { container } = render(ready());
    expect(await axeViolations(container)).toEqual([]);
  });
});
