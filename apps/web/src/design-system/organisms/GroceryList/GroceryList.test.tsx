import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import type { GroceryTableItem } from "../GroceryTable/index.ts";
import { GroceryList } from "./GroceryList.tsx";

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
  { ...base, id: "1", name: "Carrots", category: "Produce", purchased: true },
  { ...base, id: "2", name: "Spinach", category: "Produce" },
  { ...base, id: "3", name: "Oats", category: "Grains" },
];
const onToggle = vi.fn();
const ready = (over = {}) => (
  <GroceryList
    state="ready"
    weekLabel="week 40"
    items={ITEMS}
    locale="en-IE"
    onToggle={onToggle}
    {...over}
  />
);

describe("GroceryList", () => {
  it("shows progress as 'N of M' and the estimate", () => {
    render(ready());
    expect(screen.getByText("1 of 3")).toBeTruthy();
    expect(
      screen.getByRole("progressbar", { name: "Items bought" }),
    ).toBeTruthy();
    expect(screen.getByText("Estimated ~€3.00")).toBeTruthy();
  });

  it("groups the rows into one section per category, in order", () => {
    render(ready());
    const sections = screen.getAllByRole("region");
    expect(
      sections.map(
        (s) =>
          s.getAttribute("aria-label") ?? s.querySelector("h3")?.textContent,
      ),
    ).toEqual(["Produce", "Grains"]);
    expect(within(sections[0]!).getAllByRole("checkbox")).toHaveLength(2);
  });

  it("ticks with the item id", () => {
    render(ready());
    fireEvent.click(screen.getByLabelText("Mark Oats as bought"));
    expect(onToggle).toHaveBeenCalledWith("3", true);
  });

  it("has a sticky Add item button", () => {
    const onAdd = vi.fn();
    render(ready({ onAdd }));
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("shows the offline banner above the list, with Retry on error", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      ready({ sync: { state: "offline", pending: 6 } }),
    );
    expect(screen.getByRole("status").textContent).toBe(
      "Offline · 6 changes pending",
    );
    rerender(ready({ sync: { state: "error", pending: 6 }, onRetry }));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("opens an item from its row", () => {
    const onOpen = vi.fn();
    render(ready({ onOpen }));
    fireEvent.click(screen.getByRole("button", { name: /Spinach/ }));
    expect(onOpen).toHaveBeenCalledWith("2");
  });

  it("all bought: totals and insights, rows kept", () => {
    const onInsights = vi.fn();
    const all = ITEMS.map((i) => ({ ...i, purchased: true, actualCents: 120 }));
    render(ready({ items: all, onInsights }));
    expect(screen.getByText("All 3 items bought")).toBeTruthy();
    expect(screen.getByText("Estimated €3.00 · actual €3.60")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View insights" }));
    expect(onInsights).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("empty: no plan and no list yet", () => {
    const onGoToPlan = vi.fn();
    const onGenerate = vi.fn();
    const { rerender } = render(
      <GroceryList
        state="noPlan"
        weekLabel="week 40"
        onGoToPlan={onGoToPlan}
      />,
    );
    expect(screen.getByText("No plan for week 40")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Go to meal plan" }));
    expect(onGoToPlan).toHaveBeenCalledOnce();
    rerender(
      <GroceryList
        state="noList"
        weekLabel="week 40"
        onGenerate={onGenerate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate list" }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      ready({ sync: { state: "syncing", pending: 2 }, onAdd: () => {} }),
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
