import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { StarRating } from "./StarRating.tsx";

const VALUES = [0, 1, 2, 3, 4, 5] as const;

describe("StarRating, read-only", () => {
  it.each(VALUES)("is one image named “Rated %i out of 5”", (value) => {
    render(<StarRating value={value} />);
    expect(
      screen.getByRole("img", { name: `Rated ${value} out of 5` }),
    ).toBeTruthy();
  });

  it.each(VALUES)("fills %i of the 5 stars", (value) => {
    const { container } = render(<StarRating value={value} />);
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    const empty = [...stars].filter((svg) =>
      svg.getAttribute("class")?.includes("empty"),
    );
    expect(empty).toHaveLength(5 - value);
  });

  it("hides the stars themselves from screen readers", () => {
    const { container } = render(<StarRating value={3} />);
    for (const svg of container.querySelectorAll("svg")) {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.getAttribute("focusable")).toBe("false");
    }
  });

  it("has no inputs and nothing to tab to", () => {
    render(<StarRating value={3} />);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });
});

describe("StarRating, editable", () => {
  const renderEditable = (value: number, onChange = vi.fn()) => {
    render(
      <StarRating value={value} onChange={onChange} label="Your rating" />,
    );
    return onChange;
  };

  it("is a radio group named by its legend", () => {
    renderEditable(3);
    const group = screen.getByRole("group", { name: "Your rating" });
    expect(group.tagName).toBe("FIELDSET");
  });

  it("has 5 native radios named 1 star … 5 stars, sharing one name", () => {
    renderEditable(3);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(5);
    expect(screen.getByRole("radio", { name: "1 star" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "5 stars" })).toBeTruthy();
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    expect(radios[0]!.name).not.toBe("");
  });

  it.each([1, 2, 3, 4, 5])("checks the radio for %i", (value) => {
    renderEditable(value);
    const checked = screen
      .getAllByRole("radio")
      .filter((radio) => (radio as HTMLInputElement).checked);
    expect(checked).toHaveLength(1);
    expect(checked[0]!.getAttribute("value")).toBe(String(value));
  });

  it("checks nothing at 0", () => {
    renderEditable(0);
    for (const radio of screen.getAllByRole("radio")) {
      expect((radio as HTMLInputElement).checked).toBe(false);
    }
  });

  it("fills the stars up to the value", () => {
    const { container } = render(
      <StarRating value={2} onChange={() => {}} label="Your rating" />,
    );
    const empty = [...container.querySelectorAll("svg")].filter((svg) =>
      svg.getAttribute("class")?.includes("empty"),
    );
    expect(empty).toHaveLength(3);
  });

  it("calls onChange with the chosen number", () => {
    const onChange = renderEditable(2);
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("is reachable with the keyboard", () => {
    renderEditable(3);
    const radio = screen.getByRole("radio", { name: "3 stars" });
    radio.focus();
    expect(document.activeElement).toBe(radio);
  });

  it("gives two groups on one page different names", () => {
    render(
      <>
        <StarRating value={1} onChange={() => {}} label="Taste" />
        <StarRating value={2} onChange={() => {}} label="Effort" />
      </>,
    );
    const [a, b] = screen
      .getAllByRole("group")
      .map((group) => group.querySelector("input")!.name);
    expect(a).not.toBe(b);
  });
});

describe("StarRating, accessibility", () => {
  it("has no axe violations in either mode", async () => {
    const { container } = render(
      <>
        <StarRating value={0} />
        <StarRating value={4} />
        <StarRating value={0} onChange={() => {}} label="Taste" />
        <StarRating value={3} onChange={() => {}} label="Effort" />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
