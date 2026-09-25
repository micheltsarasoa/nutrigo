import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { IngredientRow } from "./IngredientRow.tsx";

const list: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

export default {
  title: "IngredientRow",
  level: "molecule",
  states: {
    typical: (
      <ol style={list}>
        <IngredientRow n={1} quantity="200 g" name="turkey breast" />
        <IngredientRow n={2} quantity="150 g" name="asparagus" />
        <IngredientRow n={3} quantity="120 g" name="cooked brown rice" />
      </ol>
    ),
    "scaled quantity with decimals": (
      <ol style={list}>
        <IngredientRow n={1} quantity="1.5 piece" name="lemon" />
        <IngredientRow n={2} quantity="22.5 g" name="olive oil" />
      </ol>
    ),
    "long ingredient name": (
      <ol style={list}>
        <IngredientRow
          n={1}
          quantity="300 g"
          name="skinless turkey breast, cut into thin strips across the grain and patted dry"
        />
      </ol>
    ),
  },
} satisfies Demo;
