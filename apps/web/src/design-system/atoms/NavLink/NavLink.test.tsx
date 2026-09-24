import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { NavLink, NAV_LINK_VARIANTS } from "./NavLink.tsx";

describe("NavLink", () => {
  it("has the sidebar and tab-bar variants", () => {
    expect(NAV_LINK_VARIANTS).toEqual(["sidebar", "tab"]);
  });

  it("is a plain link named by its label, with a decorative icon", () => {
    render(
      <NavLink href="/recipes" icon="menu">
        Recipes
      </NavLink>,
    );
    const link = screen.getByRole("link", { name: "Recipes" });
    expect(link.getAttribute("href")).toBe("/recipes");
    const svg = link.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(link.firstElementChild).toBe(svg);
  });

  it("is reachable with the keyboard", () => {
    render(
      <NavLink href="/plan" icon="calendar">
        Plan
      </NavLink>,
    );
    const link = screen.getByRole("link");
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it("defaults to the sidebar variant, not active", () => {
    render(
      <NavLink href="/" icon="dashboard">
        Today
      </NavLink>,
    );
    const link = screen.getByRole("link");
    expect(link.className).toContain("sidebar");
    expect(link.hasAttribute("aria-current")).toBe(false);
  });

  it.each(NAV_LINK_VARIANTS)(
    "marks the current page in the %s variant",
    (variant) => {
      render(
        <NavLink href="/" icon="dashboard" variant={variant} active>
          Today
        </NavLink>,
      );
      const link = screen.getByRole("link", { name: "Today" });
      expect(link.className).toContain(variant);
      expect(link.getAttribute("aria-current")).toBe("page");
    },
  );

  it("passes other link attributes through (for the router in #32)", () => {
    render(
      <NavLink href="/plan" icon="calendar" data-testid="plan">
        Plan
      </NavLink>,
    );
    expect(screen.getByTestId("plan")).toBe(screen.getByRole("link"));
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <nav aria-label="Main">
        <NavLink href="/" icon="dashboard" active>
          Today
        </NavLink>
        <NavLink href="/recipes" icon="menu">
          Recipes
        </NavLink>
        <NavLink href="/" icon="dashboard" variant="tab" active>
          Today
        </NavLink>
        <NavLink href="/groceries" icon="items" variant="tab">
          Groceries
        </NavLink>
      </nav>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
