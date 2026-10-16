import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Checkbox } from "./Checkbox.tsx";

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-3)",
};

const caption: CSSProperties = { fontSize: "var(--font-size-caption)" };

export default {
  title: "Checkbox",
  level: "atom",
  states: {
    "unchecked · checked (tap to toggle; press Tab to see the focus ring★)": (
      <div style={row}>
        <Checkbox label="Mark oats as bought" />
        <span style={caption}>To buy</span>
        <Checkbox label="Mark chickpeas as not bought" defaultChecked />
        <span style={caption}>Bought</span>
      </div>
    ),
    "disabled★": (
      <div style={row}>
        <Checkbox label="Oats" disabled />
        <Checkbox label="Chickpeas" disabled defaultChecked />
      </div>
    ),
  },
} satisfies Demo;
