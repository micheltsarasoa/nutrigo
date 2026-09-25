import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Field } from "./Field.tsx";

describe("Field", () => {
  it("is a text box named by its visible label", () => {
    render(<Field label="Name" />);
    const box = screen.getByRole("textbox", { name: "Name" });
    expect(screen.getByText("Name").tagName).toBe("LABEL");
    expect(box.getAttribute("aria-invalid")).toBeNull();
  });

  it("passes typing through to onChange", () => {
    const onChange = vi.fn();
    render(<Field label="Name" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Oats" },
    });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("number: a decimal keypad and a unit suffix that is part of its description", () => {
    render(<Field label="Energy" type="number" unit="kcal" />);
    const box = screen.getByRole("spinbutton", { name: "Energy" });
    expect(box.getAttribute("inputmode")).toBe("decimal");
    expect(box.getAttribute("step")).toBe("any");
    expect(screen.getByText("kcal")).toBeTruthy();
    expect(box.getAttribute("aria-describedby")).toBe(
      screen.getByText("kcal").id,
    );
  });

  it("multi-line: a textarea", () => {
    render(<Field label="Notes" multiline rows={4} />);
    const box = screen.getByRole("textbox", { name: "Notes" });
    expect(box.tagName).toBe("TEXTAREA");
    expect(box.getAttribute("rows")).toBe("4");
  });

  it("error: marks the control invalid and describes it with the message", () => {
    render(
      <Field label="Fat" type="number" unit="g" error="Must be 0 or more" />,
    );
    const box = screen.getByRole("spinbutton", { name: "Fat" });
    expect(box.getAttribute("aria-invalid")).toBe("true");
    const ids = box.getAttribute("aria-describedby")!.split(" ");
    expect(ids.map((id) => document.getElementById(id)!.textContent)).toEqual([
      "g",
      "Must be 0 or more",
    ]);
  });

  it("disabled: the control can't be edited", () => {
    render(<Field label="Name" disabled defaultValue="Oats" />);
    expect((screen.getByRole("textbox") as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it("gets focus from the keyboard", () => {
    render(<Field label="Name" />);
    const box = screen.getByRole("textbox");
    box.focus();
    expect(document.activeElement).toBe(box);
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <>
        <Field label="Name" defaultValue="Oats" />
        <Field label="Energy" type="number" unit="kcal" />
        <Field label="Fat" type="number" unit="g" error="Must be 0 or more" />
        <Field label="Notes" multiline />
        <Field label="Source" disabled defaultValue="manual" />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
