import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MealMiniCard } from "./MealMiniCard.tsx";

const props = () => ({
  name: "Grilled Chicken Salad",
  kcalPerServing: 450,
  servings: 1,
  photo: null,
  mosaic: [],
  mealType: "lunch" as const,
  onOpen: vi.fn(),
});

describe("MealMiniCard", () => {
  it("SPEC-003 AC-3: shows the recipe name and the kcal for 1 serving, no badge", () => {
    render(<MealMiniCard {...props()} />);
    expect(screen.getByText("Grilled Chicken Salad")).toBeTruthy();
    expect(screen.getByText("450 kcal")).toBeTruthy();
    expect(screen.queryByText(/servings/)).toBeNull();
  });

  it("SPEC-003 AC-4: 2 servings doubles the kcal and shows a badge", () => {
    render(<MealMiniCard {...props()} servings={2} />);
    expect(screen.getByText("900 kcal")).toBeTruthy();
    expect(screen.getByText("2 servings")).toBeTruthy();
  });

  it("rounds the kcal for a part serving", () => {
    render(<MealMiniCard {...props()} kcalPerServing={333} servings={1.5} />);
    expect(screen.getByText("500 kcal")).toBeTruthy();
    expect(screen.getByText("1.5 servings")).toBeTruthy();
  });

  it("is one button that calls onOpen (SPEC-003 AC-11: keyboard)", () => {
    const p = props();
    render(<MealMiniCard {...p} />);
    const button = screen.getByRole("button");
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(p.onOpen).toHaveBeenCalledOnce();
  });

  it("shows the photo when there is one, else the meal-type placeholder", () => {
    const { container, rerender } = render(
      <MealMiniCard {...props()} photo="/p.jpg" />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/p.jpg");
    rerender(<MealMiniCard {...props()} />);
    expect(container.querySelector("[data-meal-type='lunch']")).toBeTruthy();
  });

  it("keeps the full name in a title for a long recipe name", () => {
    const name = "Slow-roasted lemon and thyme chicken with charred greens";
    render(<MealMiniCard {...props()} name={name} />);
    expect(screen.getByText(name).getAttribute("title")).toBe(name);
  });

  it("has no axe violations in each state", async () => {
    const { container } = render(
      <>
        <MealMiniCard {...props()} />
        <MealMiniCard {...props()} photo="/p.jpg" servings={2} />
        <MealMiniCard {...props()} name="A very long recipe name ".repeat(4) />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
