import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { RecipeList, type RecipeListItem } from "./RecipeList.tsx";

const turkey: RecipeListItem = {
  id: 7,
  href: "/recipes/7",
  title: "Grilled turkey with brown rice",
  mealType: "lunch",
  kcal: 540,
  totalTime: "35 min",
  healthScore: 9,
  rating: 4,
  photo: "/photos/7.jpg",
  mosaic: [],
};
const oats: RecipeListItem = {
  ...turkey,
  id: 8,
  href: "/recipes/8",
  title: "Overnight oats",
  mealType: "breakfast",
  totalTime: null,
  rating: null,
  photo: null,
};

function setup(props: Partial<ComponentProps<typeof RecipeList>> = {}) {
  const handlers = {
    onQueryChange: vi.fn(),
    onMealTypeChange: vi.fn(),
    onSortChange: vi.fn(),
    onViewChange: vi.fn(),
    onAdd: vi.fn(),
  };
  const view = render(
    <RecipeList
      recipes={[turkey, oats]}
      query=""
      mealType="all"
      sort="name"
      view="list"
      {...handlers}
      {...props}
    />,
  );
  return { ...view, ...handlers };
}

describe("RecipeList", () => {
  it("lists each recipe as a link, with its meal type", () => {
    setup();
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/recipes/7",
      "/recipes/8",
    ]);
    expect(links[0]?.textContent).toContain("Lunch");
    expect(links[1]?.textContent).toContain("Breakfast");
  });

  it("shows the toolbar values it is given", () => {
    setup({ query: "chick", mealType: "dinner", sort: "kcal", view: "grid" });
    expect(
      (
        screen.getByRole("searchbox", {
          name: "Search recipes",
        }) as HTMLInputElement
      ).value,
    ).toBe("chick");
    expect(
      (screen.getByRole("radio", { name: "Dinner" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("combobox", { name: "Sort by" }) as HTMLSelectElement)
        .value,
    ).toBe("kcal");
    expect(
      (screen.getByRole("radio", { name: "Grid view" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  it("offers the 5 sorts of SPEC-002", () => {
    setup();
    const sort = screen.getByRole("combobox", { name: "Sort by" });
    expect(
      within(sort)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Name", "Calories", "Health score", "Total time", "Rating"]);
  });

  it("reports search, filter, sort and view changes up", () => {
    const { onQueryChange, onMealTypeChange, onSortChange, onViewChange } =
      setup();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "chick" },
    });
    expect(onQueryChange).toHaveBeenCalledWith("chick");
    fireEvent.click(screen.getByRole("radio", { name: "Dinner" }));
    expect(onMealTypeChange).toHaveBeenCalledWith("dinner");
    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: "rating" },
    });
    expect(onSortChange).toHaveBeenCalledWith("rating");
    fireEvent.click(screen.getByRole("radio", { name: "Grid view" }));
    expect(onViewChange).toHaveBeenCalledWith("grid");
  });

  it("has an Add recipe button", () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Add recipe" }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("invites you to add a first recipe when the library is empty", () => {
    const { onAdd } = setup({ recipes: [] });
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByText("No recipes yet")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Add your first recipe" }),
    );
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("says nothing matches when a search or filter hides every recipe", () => {
    setup({ recipes: [], query: "zzz" });
    expect(screen.getByText("No recipes match")).toBeTruthy();
    expect(screen.queryByText("No recipes yet")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Add your first recipe" }),
    ).toBeNull();
  });

  it("counts a meal-type filter as a search too", () => {
    setup({ recipes: [], mealType: "snack" });
    expect(screen.getByText("No recipes match")).toBeTruthy();
  });

  it("announces loading instead of the list or an empty message", () => {
    setup({ recipes: [], loading: true });
    expect(screen.getByRole("status").textContent).toBe("Loading recipes…");
    expect(screen.queryByText("No recipes yet")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("is usable with the keyboard", () => {
    setup();
    for (const el of [
      screen.getByRole("searchbox"),
      screen.getByRole("radio", { name: "All" }),
      screen.getByRole("combobox", { name: "Sort by" }),
      screen.getByRole("radio", { name: "List view" }),
      screen.getByRole("button", { name: "Add recipe" }),
      ...screen.getAllByRole("link").slice(0, 1),
    ]) {
      el.focus();
      expect(document.activeElement).toBe(el);
    }
  });

  it("has no axe violations: list, grid, empty, no results, loading", async () => {
    for (const props of [
      {},
      { view: "grid" as const },
      { recipes: [] },
      { recipes: [], query: "zzz" },
      { recipes: [], loading: true },
    ]) {
      const { container, unmount } = setup(props);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});
