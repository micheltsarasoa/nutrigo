import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { FilterTabs } from "./FilterTabs.tsx";

const MEALS = [
  { value: "all", text: "All" },
  { value: "breakfast", text: "Breakfast" },
  { value: "lunch", text: "Lunch" },
] as const;

describe("FilterTabs", () => {
  it("is a radio group named by its label, one radio per option named by its text", () => {
    render(
      <FilterTabs
        label="Meal type"
        options={MEALS}
        value="all"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "Meal type" })).toBeTruthy();
    expect(
      screen.getAllByRole("radio").map((r) => r.closest("label")!.textContent),
    ).toEqual(["All", "Breakfast", "Lunch"]);
  });

  it("checks the option matching value", () => {
    render(
      <FilterTabs
        label="Meal type"
        options={MEALS}
        value="lunch"
        onChange={() => {}}
      />,
    );
    expect(
      (screen.getByRole("radio", { name: "Lunch" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", { name: "All" }) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("SPEC-002 AC-5: reports the picked value", () => {
    const onChange = vi.fn();
    render(
      <FilterTabs
        label="Meal type"
        options={MEALS}
        value="all"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Lunch" }));
    expect(onChange).toHaveBeenCalledWith("lunch");
  });

  it("is one tab stop: native radios share a name, so arrow keys move", () => {
    render(
      <FilterTabs
        label="Meal type"
        options={MEALS}
        value="all"
        onChange={() => {}}
      />,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);
    radios[0]!.focus();
    expect(document.activeElement).toBe(radios[0]);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <FilterTabs
        label="Meal type"
        options={MEALS}
        value="all"
        onChange={() => {}}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
