import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { ToolItem } from "./ToolItem.tsx";

describe("ToolItem", () => {
  it("is a list item named by the tool; its number is decorative", () => {
    const { container } = render(
      <ol>
        <ToolItem n={1} name="Grill pan or outdoor grill" />
      </ol>,
    );
    expect(screen.getByRole("listitem").textContent).toBe(
      "1Grill pan or outdoor grill",
    );
    expect(container.querySelector("[aria-hidden]")?.textContent).toBe("1");
  });

  it("keeps a long tool name whole", () => {
    const long =
      "Saucepan with a tight-fitting lid, large enough for brown rice for four";
    render(
      <ol>
        <ToolItem n={3} name={long} />
      </ol>,
    );
    expect(screen.getByText(long)).toBeTruthy();
  });

  it("is not focusable: it only displays", () => {
    const { container } = render(
      <ol>
        <ToolItem n={6} name="Knife" />
      </ol>,
    );
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ol>
        <ToolItem n={1} name="Grill pan" />
        <ToolItem n={2} name="Cutting board" />
      </ol>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
