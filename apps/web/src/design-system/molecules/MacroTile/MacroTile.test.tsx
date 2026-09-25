import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { MACROS, MacroTile } from "./MacroTile.tsx";

describe("MacroTile", () => {
  it("covers the four macros", () => {
    expect(MACROS).toEqual(["kcal", "carbs", "protein", "fat"]);
  });

  it("reads as label, value, unit", () => {
    const { container } = render(
      <MacroTile macro="protein" label="Protein" value="42" />,
    );
    expect(container.textContent).toBe("Protein42g");
  });

  it("writes kcal for calories and g for the others", () => {
    render(
      <>
        <MacroTile macro="kcal" label="Calories" value="1 240" />
        <MacroTile macro="fat" label="Fat" value="0" />
      </>,
    );
    expect(screen.getByText("kcal")).toBeTruthy();
    expect(screen.getByText("g")).toBeTruthy();
  });

  it.each(MACROS)("uses the %s colour and icon", (macro) => {
    const { container } = render(
      <MacroTile macro={macro} label="x" value="1" />,
    );
    const tile = container.firstElementChild!;
    expect(tile.getAttribute("class")).toContain(macro);
    expect(tile.querySelector("[aria-hidden] svg")).not.toBeNull();
  });

  it("is not focusable and has no axe violations", async () => {
    const { container } = render(
      <div>
        {MACROS.map((m) => (
          <MacroTile key={m} macro={m} label={m} value="10" />
        ))}
      </div>,
    );
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });
});
