import type { CSSProperties, ReactNode } from "react";
import type { Demo } from "../../../playground/types.ts";
import { NutritionRow } from "./NutritionRow.tsx";

const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse" };

const table = (rows: ReactNode) => (
  <table style={tableStyle}>
    <tbody>{rows}</tbody>
  </table>
);

export default {
  title: "NutritionRow",
  level: "molecule",
  states: {
    "head row and every nutrient": table(
      <>
        <NutritionRow label="Calories" value="540 kcal" caption="Per serving" />
        <NutritionRow label="Carbs" value="61 g" />
        <NutritionRow label="Protein" value="42 g" />
        <NutritionRow label="Fat" value="14 g" />
        <NutritionRow label="Fibre" value="6 g" />
        <NutritionRow label="Sugars" value="9 g" />
        <NutritionRow label="Sodium" value="820 mg" />
      </>,
    ),
    "missing optional nutrient": table(
      <>
        <NutritionRow label="Fibre" value={null} />
        <NutritionRow label="Sugars" value={null} />
      </>,
    ),
    "large numbers": table(
      <>
        <NutritionRow
          label="Calories"
          value="12 480 kcal"
          caption="Per serving"
        />
        <NutritionRow label="Carbs" value="1 250 g" />
        <NutritionRow label="Sodium" value="18 400 mg" />
      </>,
    ),
  },
} satisfies Demo;
