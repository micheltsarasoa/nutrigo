import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MealActionsMenu } from "./MealActionsMenu.tsx";

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

const days = [
  "Mon 5",
  "Tue 6",
  "Wed 7",
  "Thu 8",
  "Fri 9",
  "Sat 10",
  "Sun 11",
].map((label, i) => ({
  date: `2026-10-${String(5 + i).padStart(2, "0")}`,
  label,
}));

function renderMenu(
  props: Partial<ComponentProps<typeof MealActionsMenu>> = {},
) {
  const handlers = {
    onServings: vi.fn(),
    onMove: vi.fn(),
    onDuplicate: vi.fn(),
    onRemove: vi.fn(),
    onClose: vi.fn(),
  };
  const view = render(
    <MealActionsMenu
      open
      title="Chicken curry"
      servings={2}
      date="2026-10-06"
      slot="lunch"
      days={days}
      {...handlers}
      {...props}
    />,
  );
  return { ...view, ...handlers };
}

const button = (name: string) => screen.getByRole("button", { name });
const pick = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("MealActionsMenu", () => {
  it("is a dialog named by the recipe, offering the four actions", () => {
    renderMenu();
    expect(screen.getByRole("dialog", { name: "Chicken curry" })).toBeTruthy();
    for (const name of ["Change servings", "Move", "Duplicate", "Remove"])
      expect(button(name)).toBeTruthy();
  });

  it("changes servings from the current value (AC-4)", () => {
    const { onServings } = renderMenu();
    fireEvent.click(button("Change servings"));
    const spin = screen.getByRole("spinbutton", { name: "Servings" });
    expect(spin.getAttribute("aria-valuenow")).toBe("2");
    expect((button("Save") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button("Increase Servings"));
    fireEvent.click(button("Save"));
    expect(onServings).toHaveBeenCalledWith(3);
  });

  it("moves to another day and slot (AC-5)", () => {
    const { onMove } = renderMenu();
    fireEvent.click(button("Move"));
    expect((screen.getByLabelText("Day") as HTMLSelectElement).value).toBe(
      "2026-10-06",
    );
    expect((screen.getByLabelText("Slot") as HTMLSelectElement).value).toBe(
      "lunch",
    );
    expect((button("Move") as HTMLButtonElement).disabled).toBe(true);
    pick("Day", "2026-10-08");
    pick("Slot", "dinner");
    fireEvent.click(button("Move"));
    expect(onMove).toHaveBeenCalledWith("2026-10-08", "dinner");
  });

  it("duplicates, even into the same slot (AC-9)", () => {
    const { onDuplicate } = renderMenu();
    fireEvent.click(button("Duplicate"));
    fireEvent.click(button("Duplicate"));
    expect(onDuplicate).toHaveBeenCalledWith("2026-10-06", "lunch");
  });

  it("removes only after a confirmation (AC-6)", () => {
    const { onRemove } = renderMenu();
    fireEvent.click(button("Remove"));
    expect(screen.getByText(/Remove Chicken curry from Tue 6/)).toBeTruthy();
    expect(onRemove).not.toHaveBeenCalled();
    fireEvent.click(button("Remove"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("goes back to the actions from a step", () => {
    renderMenu();
    fireEvent.click(button("Move"));
    fireEvent.click(button("Back"));
    expect(button("Remove")).toBeTruthy();
  });

  it("starts at the actions when reopened", () => {
    const { rerender, ...handlers } = renderMenu();
    fireEvent.click(button("Move"));
    const props = {
      title: "Chicken curry",
      servings: 2,
      date: "2026-10-06",
      slot: "lunch" as const,
      days,
      ...handlers,
    };
    rerender(<MealActionsMenu open={false} {...props} />);
    rerender(<MealActionsMenu open {...props} />);
    expect(button("Change servings")).toBeTruthy();
  });

  it("closes once on Cancel", () => {
    const { onClose } = renderMenu();
    fireEvent.click(button("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error and marks the confirm button busy while saving", () => {
    renderMenu({ error: "Couldn’t update the meal.", saving: true });
    fireEvent.click(button("Remove"));
    expect(screen.getByRole("alert").textContent).toContain("Couldn’t update");
    expect(button("Remove").getAttribute("aria-busy")).toBe("true");
  });

  it("has no axe violations on the actions or a step", async () => {
    const { container } = renderMenu();
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.click(button("Move"));
    expect(await axeViolations(container)).toEqual([]);
  });
});
