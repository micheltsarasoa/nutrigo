import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Pill } from "./Pill.tsx";

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-2)",
};

export default {
  title: "Pill",
  level: "atom",
  states: {
    "light: green · yellow · orange · grey": (
      <div style={row}>
        <Pill variant="green">Grains</Pill>
        <Pill variant="yellow">Veggies</Pill>
        <Pill variant="orange">Protein</Pill>
        <Pill variant="grey">Others</Pill>
      </div>
    ),
    "solid: green · yellow · orange (meal slots)": (
      <div style={row}>
        <Pill variant="solid-green">Breakfast</Pill>
        <Pill variant="solid-yellow">Lunch</Pill>
        <Pill variant="solid-orange">Dinner</Pill>
        <Pill variant="grey">Snack</Pill>
      </div>
    ),
    outline: (
      <div style={row}>
        <Pill variant="outline">Pending</Pill>
      </div>
    ),
    "with an icon": (
      <div style={row}>
        <Pill variant="green" icon="check">
          Purchased
        </Pill>
        <Pill variant="outline" icon="time">
          25 min
        </Pill>
        <Pill variant="yellow" icon="carbs">
          Carbs
        </Pill>
        <Pill variant="orange" icon="protein">
          Protein
        </Pill>
      </div>
    ),
  },
} satisfies Demo;
