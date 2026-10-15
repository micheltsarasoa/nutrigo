import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { ServingsPrompt } from "./ServingsPrompt.tsx";

const setup = (props: Partial<Parameters<typeof ServingsPrompt>[0]> = {}) => {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(
    <ServingsPrompt
      title="Chickpea curry with rice"
      planned={2}
      kcalPerServing={305}
      onSave={onSave}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSave, onCancel };
};
const save = () => screen.getByRole("button", { name: "Mark as eaten" });
const spin = () => screen.getByRole("spinbutton", { name: "Servings eaten" });
const key = (k: string) => fireEvent.keyDown(spin(), { key: k });

describe("ServingsPrompt", () => {
  it("default: heading, hint, planned value, focus, no kcal hint", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "Servings eaten" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Chickpea curry with rice, planned 2"),
    ).toBeTruthy();
    expect(spin().getAttribute("aria-valuenow")).toBe("2");
    expect(document.activeElement).toBe(spin());
    expect(screen.queryByText(/kcal/)).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("steps by 0.5 and shows the live kcal hint when it differs", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Decrease/ }));
    expect(spin().getAttribute("aria-valuenow")).toBe("1.5");
    expect(screen.getByText("≈ 458 kcal")).toBeTruthy();
  });

  it("no kcal hint without kcalPerServing", () => {
    setup({ kcalPerServing: undefined });
    fireEvent.click(screen.getByRole("button", { name: /Increase/ }));
    expect(screen.queryByText(/kcal/)).toBeNull();
  });

  it("save and cancel buttons", () => {
    const { onSave, onCancel } = setup();
    fireEvent.click(save());
    expect(onSave).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("Enter saves the current value, Escape cancels", () => {
    const { onSave, onCancel } = setup();
    key("ArrowDown");
    key("Enter");
    expect(onSave).toHaveBeenCalledWith(1.5);
    key("Escape");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("invalid: alert, aria-disabled save that does nothing, Enter ignored", () => {
    const { onSave } = setup({ initial: 0 });
    expect(screen.getByRole("alert").textContent).toBe(
      "Enter a number from 0.5 to 20.",
    );
    expect(save().getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(save());
    key("Enter");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("recovers from invalid by stepping into range", () => {
    const { onSave } = setup({ initial: 0 });
    fireEvent.click(screen.getByRole("button", { name: /Increase/ }));
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(save());
    expect(onSave).toHaveBeenCalledWith(0.5);
  });

  it.each([undefined, 0])(
    "has no axe violations (initial %s)",
    async (initial) => {
      const { container } = render(
        <ServingsPrompt
          title="A"
          planned={2}
          initial={initial}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(await axeViolations(container)).toEqual([]);
    },
  );
});
