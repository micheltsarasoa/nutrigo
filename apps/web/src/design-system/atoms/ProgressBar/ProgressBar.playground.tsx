import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { ProgressBar } from "./ProgressBar.tsx";

const stack: CSSProperties = {
  display: "grid",
  gap: "var(--space-3)",
};

// The bar always sits next to a numeric label (dataviz.html); pages build that row.
const caption: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "var(--space-1)",
  fontSize: "var(--font-size-caption)",
};

export default {
  title: "ProgressBar",
  level: "atom",
  states: {
    "green · yellow · orange": (
      <div style={stack}>
        <ProgressBar label="Calories" value={75} variant="green" />
        <ProgressBar label="Carbohydrates" value={60} variant="yellow" />
        <ProgressBar label="Protein" value={45} variant="orange" />
      </div>
    ),
    thin: (
      <div style={stack}>
        <ProgressBar label="Carbohydrates" value={37} variant="yellow" thin />
        <ProgressBar label="Protein" value={93} variant="orange" thin />
      </div>
    ),
    "0 %": (
      <div>
        <div style={caption}>
          <span>Carbohydrates</span>
          <b>0 of 325 g</b>
        </div>
        <ProgressBar
          label="Carbohydrates"
          value={0}
          max={325}
          variant="yellow"
        />
      </div>
    ),
    "100 %": (
      <div>
        <div style={caption}>
          <span>Groceries</span>
          <b>40 of 40 purchased</b>
        </div>
        <ProgressBar label="Groceries purchased" value={40} max={40} />
      </div>
    ),
    "over★ (fill capped, orange, the label says by how much)": (
      <div>
        <div style={caption}>
          <span>Fat</span>
          <b>+8 g over ▲</b>
        </div>
        <ProgressBar label="Fat" value={52} max={44} thin />
      </div>
    ),
  },
} satisfies Demo;
