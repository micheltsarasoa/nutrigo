import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MenuListItem } from "./MenuListItem.tsx";

const recipe = {
  href: "/recipes/7",
  media: <span data-testid="media" />,
  title: "Grilled turkey with brown rice",
  mealType: "lunch" as const,
  mealLabel: "Lunch",
  kcal: 540,
  totalTime: "35 min",
  healthScore: 9,
  rating: 4,
};

describe("MenuListItem", () => {
  it("is one link to the recipe, headed by its title", () => {
    render(<MenuListItem {...recipe} variant="list" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/recipes/7");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "Grilled turkey with brown rice",
    );
  });

  it("shows the media slot, meal type, kcal per serving, total time, health score and rating", () => {
    render(<MenuListItem {...recipe} variant="grid" />);
    const link = screen.getByRole("link");
    expect(screen.getByTestId("media")).toBeTruthy();
    expect(link.textContent).toContain("Lunch");
    expect(link.textContent).toContain("540 kcal");
    expect(link.textContent).toContain("35 min");
    expect(link.textContent).toContain("9/10");
    expect(screen.getByRole("img", { name: "Rated 4 out of 5" })).toBeTruthy();
  });

  it("shows an en dash when there is no total time and no rating", () => {
    render(
      <MenuListItem
        {...recipe}
        totalTime={null}
        rating={null}
        variant="list"
      />,
    );
    expect(screen.queryByRole("img", { name: /Rated/ })).toBeNull();
    expect(screen.getAllByText("–")).toHaveLength(2);
  });

  it("is reachable with the keyboard", () => {
    render(<MenuListItem {...recipe} variant="list" />);
    const link = screen.getByRole("link");
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it("has no axe violations in both variants", async () => {
    const { container } = render(
      <>
        <MenuListItem {...recipe} variant="list" />
        <MenuListItem
          {...recipe}
          totalTime={null}
          rating={null}
          variant="grid"
        />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
