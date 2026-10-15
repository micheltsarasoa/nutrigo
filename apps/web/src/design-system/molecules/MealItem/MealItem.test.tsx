import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MealItem } from "./MealItem.tsx";

const base = {
  name: "Lentil and carrot soup",
  mealType: "lunch" as const,
  kcal: 540,
  servings: 2,
  photo: null,
  mosaic: [],
  eaten: false,
  onToggle: () => {},
};

describe("MealItem", () => {
  it("planned: slot, name, servings, kcal and an unchecked check", () => {
    render(<MealItem {...base} />);
    expect(screen.getByText("Lunch")).toBeTruthy();
    expect(screen.getByText("Lentil and carrot soup")).toBeTruthy();
    expect(screen.getByText("2 servings")).toBeTruthy();
    expect(screen.getByText("540 kcal")).toBeTruthy();
    const box = screen.getByRole("checkbox", {
      name: "Mark lunch as eaten",
    }) as HTMLInputElement;
    expect(box.checked).toBe(false);
  });

  it("says '1 serving' in the singular", () => {
    render(<MealItem {...base} servings={1} />);
    expect(screen.getByText("1 serving")).toBeTruthy();
  });

  it("eaten: checked, and the title is muted", () => {
    render(<MealItem {...base} eaten />);
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
    expect(screen.getByText("Lentil and carrot soup").className).toContain(
      "muted",
    );
  });

  it("eaten with other servings: pill '1.5 eaten' and meta 'Planned 2'", () => {
    render(<MealItem {...base} eaten eatenServings={1.5} />);
    expect(screen.getByText("1.5 eaten")).toBeTruthy();
    expect(screen.getByText("Planned 2")).toBeTruthy();
    expect(screen.queryByText("2 servings")).toBeNull();
  });

  it("eaten with the planned servings: no pill", () => {
    render(<MealItem {...base} eaten eatenServings={2} />);
    expect(screen.queryByText("2 eaten")).toBeNull();
    expect(screen.getByText("2 servings")).toBeTruthy();
  });

  it("next: slot label 'Lunch · next' and a highlighted row", () => {
    const { container } = render(<MealItem {...base} next />);
    expect(screen.getByText("Lunch · next")).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toContain("next");
  });

  it("disabled (future day): dimmed, check disabled and explained", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <MealItem {...base} mealType="dinner" disabled onToggle={onToggle} />,
    );
    const box = screen.getByRole("checkbox", {
      name: "Mark dinner as eaten, available on the day",
    }) as HTMLInputElement;
    expect(box.disabled).toBe(true);
    expect(box.getAttribute("aria-disabled")).toBe("true");
    expect((container.firstChild as HTMLElement).className).toContain("off");
    fireEvent.click(box);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("click calls onToggle with the new value", () => {
    const onToggle = vi.fn();
    render(<MealItem {...base} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("eaten: unchecking reports false", () => {
    const onToggle = vi.fn();
    render(<MealItem {...base} eaten onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  // jsdom does not turn Space into a click; browsers do for a focusable native checkbox.
  it("keyboard: the check is a focusable native checkbox", () => {
    render(<MealItem {...base} />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    expect(box.tagName).toBe("INPUT");
    expect(box.tabIndex).toBeGreaterThanOrEqual(0);
    box.focus();
    expect(document.activeElement).toBe(box);
  });

  it("a long name carries its full text as a tooltip", () => {
    render(<MealItem {...base} name="A very long recipe name" />);
    expect(screen.getByText("A very long recipe name").title).toBe(
      "A very long recipe name",
    );
  });

  it.each([
    ["planned", {}],
    ["eaten", { eaten: true }],
    ["eaten other servings", { eaten: true, eatenServings: 1.5 }],
    ["next", { next: true }],
    ["disabled", { disabled: true }],
  ])("has no axe violations: %s", async (_n, extra) => {
    const { container } = render(<MealItem {...base} {...extra} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
