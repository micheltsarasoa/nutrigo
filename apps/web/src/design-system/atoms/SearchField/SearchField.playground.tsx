import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { SearchField } from "./SearchField.tsx";

const stack: CSSProperties = { display: "grid", gap: "var(--space-3)" };

export default {
  title: "SearchField",
  level: "atom",
  states: {
    "default, md 42 px (click it or press Tab to see the focus ring★)": (
      <div style={stack}>
        <SearchField label="Search menu" />
      </div>
    ),
    "with text typed": (
      <div style={stack}>
        <SearchField label="Search menu" defaultValue="chickpea salad" />
      </div>
    ),
    "filled, sm 36 px (inside cards)": (
      <div style={stack}>
        <SearchField label="Search item" size="sm" filled />
      </div>
    ),
    "long text stays inside the field": (
      <div style={stack}>
        <SearchField
          label="Search menu"
          defaultValue="grilled chicken with roasted vegetables, quinoa and a lemon yoghurt dressing"
        />
      </div>
    ),
  },
} satisfies Demo;
