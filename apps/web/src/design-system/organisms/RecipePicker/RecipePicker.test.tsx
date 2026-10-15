import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { RecipePicker, type PickerRecipe } from "./RecipePicker.tsx";

// jsdom has no modal dialogs yet: see SettingsDialog.test.tsx.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

const recipes: PickerRecipe[] = [
  {
    id: 1,
    title: "Greek yoghurt bowl",
    mealType: "breakfast",
    kcalPerServing: 320,
    photo: null,
    mosaic: [],
  },
  {
    id: 2,
    title: "Chicken curry",
    mealType: "dinner",
    kcalPerServing: 640,
    photo: null,
    mosaic: [],
  },
];

function renderPicker(
  props: Partial<ComponentProps<typeof RecipePicker>> = {},
) {
  const handlers = {
    onQueryChange: vi.fn(),
    onPick: vi.fn(),
    onClose: vi.fn(),
  };
  const view = render(
    <RecipePicker
      open
      heading="Add to Tuesday · Lunch"
      recipes={recipes}
      query=""
      {...handlers}
      {...props}
    />,
  );
  return { ...view, ...handlers };
}

const row = (name: RegExp) => screen.getByRole("button", { name });

describe("RecipePicker", () => {
  it("is a dialog named by its heading", () => {
    renderPicker();
    expect(
      screen.getByRole("dialog", { name: "Add to Tuesday · Lunch" }),
    ).toBeInTheDocument();
  });

  it("lists every recipe with its kcal per serving", () => {
    renderPicker();
    expect(row(/Greek yoghurt bowl/)).toHaveTextContent("320 kcal");
    expect(row(/Chicken curry/)).toHaveTextContent("640 kcal");
  });

  it("reports what is typed in the search field", () => {
    const { onQueryChange } = renderPicker();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search recipes" }),
      {
        target: { value: "curry" },
      },
    );
    expect(onQueryChange).toHaveBeenCalledWith("curry");
  });

  it("says when nothing matches the search", () => {
    renderPicker({ recipes: [], query: "pizza" });
    expect(screen.getByText("No recipes match")).toBeInTheDocument();
  });

  it("says when there are no recipes at all", () => {
    renderPicker({ recipes: [] });
    expect(screen.getByText("No recipes yet")).toBeInTheDocument();
  });

  it("shows a status instead of the list while loading", () => {
    renderPicker({ loading: true });
    expect(screen.getByRole("status")).toHaveTextContent("Loading recipes");
    expect(screen.queryByText("Chicken curry")).not.toBeInTheDocument();
  });

  it("asks for servings after a recipe is picked, starting at 1", () => {
    renderPicker();
    fireEvent.click(row(/Chicken curry/));
    expect(
      screen.getByRole("spinbutton", { name: "Servings" }),
    ).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText("640 kcal")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("doubles the kcal with 2 servings and adds with them", () => {
    const { onPick } = renderPicker();
    fireEvent.click(row(/Chicken curry/));
    fireEvent.click(screen.getByRole("button", { name: "Increase Servings" }));
    expect(screen.getByText("1,280 kcal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onPick).toHaveBeenCalledWith(recipes[1], 2);
  });

  it("goes back to the list from the servings step", () => {
    renderPicker({ query: "curry" });
    fireEvent.click(row(/Chicken curry/));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("searchbox")).toHaveValue("curry");
  });

  it("starts again at the list when reopened", () => {
    const { rerender, onQueryChange, onPick, onClose } = renderPicker();
    fireEvent.click(row(/Chicken curry/));
    const props = {
      heading: "Add",
      recipes,
      query: "",
      onQueryChange,
      onPick,
      onClose,
    };
    rerender(<RecipePicker open={false} {...props} />);
    rerender(<RecipePicker open {...props} />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("closes once on Cancel", () => {
    const { onClose } = renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error and keeps the servings step", () => {
    renderPicker({ error: "Couldn’t add the meal." });
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t add");
  });

  it("marks Add busy while saving", () => {
    renderPicker({ saving: true });
    fireEvent.click(row(/Chicken curry/));
    expect(screen.getByRole("button", { name: "Add" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("has no axe violations on either step", async () => {
    const { container } = renderPicker();
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.click(row(/Chicken curry/));
    expect(await axeViolations(container)).toEqual([]);
  });
});
