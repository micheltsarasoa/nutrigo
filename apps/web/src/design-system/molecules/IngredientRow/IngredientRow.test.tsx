import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { IngredientRow } from "./IngredientRow.tsx";

describe("IngredientRow", () => {
  it("is a list item: the quantity, then the ingredient name", () => {
    render(
      <ol>
        <IngredientRow n={1} quantity="200 g" name="turkey breast" />
      </ol>,
    );
    expect(screen.getByText("200 g turkey breast")).toBeTruthy();
  });

  it("keeps a scaled quantity exactly as formatted", () => {
    render(
      <ol>
        <IngredientRow n={2} quantity="1.5 piece" name="lemon" />
      </ol>,
    );
    expect(screen.getByText("1.5 piece lemon")).toBeTruthy();
  });

  it("hides its number from screen readers, since the list gives the order", () => {
    const { container } = render(
      <ol>
        <IngredientRow n={3} quantity="30 g" name="olive oil" />
      </ol>,
    );
    expect(container.querySelector("[aria-hidden]")?.textContent).toBe("3");
    expect(screen.getByRole("listitem").textContent).toBe("330 g olive oil");
  });

  it("is not focusable: it only displays", () => {
    const { container } = render(
      <ol>
        <IngredientRow n={1} quantity="200 g" name="turkey breast" />
      </ol>,
    );
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ol>
        <IngredientRow n={1} quantity="200 g" name="turkey breast" />
        <IngredientRow n={2} quantity="150 g" name="asparagus" />
      </ol>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
