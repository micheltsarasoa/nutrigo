import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { RecipeStep } from "./RecipeStep.tsx";

describe("RecipeStep", () => {
  it("is a list item with its title as a heading and its body as text", () => {
    render(
      <ol>
        <RecipeStep
          n={1}
          title="Prepare the turkey"
          body="Season with olive oil, salt and pepper."
        />
      </ol>,
    );
    expect(screen.getByRole("listitem")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "Prepare the turkey",
    );
    expect(
      screen.getByText("Season with olive oil, salt and pepper."),
    ).toBeTruthy();
  });

  it("hides its number from screen readers, since the list gives the order", () => {
    const { container } = render(
      <ol>
        <RecipeStep n={2} title="Grill" body="Grill for 6 minutes a side." />
      </ol>,
    );
    const hidden = [...container.querySelectorAll("[aria-hidden]")].map(
      (el) => el.textContent,
    );
    expect(hidden).toContain("2");
  });

  it("leaves out the body when it is empty", () => {
    const { container } = render(
      <ol>
        <RecipeStep n={1} title="Serve" body="" />
      </ol>,
    );
    expect(container.querySelector("p")).toBeNull();
  });

  it("is not focusable: it only displays", () => {
    const { container } = render(
      <ol>
        <RecipeStep n={1} title="Serve" body="Plate and serve." />
      </ol>,
    );
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ol>
        <RecipeStep n={1} title="Prepare" body="Season the turkey." />
        <RecipeStep n={2} title="Cook" body="Grill it." />
      </ol>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
