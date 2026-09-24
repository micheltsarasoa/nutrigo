import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { Pill, PILL_VARIANTS } from "./Pill.tsx";

describe("Pill", () => {
  it("has the 8 variants from the design: 4 light tones, 3 solid, outline", () => {
    expect(PILL_VARIANTS).toEqual([
      "green",
      "yellow",
      "orange",
      "grey",
      "solid-green",
      "solid-yellow",
      "solid-orange",
      "outline",
    ]);
  });

  it.each(PILL_VARIANTS)("shows its text in the %s variant", (variant) => {
    render(<Pill variant={variant}>Grains</Pill>);
    expect(screen.getByText("Grains").className).toContain(variant);
  });

  it("is plain text, not a control", () => {
    render(<Pill variant="green">Grains</Pill>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Grains").tagName).toBe("SPAN");
  });

  it("shows a decorative icon before the text", () => {
    render(
      <Pill variant="green" icon="check">
        Purchased
      </Pill>,
    );
    const svg = screen.getByText("Purchased").querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("Purchased").firstElementChild).toBe(svg);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <p>
        {PILL_VARIANTS.map((v) => (
          <Pill key={v} variant={v} icon="check">
            {v}
          </Pill>
        ))}
      </p>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
