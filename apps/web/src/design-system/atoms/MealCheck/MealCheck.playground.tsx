import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { MealCheck } from "./MealCheck.tsx";

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-3)",
};

const caption: CSSProperties = { fontSize: "var(--font-size-caption)" };

export default {
  title: "MealCheck",
  level: "atom",
  states: {
    "done · todo · next (tap to toggle; press Tab to see the focus ring★)": (
      <div style={row}>
        <MealCheck meal="breakfast" defaultChecked />
        <span style={caption}>Eaten</span>
        <MealCheck meal="lunch" />
        <span style={caption}>Planned</span>
        <MealCheck meal="dinner" next />
        <span style={caption}>Next meal</span>
      </div>
    ),
    "next, once checked, is done": (
      <div style={row}>
        <MealCheck meal="snack" next defaultChecked />
      </div>
    ),
    "disabled★": (
      <div style={row}>
        <MealCheck meal="breakfast" disabled defaultChecked />
        <MealCheck meal="lunch" disabled />
        <MealCheck meal="dinner" disabled next />
      </div>
    ),
  },
} satisfies Demo;
