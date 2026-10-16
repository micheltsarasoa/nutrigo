import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Legend } from "./Legend.tsx";

const items = [
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
];

describe("Legend", () => {
  it("lists category, € and % for each item", () => {
    render(<Legend items={items} locale="en-IE" />);
    const rows = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(rows.map((r) => r.textContent)).toEqual([
      "Produce€18.40 · 30%",
      "Grains€9.20 · 15%",
    ]);
  });

  it("paints each swatch with the item colour and hides it from screen readers", () => {
    const { container } = render(<Legend items={items} locale="en-IE" />);
    const sw = container.querySelectorAll<HTMLElement>("li > [aria-hidden]");
    expect(sw).toHaveLength(2);
    expect(sw[0]?.style.background).toBe("var(--food-category-veggies)");
  });

  it("works with one item", () => {
    render(<Legend items={items.slice(0, 1)} locale="en-IE" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("names the list when given a label", () => {
    render(<Legend items={items} locale="en-IE" label="Spend by category" />);
    expect(
      screen.getByRole("list", { name: "Spend by category" }),
    ).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Legend items={items} locale="en-IE" label="Spend" />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
