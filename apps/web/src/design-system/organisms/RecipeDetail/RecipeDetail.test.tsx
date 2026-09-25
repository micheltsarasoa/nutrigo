import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { RecipeDetail, type RecipeDetailData } from "./RecipeDetail.tsx";

const turkey: RecipeDetailData = {
  title: "Grilled turkey with brown rice",
  mealType: "lunch",
  description: "A lean and balanced lunch.",
  photo: "/photos/7.jpg",
  mosaic: [],
  prepTime: "10 min",
  cookTime: "15 min",
  difficulty: "Medium",
  healthScore: 9,
  rating: 4,
  macros: { kcal: "540", carbs: "61", protein: "42", fat: "14" },
  nutrition: [
    { label: "Fibre", value: "6 g" },
    { label: "Sodium", value: null },
  ],
  ingredients: [
    { quantity: "200 g", name: "turkey breast" },
    { quantity: "1 piece", name: "lemon" },
  ],
  steps: [
    { title: "Prepare the turkey", body: "Season it." },
    { title: "Grill the turkey", body: "" },
  ],
  tools: ["Grill pan", "Tongs"],
  notes: ["Marinate it first."],
};
const minimal: RecipeDetailData = {
  ...turkey,
  description: null,
  rating: null,
  prepTime: null,
  steps: [],
  tools: [],
  notes: [],
};

function setup(props: Partial<ComponentProps<typeof RecipeDetail>> = {}) {
  const handlers = { onServingsChange: vi.fn(), onBack: vi.fn() };
  const view = render(
    <RecipeDetail recipe={turkey} servings={2} {...handlers} {...props} />,
  );
  return { ...view, ...handlers };
}

// Each section heading sits directly in its section, so the parent always exists.
const section = (name: string) =>
  screen.getByRole("heading", { level: 2, name }).parentElement!;

describe("RecipeDetail", () => {
  it("is headed by the recipe title, with its meal type, rating and description", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Grilled turkey with brown rice",
    );
    expect(screen.getByText("Lunch")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Rated 4 out of 5" })).toBeTruthy();
    expect(screen.getByText("A lean and balanced lunch.")).toBeTruthy();
  });

  it("lists prep, cook, difficulty, steps and health score, with – when missing", () => {
    const { rerender } = setup();
    const terms = screen.getAllByRole("term").map((t) => t.textContent);
    const values = screen.getAllByRole("definition").map((d) => d.textContent);
    expect(terms).toEqual([
      "Prep time",
      "Cook time",
      "Difficulty",
      "Steps",
      "Health score",
    ]);
    expect(values).toEqual(["10 min", "15 min", "Medium", "2 steps", "9/10"]);
    rerender(
      <RecipeDetail
        recipe={minimal}
        servings={2}
        onServingsChange={() => {}}
        onBack={() => {}}
      />,
    );
    const after = screen.getAllByRole("definition").map((d) => d.textContent);
    expect(after[0]).toBe("–");
    expect(after[3]).toBe("–");
  });

  it("shows the 4 macro tiles per serving", () => {
    const { container } = setup();
    const text = container.textContent ?? "";
    for (const part of ["540kcal", "61g", "42g", "14g"]) {
      expect(text).toContain(part);
    }
  });

  it("lists the ingredients it is given, under a servings stepper", () => {
    const { onServingsChange } = setup({ servings: 3 });
    const ingredients = section("Ingredients");
    expect(
      within(ingredients)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["1200 g turkey breast", "21 piece lemon"]);
    const stepper = within(ingredients).getByRole("spinbutton", {
      name: "Servings",
    });
    expect(stepper.getAttribute("aria-valuenow")).toBe("3");
    fireEvent.keyDown(stepper, { key: "ArrowUp" });
    expect(onServingsChange).toHaveBeenCalledWith(4);
  });

  it("shows directions, tools and notes in order", () => {
    setup();
    expect(
      within(section("Directions"))
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(["Prepare the turkey", "Grill the turkey"]);
    expect(
      within(section("Tools & equipment"))
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["1Grill pan", "2Tongs"]);
    expect(
      within(section("Notes")).getByText("Marinate it first."),
    ).toBeTruthy();
  });

  it("leaves out directions, tools and notes when there are none", () => {
    setup({ recipe: minimal });
    for (const name of ["Directions", "Tools & equipment", "Notes"]) {
      expect(screen.queryByRole("heading", { name })).toBeNull();
    }
    expect(screen.queryByRole("img", { name: /Rated/ })).toBeNull();
  });

  it("shows nutrition facts per serving, calories first", () => {
    setup();
    const rows = within(section("Nutrition facts")).getAllByRole("row");
    expect(rows.map((r) => r.textContent)).toEqual([
      "CaloriesPer serving540 kcal",
      "Fibre6 g",
      "Sodium–",
    ]);
  });

  it("announces loading instead of the recipe", () => {
    setup({ recipe: null, loading: true });
    expect(screen.getByRole("status").textContent).toBe("Loading recipe…");
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("says the recipe was not found, with a way back", () => {
    const { onBack } = setup({ recipe: null });
    expect(
      screen.getByRole("heading", { level: 1, name: "Recipe not found" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to recipes" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("is usable with the keyboard", () => {
    setup();
    const stepper = screen.getByRole("spinbutton", { name: "Servings" });
    stepper.focus();
    expect(document.activeElement).toBe(stepper);
  });

  it("has no axe violations: full, minimal, loading, not found", async () => {
    for (const props of [
      {},
      { recipe: minimal },
      { recipe: null, loading: true },
      { recipe: null },
    ]) {
      const { container, unmount } = setup(props);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});
