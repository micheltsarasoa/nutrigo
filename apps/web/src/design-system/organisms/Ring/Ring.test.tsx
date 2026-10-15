import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Ring } from "./Ring.tsx";

const C = 2 * Math.PI * 80;
const arc = (c: HTMLElement) => c.querySelector("circle:nth-of-type(2)");
const dash = (el: Element | null) =>
  Number(el!.getAttribute("stroke-dasharray")!.split(" ")[0]);

describe("Ring", () => {
  it("shows kcal eaten and the target, and names itself", () => {
    render(<Ring kcal={1380} target={2000} />);
    const ring = screen.getByRole("img", { name: "1380 kcal of 2000" });
    expect(ring.textContent).toContain("1380");
    expect(ring.textContent).toContain("of 2000 kcal");
  });

  it("draws 69 % of the circle in the kcal green, from 12 o'clock", () => {
    const { container } = render(<Ring kcal={1380} target={2000} />);
    const a = arc(container)!;
    expect(dash(a)).toBeCloseTo(C * 0.69, 1);
    expect(a.getAttribute("stroke-dasharray")!.split(" ")[1]).toBe(C.toFixed(2));
    expect(a.getAttribute("transform")).toBe("rotate(-90 92 92)");
    expect(a.getAttribute("stroke-linecap")).toBe("round");
    expect(a.getAttribute("class")).not.toContain("over");
  });

  it("is a full ring at exactly 100 %, not over", () => {
    const { container } = render(<Ring kcal={2000} target={2000} />);
    expect(dash(arc(container))).toBeCloseTo(C, 1);
    expect(arc(container)!.getAttribute("class")).not.toContain("over");
    const ring = screen.getByRole("img", { name: "2000 kcal of 2000" });
    expect(ring.textContent).toContain("of 2000 kcal");
  });

  it("over target: full orange ring and a caption that says by how much", () => {
    const { container } = render(<Ring kcal={2340} target={2000} />);
    expect(dash(arc(container))).toBeCloseTo(C, 1);
    expect(arc(container)!.getAttribute("class")).toContain("over");
    expect(screen.getByText("+340 kcal over ▲")).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "2340 kcal of 2000, over target" }),
    ).toBeTruthy();
  });

  it("with no target, shows only the track", () => {
    const { container } = render(<Ring kcal={1380} target={0} />);
    expect(arc(container)).toBeNull();
    expect(screen.getByText("no target")).toBeTruthy();
    expect(screen.getByRole("img", { name: "1380 kcal, no target" })).toBeTruthy();
  });

  it("with 0 kcal, shows only the track", () => {
    const { container } = render(<Ring kcal={0} target={2000} />);
    expect(arc(container)).toBeNull();
    expect(screen.getByRole("img", { name: "0 kcal of 2000" })).toBeTruthy();
  });

  it("animates the arc unless motion is reduced", () => {
    const { container, rerender } = render(<Ring kcal={1380} target={2000} />);
    expect(arc(container)!.getAttribute("class")).not.toContain("still");
    rerender(<Ring kcal={1380} target={2000} still />);
    expect(arc(container)!.getAttribute("class")).toContain("still");
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <div>
        <Ring kcal={0} target={2000} />
        <Ring kcal={1380} target={2000} />
        <Ring kcal={2000} target={2000} />
        <Ring kcal={2340} target={2000} />
        <Ring kcal={1380} target={0} />
        <Ring kcal={1380} target={2000} still />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
