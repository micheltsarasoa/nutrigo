import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { ColumnChart, type ChartDay } from "./ColumnChart.tsx";

const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const week = (kcals: number[], eaten: number): ChartDay[] =>
  kcals.map((kcal, i) => ({
    day: names[i]!,
    kcal,
    status: kcal === 0 ? "none" : i < eaten ? "eaten" : "planned",
  }));
const over = week([1850, 2210, 2340, 1980, 1500, 1700, 1600], 4);
const empty = week([0, 0, 0, 0, 0, 0, 0], 0);
const cols = () => screen.getAllByTestId("column");

describe("ColumnChart", () => {
  it("names the chart with the target and draws 7 focusable columns", () => {
    render(<ColumnChart days={over} target={2000} />);
    expect(
      screen.getByRole("img", {
        name: "Calories per day this week against a target of 2000 kcal",
      }),
    ).toBeTruthy();
    expect(cols()).toHaveLength(7);
    expect(cols()[0]!.getAttribute("tabindex")).toBe("0");
    expect(screen.getByText(/Target 2000 kcal/)).toBeTruthy();
    for (const t of ["Eaten", "Planned", "Over target ▲"])
      expect(screen.getByText(t)).toBeTruthy();
  });

  it("marks eaten solid, planned hatched, over orange, none as a baseline", () => {
    const days = [
      ...over.slice(0, 6),
      { day: "Sun", kcal: 0, status: "none" as const },
    ];
    render(<ColumnChart days={days} target={2000} />);
    expect(cols()[0]!.getAttribute("data-kind")).toBe("eaten");
    expect(cols()[2]!.getAttribute("data-kind")).toBe("eaten-over");
    expect(cols()[4]!.getAttribute("data-kind")).toBe("planned");
    expect(cols()[6]!.getAttribute("data-kind")).toBe("none");
    expect(cols()[6]!.querySelectorAll("rect")).toHaveLength(1); // hit area only
    expect(cols()[6]!.querySelector("line")).not.toBeNull();
    expect(cols()[0]!.querySelectorAll("rect")).toHaveLength(2);
  });

  it("shows hatched orange for a planned day above target", () => {
    render(
      <ColumnChart days={week([0, 0, 0, 2500, 0, 0, 0], 0)} target={2000} />,
    );
    expect(cols()[3]!.getAttribute("data-kind")).toBe("planned-over");
  });

  it("shows the tooltip with the ▲ marker on hover and on focus", () => {
    render(<ColumnChart days={over} target={2000} />);
    const wed = cols()[2]!;
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.mouseEnter(wed);
    expect(screen.getByRole("tooltip").textContent).toBe(
      "Wed · 2340 kcal · ▲ +340 over",
    );
    fireEvent.mouseLeave(wed);
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.focus(wed);
    expect(screen.getByRole("tooltip").textContent).toBe(
      "Wed · 2340 kcal · ▲ +340 over",
    );
    fireEvent.blur(wed);
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.focus(cols()[0]!);
    expect(screen.getByRole("tooltip").textContent).toBe("Mon · 1850 kcal");
  });

  it("shows the empty hint only when nothing is planned or eaten", () => {
    const { rerender } = render(<ColumnChart days={empty} target={2000} />);
    expect(
      screen.getByText("Nothing planned or eaten this week yet."),
    ).toBeTruthy();
    rerender(<ColumnChart days={over} target={2000} />);
    expect(
      screen.queryByText("Nothing planned or eaten this week yet."),
    ).toBeNull();
  });

  it("toggles to a table with the same numbers", () => {
    render(<ColumnChart days={over} target={2000} />);
    const chart = screen.getByRole("button", { name: "Chart" });
    const table = screen.getByRole("button", { name: "Table" });
    expect(chart.getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("table")).toBeNull();
    fireEvent.click(table);
    expect(table.getAttribute("aria-pressed")).toBe("true");
    expect(chart.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("img")).toBeNull();
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(8);
    expect(rows[3]!.textContent).toBe("Wed2340Eaten ▲ +340 over");
    expect(rows[5]!.textContent).toBe("Fri1500Planned");
    fireEvent.click(chart);
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("has no axe violations in chart, tooltip and table views", async () => {
    const { container } = render(<ColumnChart days={over} target={2000} />);
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.focus(cols()[2]!);
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
