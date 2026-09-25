import type { RecipeInput } from "@nutrigo/shared";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { RecipeEditor } from "./RecipeEditor.tsx";

// jsdom has no modal dialogs yet: open and close by the attribute.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

const pantry = [
  { id: 1, name: "turkey breast", defaultUnit: "g" as const },
  { id: 2, name: "brown rice", defaultUnit: "g" as const },
  { id: 3, name: "lemon", defaultUnit: "piece" as const },
];

const turkey: RecipeInput = {
  name: "Grilled turkey",
  description: "A lean lunch.",
  mealType: "lunch",
  servings: 2,
  difficulty: "medium",
  prepMin: 10,
  cookMin: 15,
  rating: 4,
  notes: "Marinate it first.",
  ingredients: [
    { ingredientId: 1, quantity: 250, unit: "g" },
    { ingredientId: 2, quantity: 100, unit: "g" },
    { ingredientId: 3, quantity: 1, unit: "piece" },
  ],
  steps: [
    { title: "Grill the turkey", body: "6 minutes a side." },
    { title: "Serve", body: "" },
  ],
  tools: [{ name: "Grill pan" }, { name: "Tongs" }],
};

function setup(props: Partial<ComponentProps<typeof RecipeEditor>> = {}) {
  const handlers = { onSave: vi.fn(), onCancel: vi.fn() };
  const view = render(
    <RecipeEditor ingredients={pantry} {...handlers} {...props} />,
  );
  return { ...view, ...handlers };
}

const save = () =>
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
const type = (el: HTMLElement, value: string) =>
  fireEvent.change(el, { target: { value } });
const group = (name: string) => screen.getByRole("group", { name });
const error = (field: HTMLElement) =>
  document.getElementById(
    field.getAttribute("aria-describedby")?.split(" ").at(-1) ?? "",
  )?.textContent;

describe("RecipeEditor", () => {
  it("starts empty for a new recipe", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "New recipe",
    );
    expect(
      (screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement).value,
    ).toBe("");
    expect(
      screen
        .getByRole("spinbutton", { name: "Servings" })
        .getAttribute("aria-valuenow"),
    ).toBe("1");
    expect(screen.queryByRole("group", { name: /^Ingredient/ })).toBeNull();
  });

  it("shows field errors next to the fields and doesn't save", () => {
    const { onSave } = setup();
    save();
    const name = screen.getByRole("textbox", { name: "Name" });
    const meal = screen.getByRole("combobox", { name: "Meal type" });
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(error(name)).toBe("Enter a name, up to 100 characters.");
    expect(error(meal)).toBe("Choose a meal type.");
    expect(document.activeElement).toBe(name);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a new recipe as a RecipeInput", () => {
    const { onSave } = setup();
    type(screen.getByRole("textbox", { name: "Name" }), "  Oat porridge ");
    type(screen.getByRole("combobox", { name: "Meal type" }), "breakfast");
    type(screen.getByRole("spinbutton", { name: "Prep time" }), "5");
    save();
    expect(onSave).toHaveBeenCalledWith({
      name: "Oat porridge",
      description: null,
      mealType: "breakfast",
      servings: 1,
      difficulty: null,
      prepMin: 5,
      cookMin: null,
      rating: null,
      notes: null,
      ingredients: [],
      steps: [],
      tools: [],
    });
  });

  it("fills in a recipe to edit, and saves it unchanged", () => {
    const { onSave } = setup({ recipe: turkey });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Edit recipe",
    );
    expect(
      within(group("Ingredient 3")).getByRole<HTMLSelectElement>("combobox", {
        name: "Ingredient",
      }).value,
    ).toBe("3");
    expect(
      within(group("Step 1")).getByRole<HTMLInputElement>("textbox", {
        name: "Title",
      }).value,
    ).toBe("Grill the turkey");
    expect(
      within(group("Tool 2")).getByRole<HTMLInputElement>("textbox", {
        name: "Tool",
      }).value,
    ).toBe("Tongs");
    save();
    expect(onSave).toHaveBeenCalledWith(turkey);
  });

  it("adds, moves and removes ingredient lines, taking the ingredient's unit", () => {
    const { onSave } = setup({ recipe: { ...turkey, ingredients: [] } });
    fireEvent.click(screen.getByRole("button", { name: "Add ingredient" }));
    fireEvent.click(screen.getByRole("button", { name: "Add ingredient" }));
    const first = group("Ingredient 1");
    type(within(first).getByRole("combobox", { name: "Ingredient" }), "3");
    expect(
      within(first).getByRole<HTMLSelectElement>("combobox", { name: "Unit" })
        .value,
    ).toBe("piece");
    type(within(first).getByRole("spinbutton", { name: "Quantity" }), "2");
    const second = group("Ingredient 2");
    type(within(second).getByRole("combobox", { name: "Ingredient" }), "1");
    type(within(second).getByRole("spinbutton", { name: "Quantity" }), "200");
    expect(
      screen
        .getByRole<HTMLButtonElement>("button", {
          name: "Move up ingredient 1",
        })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Move up ingredient 2" }),
    );
    save();
    expect(onSave.mock.lastCall?.[0].ingredients).toEqual([
      { ingredientId: 1, quantity: 200, unit: "g" },
      { ingredientId: 3, quantity: 2, unit: "piece" },
    ]);
    fireEvent.click(
      screen.getByRole("button", { name: "Remove ingredient 1" }),
    );
    save();
    expect(onSave.mock.lastCall?.[0].ingredients).toEqual([
      { ingredientId: 3, quantity: 2, unit: "piece" },
    ]);
  });

  it("adds, moves and removes steps and tools", () => {
    const { onSave } = setup({ recipe: turkey });
    fireEvent.click(screen.getByRole("button", { name: "Add step" }));
    type(
      within(group("Step 3")).getByRole("textbox", { name: "Title" }),
      "Rest",
    );
    fireEvent.click(screen.getByRole("button", { name: "Move down step 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove tool 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add tool" }));
    type(
      within(group("Tool 2")).getByRole("textbox", { name: "Tool" }),
      "Knife",
    );
    save();
    const saved = onSave.mock.lastCall?.[0];
    expect(saved.steps.map((s: { title: string }) => s.title)).toEqual([
      "Serve",
      "Grill the turkey",
      "Rest",
    ]);
    expect(saved.tools).toEqual([{ name: "Tongs" }, { name: "Knife" }]);
  });

  it("shows line errors next to the line's field", () => {
    const { onSave } = setup({
      recipe: {
        ...turkey,
        ingredients: [
          { ingredientId: 1, quantity: 250, unit: "g" },
          { ingredientId: 1, quantity: 50, unit: "g" },
        ],
        steps: [{ title: "Grill", body: "" }],
      },
    });
    type(
      within(group("Ingredient 1")).getByRole("spinbutton", {
        name: "Quantity",
      }),
      "0",
    );
    type(within(group("Step 1")).getByRole("textbox", { name: "Title" }), " ");
    save();
    expect(
      error(
        within(group("Ingredient 1")).getByRole("spinbutton", {
          name: "Quantity",
        }),
      ),
    ).toBe("Enter a quantity above 0.");
    expect(
      error(
        within(group("Ingredient 2")).getByRole("combobox", {
          name: "Ingredient",
        }),
      ),
    ).toBe("Ingredient listed twice");
    expect(
      error(within(group("Step 1")).getByRole("textbox", { name: "Title" })),
    ).toBe("Enter a title, up to 100 characters.");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("sets the servings and rating, and clears the rating", () => {
    const { onSave } = setup({ recipe: turkey });
    const servings = screen.getByRole("spinbutton", { name: "Servings" });
    fireEvent.keyDown(servings, { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    save();
    expect(onSave.mock.lastCall?.[0]).toMatchObject({ servings: 3, rating: 5 });
    fireEvent.click(screen.getByRole("button", { name: "Clear rating" }));
    save();
    expect(onSave.mock.lastCall?.[0].rating).toBeNull();
  });

  it("while saving, Save is busy and doesn't save twice", () => {
    const { onSave } = setup({ recipe: turkey, saving: true });
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    fireEvent.submit(button.closest("form")!);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a server error and keeps the input", () => {
    const { rerender, onSave, onCancel } = setup({ recipe: turkey });
    type(screen.getByRole("textbox", { name: "Name" }), "Turkey bowl");
    rerender(
      <RecipeEditor
        recipe={turkey}
        ingredients={pantry}
        error="The recipe couldn't be saved. Try again."
        onSave={onSave}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "The recipe couldn't be saved. Try again.",
    );
    expect(
      (screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement).value,
    ).toBe("Turkey bowl");
  });

  it("cancels at once when nothing changed", () => {
    const { onCancel } = setup({ recipe: turkey });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks before discarding changes", () => {
    const { onCancel } = setup({ recipe: turkey });
    type(screen.getByRole("textbox", { name: "Name" }), "Turkey bowl");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const dialog = screen.getByRole("dialog", {
      name: "Discard your changes?",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Keep editing" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("is usable with the keyboard", () => {
    setup();
    const name = screen.getByRole("textbox", { name: "Name" });
    name.focus();
    expect(document.activeElement).toBe(name);
    const servings = screen.getByRole("spinbutton", { name: "Servings" });
    servings.focus();
    fireEvent.keyDown(servings, { key: "End" });
    expect(servings.getAttribute("aria-valuenow")).toBe("12");
  });

  it("has no axe violations: new, edit, errors, server error, discard", async () => {
    for (const props of [
      {},
      { recipe: turkey },
      { recipe: turkey, error: "The recipe couldn't be saved. Try again." },
    ]) {
      const { container, unmount } = setup(props);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
    const { container } = setup({ recipe: turkey });
    type(screen.getByRole("textbox", { name: "Name" }), "");
    save();
    expect(await axeViolations(container)).toEqual([]);
    type(screen.getByRole("textbox", { name: "Name" }), "Bowl");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
