import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import type { LegendItem } from "../../molecules/Legend/index.ts";
import { Donut } from "./Donut.tsx";

const FIVE: LegendItem[] = [
  {
    label: "Produce",
    color: "var(--food-category-veggies)",
    cents: 1840,
    percent: 30,
  },
  {
    label: "Grains",
    color: "var(--food-category-grains)",
    cents: 920,
    percent: 15,
  },
  {
    label: "Dairy",
    color: "var(--food-category-dairy)",
    cents: 1230,
    percent: 20,
  },
  {
    label: "Pantry",
    color: "var(--color-neutral-chip-grey)",
    cents: 1540,
    percent: 25,
  },
  {
    label: "Other",
    color: "var(--food-category-others)",
    cents: 615,
    percent: 10,
  },
];

describe("Donut", () => {
  it("names the chart with its total", () => {
    render(<Donut slices={FIVE} locale="en-IE" caption="this week" />);
    expect(
      screen.getByRole("img", { name: "Spend by category, total €61.45" }),
    ).toBeTruthy();
    expect(screen.getByText("this week")).toBeTruthy();
  });

  it("draws one arc per slice, sized by its share", () => {
    const { container } = render(<Donut slices={FIVE} locale="en-IE" />);
    const arcs = container.querySelectorAll("circle[data-slice]");
    expect(arcs).toHaveLength(5);
    const len = (i: number) =>
      Number(arcs[i]?.getAttribute("stroke-dasharray")?.split(" ")[0]);
    expect(len(0) / len(1)).toBeCloseTo(2, 0);
  });

  it("carries the legend with € and %", () => {
    render(<Donut slices={FIVE} locale="en-IE" />);
    expect(screen.getByText("€18.40 · 30%")).toBeTruthy();
  });

  it("draws a full ring for one category", () => {
    const { container } = render(
      <Donut slices={FIVE.slice(0, 1)} locale="en-IE" />,
    );
    expect(container.querySelectorAll("circle[data-slice]")).toHaveLength(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("says so when there is no spending", () => {
    render(<Donut slices={[]} locale="en-IE" />);
    expect(screen.getByText("No spending recorded")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("switches to a table of category, € and %", () => {
    render(<Donut slices={FIVE} locale="en-IE" />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(6);
    expect(rows[1]?.textContent).toBe("Produce18.4030");
    expect(screen.queryByRole("img")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Chart" }));
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("has no axe violations in chart and table views", async () => {
    const { container } = render(<Donut slices={FIVE} locale="en-IE" />);
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
