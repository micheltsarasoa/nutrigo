import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { SelectPill } from "./SelectPill.tsx";

const RANGES = [
  { value: "week", text: "This Week" },
  { value: "last-week", text: "Last Week" },
  { value: "month", text: "This Month" },
];

describe("SelectPill", () => {
  it("is a native select named by its label, with the options in order", () => {
    render(<SelectPill label="Range" options={RANGES} />);
    const select = screen.getByRole("combobox", { name: "Range" });
    expect(select.tagName).toBe("SELECT");
    expect(
      screen
        .getAllByRole("option")
        .map((o) => [(o as HTMLOptionElement).value, o.textContent]),
    ).toEqual(RANGES.map((o) => [o.value, o.text]));
  });

  it("shows the chosen value and reports changes (controlled)", () => {
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState("week");
      return (
        <SelectPill
          label="Range"
          options={RANGES}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setValue(e.target.value);
          }}
        />
      );
    }
    render(<Controlled />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("week");
    fireEvent.change(select, { target: { value: "month" } });
    expect(onChange).toHaveBeenCalledWith("month");
    expect(select.value).toBe("month");
  });

  it("is reachable with the keyboard", () => {
    render(<SelectPill label="Range" options={RANGES} />);
    const select = screen.getByRole("combobox");
    select.focus();
    expect(document.activeElement).toBe(select);
  });

  it("draws a decorative chevron after the select", () => {
    render(<SelectPill label="Range" options={RANGES} />);
    const svg = screen.getByRole("combobox").nextElementSibling!;
    expect(svg.tagName).toBe("svg");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("passes native select attributes through", () => {
    render(
      <SelectPill
        label="Range"
        options={RANGES}
        name="range"
        id="range"
        defaultValue="last-week"
      />,
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.name).toBe("range");
    expect(select.id).toBe("range");
    expect(select.value).toBe("last-week");
  });

  it("can be disabled", () => {
    render(<SelectPill label="Range" options={RANGES} disabled />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(
      true,
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <SelectPill label="Range" options={RANGES} />
        <SelectPill label="Sort by" options={RANGES} disabled />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
