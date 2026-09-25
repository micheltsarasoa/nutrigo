import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { MacroTile } from "./MacroTile.tsx";

// 2 × 2 on a phone, 1 row when there is room (like .chip-row).
const row: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(calc(var(--size-badge-lg) * 3), 1fr))",
  gap: "var(--space-3)",
};

export default {
  title: "MacroTile",
  level: "molecule",
  states: {
    "the four macros (typical values)": (
      <div style={row}>
        <MacroTile macro="kcal" label="Calories" value="540" />
        <MacroTile macro="carbs" label="Carbs" value="62" />
        <MacroTile macro="protein" label="Protein" value="42" />
        <MacroTile macro="fat" label="Fat" value="14" />
      </div>
    ),
    zero: (
      <div style={row}>
        <MacroTile macro="kcal" label="Calories" value="0" />
        <MacroTile macro="carbs" label="Carbs" value="0" />
        <MacroTile macro="protein" label="Protein" value="0" />
        <MacroTile macro="fat" label="Fat" value="0" />
      </div>
    ),
    "large numbers": (
      <div style={row}>
        <MacroTile macro="kcal" label="Calories" value="1 240" />
        <MacroTile macro="carbs" label="Carbs" value="1 180" />
        <MacroTile macro="protein" label="Protein" value="215" />
        <MacroTile macro="fat" label="Fat" value="1 020" />
      </div>
    ),
  },
} satisfies Demo;
