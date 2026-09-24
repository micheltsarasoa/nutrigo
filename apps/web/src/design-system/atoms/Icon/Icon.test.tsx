import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Icon, ICON_NAMES, type IconName } from "./Icon.tsx";

// The 20 in-scope icons from docs/design-system/index.html §06.
const EXPECTED: IconName[] = [
  "dashboard",
  "calendar",
  "menu",
  "diary",
  "items",
  "kcal",
  "carbs",
  "protein",
  "fat",
  "cost",
  "search",
  "filter",
  "add",
  "check",
  "time",
  "difficulty",
  "health-score",
  "steps",
  "prev",
  "chevron",
];

describe("Icon", () => {
  it("has exactly the 20 in-scope icons", () => {
    expect([...ICON_NAMES].sort()).toEqual([...EXPECTED].sort());
  });

  it.each(EXPECTED)(
    "draws %s on the 24 grid with round currentColor strokes",
    (name) => {
      const { container } = render(<Icon name={name} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
      expect(svg.getAttribute("stroke")).toBe("currentColor");
      expect(svg.getAttribute("fill")).toBe("none");
      expect(svg.getAttribute("stroke-linecap")).toBe("round");
      expect(svg.children.length).toBeGreaterThan(0);
    },
  );

  it("is decorative by default: hidden from assistive tech and not focusable", () => {
    const { container } = render(<Icon name="search" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("becomes an image with an accessible name when given a label", () => {
    render(<Icon name="kcal" label="Calories" />);
    const img = screen.getByRole("img", { name: "Calories" });
    expect(img.getAttribute("aria-hidden")).toBeNull();
  });

  it.each(["xs", "sm", "md", "lg"] as const)("applies the %s size", (size) => {
    const { container } = render(<Icon name="add" size={size} />);
    expect(container.querySelector("svg")!.getAttribute("class")).toContain(
      size,
    );
  });

  it("defaults to the md size", () => {
    const { container } = render(<Icon name="add" />);
    expect(container.querySelector("svg")!.getAttribute("class")).toMatch(/md/);
  });

  it("has no axe violations, decorative or labelled", async () => {
    const { container } = render(
      <p>
        <Icon name="time" /> 25 min{" "}
        <Icon name="health-score" label="Health score" />
      </p>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
