import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Checkbox } from "./Checkbox.tsx";

describe("Checkbox", () => {
  it("is a native checkbox with the given name, unchecked by default", () => {
    render(<Checkbox label="Mark oats as bought" />);
    const box = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Mark oats as bought",
    });
    expect(box.tagName).toBe("INPUT");
    expect(box.checked).toBe(false);
  });

  it("shows the tick when checked", () => {
    render(<Checkbox label="Oats" checked onChange={() => {}} />);
    const box = screen.getByRole<HTMLInputElement>("checkbox");
    expect(box.checked).toBe(true);
    expect(
      box.parentElement!.querySelector("svg")!.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("toggles on click and reports it", () => {
    const onChange = vi.fn();
    render(<Checkbox label="Oats" onChange={onChange} />);
    const box = screen.getByRole<HTMLInputElement>("checkbox");
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledOnce();
    expect(box.checked).toBe(true);
  });

  it("toggles when the 44 px area around the box is clicked", () => {
    render(<Checkbox label="Oats" />);
    const box = screen.getByRole<HTMLInputElement>("checkbox");
    fireEvent.click(box.parentElement!);
    expect(box.checked).toBe(true);
  });

  it("takes focus from the keyboard", () => {
    render(<Checkbox label="Oats" />);
    const box = screen.getByRole("checkbox");
    box.focus();
    expect(document.activeElement).toBe(box);
  });

  // jsdom still toggles a disabled checkbox on a synthetic click, so this
  // checks the native attribute and focus instead; browsers do the rest.
  it("when disabled, is natively disabled and out of the tab order", () => {
    render(<Checkbox label="Oats" disabled />);
    const box = screen.getByRole<HTMLInputElement>("checkbox");
    expect(box.disabled).toBe(true);
    box.focus();
    expect(document.activeElement).not.toBe(box);
  });

  it("has no axe violations: unchecked, checked, disabled", async () => {
    const { container } = render(
      <>
        <Checkbox label="One" />
        <Checkbox label="Two" defaultChecked />
        <Checkbox label="Three" disabled />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
