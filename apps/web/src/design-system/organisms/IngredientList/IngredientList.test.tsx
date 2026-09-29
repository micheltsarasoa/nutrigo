import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { IngredientList, type IngredientListItem } from "./IngredientList.tsx";

const rice: IngredientListItem = {
  id: 4,
  href: "/ingredients/4",
  name: "Brown rice",
  category: "grains",
  kcal: 362,
  carbs: 76,
  protein: 7.5,
  fat: 2.7,
  source: null,
};
const kale: IngredientListItem = {
  id: 9,
  href: "/ingredients/9",
  name: "Kale",
  category: "veggies",
  kcal: 35.4,
  carbs: 4.4,
  protein: 2.9,
  fat: 0.7,
  source: "Ciqual",
};
const COUNTS = {
  all: 16,
  grains: 2,
  veggies: 5,
  protein: 2,
  fruits: 2,
  dairy: 2,
  others: 3,
};

function setup(props: Partial<ComponentProps<typeof IngredientList>> = {}) {
  const handlers = {
    onQueryChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onSortChange: vi.fn(),
    onAdd: vi.fn(),
  };
  const view = render(
    <IngredientList
      ingredients={[rice, kale]}
      counts={COUNTS}
      query=""
      category="all"
      sort="name"
      {...handlers}
      {...props}
    />,
  );
  return { ...view, ...handlers };
}

describe("IngredientList", () => {
  it("is a table whose columns say what the numbers are", () => {
    setup();
    const table = screen.getByRole("table", {
      name: "Ingredients, nutrition per 100 g",
    });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((th) => th.textContent),
    ).toEqual(["Name", "Category", "kcal", "Carbs g", "Protein g", "Fat g"]);
    expect(within(table).getAllByRole("row")).toHaveLength(3);
  });

  it("shows a row per ingredient: the name is the link, kcal is whole, macros keep one decimal", () => {
    setup();
    const link = screen.getByRole("link", { name: "Brown rice" });
    expect(link.getAttribute("href")).toBe("/ingredients/4");
    const row = link.closest("tr")!;
    expect(
      within(row)
        .getAllByRole("cell")
        .map((td) => td.textContent),
    ).toEqual(["Grains", "362", "76.0", "7.5", "2.7"]);
    const kaleRow = screen.getByRole("link", { name: "Kale" }).closest("tr")!;
    expect(within(kaleRow).getByText("35")).toBeTruthy();
  });

  it("shows the source chip only when the ingredient has one", () => {
    setup();
    const riceRow = screen
      .getByRole("link", { name: "Brown rice" })
      .closest("tr")!;
    const kaleRow = screen.getByRole("link", { name: "Kale" }).closest("tr")!;
    expect(within(riceRow).queryByText("Ciqual")).toBeNull();
    expect(within(kaleRow).getByText("Ciqual")).toBeTruthy();
  });

  it("shows the toolbar values it is given, with a count on each category", () => {
    setup({ query: "oat", category: "veggies", sort: "protein" });
    expect(
      (
        screen.getByRole("searchbox", {
          name: "Search ingredients",
        }) as HTMLInputElement
      ).value,
    ).toBe("oat");
    expect(
      (screen.getByRole("radio", { name: "Veggies 5" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(screen.getByRole("radio", { name: "All 16" })).toBeTruthy();
    expect(
      (screen.getByRole("combobox", { name: "Sort by" }) as HTMLSelectElement)
        .value,
    ).toBe("protein");
  });

  it("reports search, category and sort changes up", () => {
    const { onQueryChange, onCategoryChange, onSortChange } = setup();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search ingredients" }),
      {
        target: { value: "oat" },
      },
    );
    expect(onQueryChange).toHaveBeenCalledWith("oat");
    fireEvent.click(screen.getByRole("radio", { name: "Dairy 2" }));
    expect(onCategoryChange).toHaveBeenCalledWith("dairy");
    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: "kcal" },
    });
    expect(onSortChange).toHaveBeenCalledWith("kcal");
  });

  it("says it is loading, without a table", () => {
    setup({ ingredients: [], loading: true });
    expect(screen.getByRole("status").textContent).toContain("Loading");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("says nothing matches when a search or category leaves no rows", () => {
    setup({ ingredients: [], query: "pizza" });
    expect(screen.getByText("No ingredients match")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("button", { name: /add/i })).toBeNull();
  });

  it("offers to add the first ingredient when the library is empty", () => {
    const { onAdd } = setup({ ingredients: [] });
    expect(screen.getByText("No ingredients yet")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Add your first ingredient" }),
    );
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("has no axe violations", async () => {
    const { container } = setup();
    expect(await axeViolations(container)).toEqual([]);
  });
});
