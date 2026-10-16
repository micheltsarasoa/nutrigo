import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { SpendChart, type SpendWeek } from "./SpendChart.tsx";

const weeks: SpendWeek[] = [
  { label: "W37", cents: 5530, estimated: false },
  { label: "W38", cents: 7100, estimated: false },
  { label: "W39", cents: 4960, estimated: false },
  { label: "W40", cents: 5740, estimated: true },
];
const cols = () => screen.getAllByTestId("column");

describe("SpendChart", () => {
  it("draws one focusable column per week, the peak orange, estimates hatched", () => {
    render(<SpendChart weeks={weeks} locale="en-IE" />);
    expect(
      screen.getByRole("img", {
        name: /Weekly grocery spend, highest in W38 at €71\.00/,
      }),
    ).toBeTruthy();
    expect(cols()).toHaveLength(4);
    expect(cols()[0]!.getAttribute("tabindex")).toBe("0");
    expect(cols()[0]!.getAttribute("data-kind")).toBe("actual");
    expect(cols()[1]!.getAttribute("data-kind")).toBe("peak");
    expect(cols()[3]!.getAttribute("data-kind")).toBe("estimated");
    for (const t of ["Actual", "Estimated (not yet shopped)", "Highest week"])
      expect(screen.getByText(t)).toBeTruthy();
  });

  it("shows a tooltip with ~ for estimates on focus", () => {
    render(<SpendChart weeks={weeks} locale="en-IE" />);
    fireEvent.focus(cols()[3]!);
    expect(screen.getByRole("tooltip").textContent).toContain("W40 · ~€57.40");
    fireEvent.focus(cols()[0]!);
    expect(screen.getByRole("tooltip").textContent).toContain("W37 · €55.30");
  });

  it("offers a table view with the same numbers", () => {
    render(<SpendChart weeks={weeks} locale="en-IE" />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getByRole("table", { name: "Spend per week" })).toBeTruthy();
    expect(screen.getByText("~€57.40")).toBeTruthy();
    expect(screen.getByText("Estimated")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("says so when there are no lists", () => {
    render(<SpendChart weeks={[]} locale="en-IE" />);
    expect(screen.getByText("No spending recorded")).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(<SpendChart weeks={weeks} locale="en-IE" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
