import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { ChartTable } from "./ChartTable.tsx";

const COLS = [
  { label: "Category" },
  { label: "€", numeric: true },
  { label: "%", numeric: true },
];
const ROWS = [
  ["Produce", "18.40", "30"],
  ["Grains", "9.20", "15"],
];

describe("ChartTable", () => {
  it("renders a header row and one row per entry", () => {
    render(
      <ChartTable caption="Spend by category" columns={COLS} rows={ROWS} />,
    );
    const table = screen.getByRole("table", { name: "Spend by category" });
    const rows = within(table).getAllByRole("row");
    expect(rows.map((r) => r.textContent)).toEqual([
      "Category€%",
      "Produce18.4030",
      "Grains9.2015",
    ]);
  });

  it("marks columns as column headers", () => {
    render(<ChartTable caption="Spend" columns={COLS} rows={ROWS} />);
    expect(
      screen.getAllByRole("columnheader").map((h) => h.textContent),
    ).toEqual(["Category", "€", "%"]);
  });

  it("right-aligns numeric columns", () => {
    render(<ChartTable caption="Spend" columns={COLS} rows={ROWS} />);
    const cells = screen.getAllByRole("cell");
    expect(cells[0]?.className).not.toBe(cells[1]?.className);
    expect(cells[1]?.className).toBe(cells[2]?.className);
  });

  it("says so when there are no rows, without a table", () => {
    render(
      <ChartTable
        caption="Spend"
        columns={COLS}
        rows={[]}
        empty="No spending recorded"
      />,
    );
    expect(screen.getByText("No spending recorded")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ChartTable caption="Spend" columns={COLS} rows={ROWS} />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
