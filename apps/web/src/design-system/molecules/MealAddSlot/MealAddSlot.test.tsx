import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MealAddSlot } from "./MealAddSlot.tsx";

describe("MealAddSlot", () => {
  it("is a button named by its slot, so 28 of them stay distinguishable", () => {
    render(<MealAddSlot label="Add lunch on Tue" onAdd={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Add lunch on Tue" }),
    ).toBeTruthy();
  });

  it("SPEC-003 AC-3: calls onAdd on click", () => {
    const onAdd = vi.fn();
    render(<MealAddSlot label="Add lunch on Tue" onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("SPEC-003 AC-11: is reachable with the keyboard", () => {
    render(<MealAddSlot label="Add lunch on Tue" onAdd={vi.fn()} />);
    const button = screen.getByRole("button");
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <MealAddSlot label="Add lunch on Tue" onAdd={vi.fn()} />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
