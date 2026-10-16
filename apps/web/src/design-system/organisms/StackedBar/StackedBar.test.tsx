import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { StackedBar, type StackedWeek } from "./StackedBar.tsx";

const CATS = [
  { label: "Produce", color: "var(--food-category-veggies)" },
  { label: "Grains", color: "var(--food-category-grains)" },
  { label: "Dairy", color: "var(--food-category-dairy)" },
];
const WEEKS: StackedWeek[] = [
  { label: "W37", cents: [1200, 800, 900] },
  { label: "W38", cents: [1400, 700, 1000] },
  { label: "W39", cents: [1600, 900, 1100] },
  { label: "W40", cents: [1800, 900, 1200] },
];

describe("StackedBar", () => {
  it("names the chart with the number of weeks", () => {
    render(<StackedBar categories={CATS} weeks={WEEKS} locale="en-IE" />);
    expect(
      screen.getByRole("img", {
        name: "Spend by category for the last 4 weeks",
      }),
    ).toBeTruthy();
  });

  it("stacks one segment per category per week, taller for more spend", () => {
    const { container } = render(
      <StackedBar categories={CATS} weeks={WEEKS} locale="en-IE" />,
    );
    const segs = container.querySelectorAll("rect[data-seg]");
    expect(segs).toHaveLength(12);
    const h = (i: number) => Number(segs[i]?.getAttribute("height"));
    expect(h(0)).toBeGreaterThan(h(1));
    expect(h(9)).toBeGreaterThan(h(0));
  });

  it("labels each week", () => {
    render(<StackedBar categories={CATS} weeks={WEEKS} locale="en-IE" />);
    for (const w of WEEKS) expect(screen.getByText(w.label)).toBeTruthy();
  });

  it("carries a legend with each category's total and share", () => {
    render(<StackedBar categories={CATS} weeks={WEEKS} locale="en-IE" />);
    expect(screen.getByText("€60.00 · 44%")).toBeTruthy();
  });

  it("works with one week", () => {
    render(
      <StackedBar categories={CATS} weeks={WEEKS.slice(0, 1)} locale="en-IE" />,
    );
    expect(
      screen.getByRole("img", { name: "Spend by category for the last week" }),
    ).toBeTruthy();
  });

  it("says so when there is no spending", () => {
    render(<StackedBar categories={CATS} weeks={[]} locale="en-IE" />);
    expect(screen.getByText("No spending recorded")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("switches to a table: a row per week, a column per category, and a total", () => {
    render(<StackedBar categories={CATS} weeks={WEEKS} locale="en-IE" />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(5);
    expect(rows[0]?.textContent).toBe("WeekProduceGrainsDairyTotal");
    expect(rows[1]?.textContent).toBe("W3712.008.009.0029.00");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("has no axe violations in chart and table views", async () => {
    const { container } = render(
      <StackedBar categories={CATS} weeks={WEEKS} locale="en-IE" />,
    );
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
