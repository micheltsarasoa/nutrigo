import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { Select } from "./Select.tsx";

const stack: CSSProperties = { display: "grid", gap: "var(--space-4)" };
const MEALS = [
  { value: "breakfast", text: "Breakfast" },
  { value: "lunch", text: "Lunch" },
  { value: "snack", text: "Snack" },
  { value: "dinner", text: "Dinner" },
];
const LOCALES = [
  { value: "fr-FR", text: "Français (1 240 kcal · 57,40 €)" },
  { value: "en-IE", text: "English, Ireland (1,240 kcal · €57.40)" },
];

export default {
  title: "Select",
  level: "atom",
  states: {
    "default with a placeholder, and selected (Tab for the focus ring★)": (
      <div style={stack}>
        <Select
          label="Difficulty"
          placeholder="Choose…"
          defaultValue=""
          options={[
            { value: "easy", text: "Easy" },
            { value: "medium", text: "Medium" },
            { value: "hard", text: "Hard" },
          ]}
        />
        <Select label="Meal type" defaultValue="lunch" options={MEALS} />
      </div>
    ),
    "error and disabled": (
      <div style={stack}>
        <Select
          label="Meal type"
          placeholder="Choose…"
          defaultValue=""
          options={MEALS}
          error="Pick a meal type"
        />
        <Select label="Unit" defaultValue="lunch" options={MEALS} disabled />
      </div>
    ),
    "long option text ends in …": (
      <div style={stack}>
        <Select
          label="Number and money format"
          defaultValue="en-IE"
          options={LOCALES}
        />
      </div>
    ),
  },
} satisfies Demo;
