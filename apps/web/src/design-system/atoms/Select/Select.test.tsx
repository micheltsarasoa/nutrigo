import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Select } from "./Select.tsx";

const MEALS = [
  { value: "breakfast", text: "Breakfast" },
  { value: "lunch", text: "Lunch" },
];

describe("Select", () => {
  it("is a native select named by its visible label, with the given options", () => {
    render(<Select label="Meal type" options={MEALS} />);
    const box = screen.getByRole("combobox", { name: "Meal type" });
    expect(box.tagName).toBe("SELECT");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Breakfast",
      "Lunch",
    ]);
  });

  it("shows a placeholder option first when given one, which can't be picked back", () => {
    render(
      <Select
        label="Difficulty"
        placeholder="Choose…"
        options={MEALS}
        defaultValue=""
      />,
    );
    const first = screen.getAllByRole("option")[0] as HTMLOptionElement;
    expect(first.textContent).toBe("Choose…");
    expect(first.value).toBe("");
    expect(first.disabled).toBe(true);
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("");
  });

  it("reports a pick through onChange", () => {
    const onChange = vi.fn();
    render(<Select label="Meal type" options={MEALS} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "lunch" },
    });
    expect(onChange).toHaveBeenCalledOnce();
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(
      "lunch",
    );
  });

  it("error: marks it invalid and describes it with the message", () => {
    render(
      <Select label="Meal type" options={MEALS} error="Pick a meal type" />,
    );
    const box = screen.getByRole("combobox");
    expect(box.getAttribute("aria-invalid")).toBe("true");
    expect(
      document.getElementById(box.getAttribute("aria-describedby")!)!
        .textContent,
    ).toBe("Pick a meal type");
  });

  it("disabled and focusable", () => {
    const { rerender } = render(<Select label="Meal type" options={MEALS} />);
    const box = screen.getByRole("combobox");
    box.focus();
    expect(document.activeElement).toBe(box);
    rerender(<Select label="Meal type" options={MEALS} disabled />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(
      true,
    );
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <>
        <Select label="Meal type" options={MEALS} />
        <Select
          label="Difficulty"
          placeholder="Choose…"
          options={MEALS}
          defaultValue=""
        />
        <Select label="Unit" options={MEALS} error="Pick a unit" />
        <Select label="Locale" options={MEALS} disabled />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
