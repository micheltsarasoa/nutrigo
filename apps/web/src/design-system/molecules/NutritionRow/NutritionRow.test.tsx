import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../../../axe.ts";
import { NutritionRow } from "./NutritionRow.tsx";

const table = (rows: ReactNode) => (
  <table>
    <tbody>{rows}</tbody>
  </table>
);

describe("NutritionRow", () => {
  it("is a table row: the nutrient heads the row, the amount is its cell", () => {
    render(table(<NutritionRow label="Protein" value="42 g" />));
    expect(screen.getByRole("rowheader").textContent).toBe("Protein");
    expect(screen.getByRole("cell").textContent).toBe("42 g");
  });

  it("shows an en dash when an optional nutrient is missing", () => {
    render(table(<NutritionRow label="Fibre" value={null} />));
    expect(screen.getByRole("cell").textContent).toBe("–");
  });

  it("shows the caption above the value on the head row", () => {
    render(
      table(
        <NutritionRow
          label="Calories"
          value="540 kcal"
          caption="Per serving"
        />,
      ),
    );
    const cell = screen.getByRole("cell");
    expect(cell.textContent).toBe("Per serving540 kcal");
    expect(cell.firstElementChild?.textContent).toBe("Per serving");
  });

  it("is not focusable: it only displays", () => {
    const { container } = render(
      table(<NutritionRow label="Sodium" value="820 mg" />),
    );
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      table(
        <>
          <NutritionRow
            label="Calories"
            value="540 kcal"
            caption="Per serving"
          />
          <NutritionRow label="Carbs" value="61 g" />
          <NutritionRow label="Sugars" value={null} />
        </>,
      ),
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
