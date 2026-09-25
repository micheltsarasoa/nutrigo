import type { IngredientInput, Source } from "@nutrigo/shared";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { IngredientEditor } from "./IngredientEditor.tsx";

// jsdom has no modal dialogs yet: open and close by the attribute.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

// AC-1: oats, as the owner enters them.
const oats: IngredientInput & { source: Source } = {
  name: "Oats",
  category: "grains",
  kcal100g: 389,
  carbs100g: 66,
  protein100g: 17,
  fat100g: 7,
  fibre100g: 10.6,
  sugars100g: null,
  sodiumMg100g: 2,
  defaultUnit: "g",
  gramsPerUnit: null,
  source: "manual",
};

function setup(props: Partial<ComponentProps<typeof IngredientEditor>> = {}) {
  const handlers = { onSave: vi.fn(), onCancel: vi.fn() };
  const view = render(<IngredientEditor {...handlers} {...props} />);
  return { ...view, ...handlers };
}

const save = () =>
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
const type = (el: HTMLElement, value: string) =>
  fireEvent.change(el, { target: { value } });
const box = (name: string) => screen.getByRole("textbox", { name });
const number = (name: string) =>
  screen.getByRole<HTMLInputElement>("spinbutton", { name });
const select = (name: string) =>
  screen.getByRole<HTMLSelectElement>("combobox", { name });
const error = (field: HTMLElement) =>
  document.getElementById(
    field.getAttribute("aria-describedby")?.split(" ").at(-1) ?? "",
  )?.textContent;

describe("IngredientEditor", () => {
  it("starts empty for a new ingredient, from a manual source", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "New ingredient",
    );
    expect((box("Name") as HTMLInputElement).value).toBe("");
    expect(select("Category").value).toBe("");
    expect(number("Calories").value).toBe("");
    expect(select("Default unit").value).toBe("g");
    expect(screen.getByText("Manual")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("offers the six categories and the three units", () => {
    setup();
    expect(
      [...select("Category").options].slice(1).map((o) => o.value),
    ).toEqual(["grains", "veggies", "protein", "fruits", "dairy", "others"]);
    expect([...select("Default unit").options].map((o) => o.value)).toEqual([
      "g",
      "ml",
      "piece",
    ]);
  });

  it("AC-2: a negative value or an empty kcal shows field errors and saves nothing", () => {
    const { onSave } = setup({ ingredient: oats });
    type(number("Calories"), "");
    type(number("Fat"), "-1");
    save();
    const kcal = number("Calories");
    expect(kcal.getAttribute("aria-invalid")).toBe("true");
    expect(error(kcal)).toBe("Enter a number, 0 or more.");
    expect(error(number("Fat"))).toBe("Enter a number, 0 or more.");
    expect(document.activeElement).toBe(kcal);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows errors for a missing name and category, and a grams per unit of 0", () => {
    const { onSave } = setup();
    type(number("Grams per unit"), "0");
    save();
    expect(error(box("Name"))).toBe("Enter a name, up to 100 characters.");
    expect(error(select("Category"))).toBe("Choose a category.");
    expect(error(number("Grams per unit"))).toBe("Enter a weight above 0.");
    expect(document.activeElement).toBe(box("Name"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a new ingredient as an IngredientInput, optional values null", () => {
    const { onSave } = setup();
    type(box("Name"), "  Egg ");
    type(select("Category"), "protein");
    type(number("Calories"), "143");
    type(number("Carbs"), "0.7");
    type(number("Protein"), "12.6");
    type(number("Fat"), "9.5");
    type(select("Default unit"), "piece");
    type(number("Grams per unit"), "60");
    save();
    expect(onSave).toHaveBeenCalledWith({
      name: "Egg",
      category: "protein",
      kcal100g: 143,
      carbs100g: 0.7,
      protein100g: 12.6,
      fat100g: 9.5,
      fibre100g: null,
      sugars100g: null,
      sodiumMg100g: null,
      defaultUnit: "piece",
      gramsPerUnit: 60,
    });
  });

  it("fills in an ingredient to edit, and saves it unchanged without its source", () => {
    const { onSave } = setup({ ingredient: oats, onDelete: vi.fn() });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Edit ingredient",
    );
    expect(select("Category").value).toBe("grains");
    expect(number("Calories").value).toBe("389");
    expect(number("Fibre").value).toBe("10.6");
    expect(number("Sugars").value).toBe("");
    save();
    const { source: _, ...input } = oats;
    expect(onSave).toHaveBeenCalledWith(input);
  });

  it("names the source of an imported ingredient", () => {
    setup({ ingredient: { ...oats, source: "ciqual" } });
    expect(screen.getByText("Ciqual")).toBeTruthy();
  });

  it("shows the units next to the nutrition values", () => {
    setup();
    expect(error(number("Calories"))).toBe("kcal");
    expect(error(number("Carbs"))).toBe("g");
    expect(error(number("Sodium"))).toBe("mg");
  });

  it("while saving, Save is busy and doesn't save twice", () => {
    const { onSave } = setup({ ingredient: oats, saving: true });
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.submit(button.closest("form")!);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a server error and keeps the input", () => {
    const { rerender, onSave, onCancel } = setup({ ingredient: oats });
    type(box("Name"), "Rolled oats");
    rerender(
      <IngredientEditor
        ingredient={oats}
        error="The ingredient couldn't be saved. Try again."
        onSave={onSave}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "The ingredient couldn't be saved. Try again.",
    );
    expect((box("Name") as HTMLInputElement).value).toBe("Rolled oats");
  });

  it("AC-9: lists the recipes that still use it", () => {
    setup({
      ingredient: oats,
      onDelete: vi.fn(),
      error: "This ingredient can't be deleted.",
      usedBy: ["Overnight oats", "Oat pancakes"],
    });
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Used by these recipes:")).toBeTruthy();
    expect(
      within(alert)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Overnight oats", "Oat pancakes"]);
  });

  it("asks before deleting, and deletes on confirm", () => {
    const onDelete = vi.fn();
    setup({ ingredient: oats, onDelete });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", {
      name: "Delete this ingredient?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Keep it" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete",
      }),
    );
    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancels at once when nothing changed", () => {
    const { onCancel } = setup({ ingredient: oats });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks before discarding changes", () => {
    const { onCancel } = setup({ ingredient: oats });
    type(box("Name"), "Rolled oats");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const dialog = screen.getByRole("dialog", {
      name: "Discard your changes?",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Keep editing" }),
    );
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("is usable with the keyboard", () => {
    setup({ ingredient: oats, onDelete: vi.fn() });
    for (const el of [
      box("Name"),
      select("Category"),
      number("Calories"),
      screen.getByRole("button", { name: "Delete" }),
      screen.getByRole("button", { name: "Save" }),
    ]) {
      el.focus();
      expect(document.activeElement).toBe(el);
    }
  });

  it("has no axe violations: new, edit, errors, server error, used by, delete", async () => {
    for (const props of [
      {},
      { ingredient: oats, onDelete: vi.fn() },
      {
        ingredient: oats,
        error: "This ingredient can't be deleted.",
        usedBy: ["Overnight oats"],
      },
    ]) {
      const { container, unmount } = setup(props);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
    const { container } = setup({ ingredient: oats, onDelete: vi.fn() });
    type(number("Calories"), "-5");
    save();
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
