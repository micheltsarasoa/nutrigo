import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MealCheck } from "./MealCheck.tsx";

describe("MealCheck", () => {
  it("is a native checkbox named after the meal", () => {
    render(<MealCheck meal="lunch" />);
    const box = screen.getByRole("checkbox", { name: "Mark lunch as eaten" });
    expect(box.tagName).toBe("INPUT");
    expect((box as HTMLInputElement).checked).toBe(false);
  });

  it("is done when checked, and shows the check icon", () => {
    render(<MealCheck meal="breakfast" checked onChange={() => {}} />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    expect(box.checked).toBe(true);
    const svg = box.parentElement!.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("toggles on click and reports the new value", () => {
    const onChange = vi.fn();
    render(<MealCheck meal="dinner" onChange={onChange} />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledOnce();
    expect(box.checked).toBe(true);
  });

  it("toggles when the 44 px hit area around it is clicked", () => {
    render(<MealCheck meal="snack" />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    fireEvent.click(box.parentElement!);
    expect(box.checked).toBe(true);
  });

  it("is reachable with the keyboard", () => {
    render(<MealCheck meal="lunch" />);
    const box = screen.getByRole("checkbox");
    box.focus();
    expect(document.activeElement).toBe(box);
  });

  it("marks the next meal, as a display state only", () => {
    render(<MealCheck meal="lunch" next />);
    const box = screen.getByRole("checkbox", { name: "Mark lunch as eaten" });
    expect((box as HTMLInputElement).checked).toBe(false);
    expect(box.parentElement!.className).toMatch(/next/);
  });

  it("is a plain todo by default", () => {
    render(<MealCheck meal="lunch" />);
    const box = screen.getByRole("checkbox");
    expect(box.parentElement!.className).not.toMatch(/next/);
  });

  // jsdom still toggles a disabled checkbox on a synthetic click, so this
  // checks the native attribute and focus instead; browsers do the rest.
  it("is natively disabled and out of the tab order", () => {
    render(<MealCheck meal="lunch" disabled />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    expect(box.disabled).toBe(true);
    box.focus();
    expect(document.activeElement).not.toBe(box);
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <>
        <MealCheck meal="breakfast" defaultChecked />
        <MealCheck meal="lunch" />
        <MealCheck meal="snack" next />
        <MealCheck meal="dinner" disabled />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
