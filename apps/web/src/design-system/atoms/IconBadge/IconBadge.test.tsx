import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { ICON_BADGE_VARIANTS, IconBadge } from "./IconBadge.tsx";

describe("IconBadge", () => {
  it("has the 7 variants from the design: 3 solid, 4 light", () => {
    expect(ICON_BADGE_VARIANTS).toEqual([
      "green",
      "yellow",
      "orange",
      "green-light",
      "yellow-light",
      "orange-light",
      "grey",
    ]);
  });

  it.each(ICON_BADGE_VARIANTS)("draws the icon in the %s variant", (variant) => {
    const { container } = render(<IconBadge variant={variant} icon="kcal" />);
    const badge = container.firstElementChild!;
    expect(badge.getAttribute("class")).toContain(variant);
    expect(badge.querySelector("svg")).not.toBeNull();
  });

  it("is decorative: hidden from assistive tech", () => {
    const { container } = render(<IconBadge variant="green" icon="kcal" />);
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("defaults to sm (28 px) and offers lg (44 px)", () => {
    const { container } = render(
      <>
        <IconBadge variant="green" icon="kcal" />
        <IconBadge variant="green" icon="kcal" size="lg" />
      </>,
    );
    const [sm, lg] = container.children;
    expect(sm.getAttribute("class")).toMatch(/sm/);
    expect(lg.getAttribute("class")).toMatch(/lg/);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <p>
        <IconBadge variant="orange" icon="protein" /> Protein
      </p>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
