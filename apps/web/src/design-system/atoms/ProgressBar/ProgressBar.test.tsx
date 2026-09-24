import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { PROGRESS_BAR_VARIANTS, ProgressBar } from "./ProgressBar.tsx";

const fill = (bar: HTMLElement) => bar.firstElementChild as HTMLElement;

describe("ProgressBar", () => {
  it("is a named progressbar with its range", () => {
    render(<ProgressBar label="Carbohydrates" value={120} max={325} />);
    const bar = screen.getByRole("progressbar", { name: "Carbohydrates" });
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuenow")).toBe("120");
    expect(bar.getAttribute("aria-valuemax")).toBe("325");
    expect(bar.hasAttribute("aria-valuetext")).toBe(false);
  });

  it("defaults to green, a max of 100 and the regular height", () => {
    render(<ProgressBar label="Kcal" value={37} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.className).toContain("green");
    expect(bar.className).not.toContain("thin");
  });

  it("has the 3 fills from the design", () => {
    expect(PROGRESS_BAR_VARIANTS).toEqual(["green", "yellow", "orange"]);
  });

  it.each(PROGRESS_BAR_VARIANTS)("applies the %s variant", (variant) => {
    render(<ProgressBar label="x" value={50} variant={variant} />);
    expect(screen.getByRole("progressbar").className).toContain(variant);
  });

  it("has a thin version", () => {
    render(<ProgressBar label="x" value={50} thin />);
    expect(screen.getByRole("progressbar").className).toContain("thin");
  });

  it("fills in proportion to value / max", () => {
    render(<ProgressBar label="x" value={120} max={325} />);
    expect(fill(screen.getByRole("progressbar")).style.width).toBe("37%");
  });

  it("shows only the track at 0 %", () => {
    render(<ProgressBar label="x" value={0} />);
    expect(fill(screen.getByRole("progressbar")).style.width).toBe("0%");
  });

  it("is full and keeps its colour at exactly 100 %", () => {
    render(<ProgressBar label="x" value={44} max={44} variant="yellow" />);
    const bar = screen.getByRole("progressbar");
    expect(fill(bar).style.width).toBe("100%");
    expect(bar.className).toContain("yellow");
    expect(bar.className).not.toContain("over");
  });

  it("over the target, caps the fill, turns orange and announces the real figure", () => {
    render(<ProgressBar label="Fat" value={52} max={44} variant="yellow" />);
    const bar = screen.getByRole("progressbar", { name: "Fat" });
    expect(fill(bar).style.width).toBe("100%");
    expect(bar.className).toContain("over");
    expect(bar.getAttribute("aria-valuenow")).toBe("44");
    expect(bar.getAttribute("aria-valuetext")).toBe("118 %");
  });

  it("isn't a control: it can't be focused with the keyboard", () => {
    render(<ProgressBar label="x" value={50} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.hasAttribute("tabindex")).toBe(false);
    bar.focus();
    expect(document.activeElement).not.toBe(bar);
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <div>
        {PROGRESS_BAR_VARIANTS.map((v) => (
          <ProgressBar key={v} label={v} value={60} variant={v} />
        ))}
        <ProgressBar label="thin" value={93} thin />
        <ProgressBar label="empty" value={0} />
        <ProgressBar label="full" value={100} />
        <ProgressBar label="over" value={118} />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
