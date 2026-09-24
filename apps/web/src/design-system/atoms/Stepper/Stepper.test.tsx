import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Stepper } from "./Stepper.tsx";

function setup(props: Partial<Parameters<typeof Stepper>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <Stepper
      label="Servings"
      value={2}
      min={1}
      max={10}
      onChange={onChange}
      {...props}
    />,
  );
  return {
    onChange,
    spin: screen.getByRole("spinbutton", { name: "Servings" }),
    dec: screen.getByRole("button", {
      name: "Decrease Servings",
    }) as HTMLButtonElement,
    inc: screen.getByRole("button", {
      name: "Increase Servings",
    }) as HTMLButtonElement,
  };
}

describe("Stepper", () => {
  it("is a spinbutton showing the value and its bounds", () => {
    const { spin } = setup();
    expect(spin.textContent).toBe("2");
    expect(spin.getAttribute("aria-valuenow")).toBe("2");
    expect(spin.getAttribute("aria-valuemin")).toBe("1");
    expect(spin.getAttribute("aria-valuemax")).toBe("10");
  });

  it("is one tab stop: the value, not the buttons", () => {
    const { spin, dec, inc } = setup();
    expect(spin.tabIndex).toBe(0);
    expect(dec.tabIndex).toBe(-1);
    expect(inc.tabIndex).toBe(-1);
    spin.focus();
    expect(document.activeElement).toBe(spin);
  });

  it("shows the design's − and + characters on native buttons", () => {
    const { dec, inc } = setup();
    expect(dec.textContent).toBe("−");
    expect(inc.textContent).toBe("+");
    expect(dec.getAttribute("type")).toBe("button");
    expect(inc.getAttribute("type")).toBe("button");
  });

  it("steps down and up with the buttons", () => {
    const { onChange, dec, inc } = setup({ step: 2, value: 5 });
    fireEvent.click(dec);
    expect(onChange).toHaveBeenLastCalledWith(3);
    fireEvent.click(inc);
    expect(onChange).toHaveBeenLastCalledWith(7);
  });

  it("steps with ArrowDown and ArrowUp, and jumps with Home and End", () => {
    const { onChange, spin } = setup();
    fireEvent.keyDown(spin, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith(3);
    fireEvent.keyDown(spin, { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(spin, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(spin, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(10);
    fireEvent.keyDown(spin, { key: "a" });
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it("clamps a step that would go past a bound", () => {
    const { onChange, inc } = setup({ value: 9, step: 5 });
    fireEvent.click(inc);
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it("at min: disables − and ignores ArrowDown", () => {
    const { onChange, spin, dec, inc } = setup({ value: 1 });
    expect(dec.disabled).toBe(true);
    expect(inc.disabled).toBe(false);
    fireEvent.click(dec);
    fireEvent.keyDown(spin, { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("at max: disables + and ignores ArrowUp", () => {
    const { onChange, spin, dec, inc } = setup({ value: 10 });
    expect(inc.disabled).toBe(true);
    expect(dec.disabled).toBe(false);
    fireEvent.click(inc);
    fireEvent.keyDown(spin, { key: "ArrowUp" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has no axe violations at min, in range and at max", async () => {
    const { container } = render(
      <>
        <Stepper
          label="Servings"
          value={0}
          min={0}
          max={3}
          onChange={vi.fn()}
        />
        <Stepper
          label="Portions"
          value={2}
          min={0}
          max={3}
          onChange={vi.fn()}
        />
        <Stepper label="Days" value={3} min={0} max={3} onChange={vi.fn()} />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
