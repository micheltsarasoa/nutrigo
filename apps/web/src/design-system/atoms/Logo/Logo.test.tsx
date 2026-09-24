import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Logo } from "./Logo.tsx";

describe("Logo", () => {
  it("draws the two-bowl mark on its 26 grid", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 26 26");
    expect(svg.querySelectorAll("path")).toHaveLength(2);
    expect(svg.getAttribute("focusable")).toBe("false");
  });

  it("is an image named NutriGo when shown as the mark alone", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: "NutriGo" })).toBeTruthy();
  });

  it("shows the wordmark in the lockup and names itself once, through the text", () => {
    const { container } = render(<Logo wordmark />);
    expect(screen.getByText("NutriGo")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it.each(["sm", "md", "lg"] as const)("applies the %s size", (size) => {
    const { container } = render(<Logo size={size} wordmark />);
    expect(container.firstElementChild!.getAttribute("class")).toContain(size);
  });

  it("defaults to the md size", () => {
    const { container } = render(<Logo />);
    expect(container.firstElementChild!.getAttribute("class")).toMatch(/md/);
  });

  it("has no axe violations, as a mark or a lockup", async () => {
    const { container } = render(
      <>
        <Logo size="lg" />
        <Logo wordmark />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
