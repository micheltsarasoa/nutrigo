import type { CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { SelectPill } from "./SelectPill.tsx";

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-3)",
};

const RANGES = [
  { value: "week", text: "This Week" },
  { value: "last-week", text: "Last Week" },
  { value: "month", text: "This Month" },
];

const SORTS = [
  { value: "popular", text: "Popular" },
  { value: "newest", text: "Newest" },
  { value: "kcal", text: "Lowest kcal" },
];

export default {
  title: "SelectPill",
  level: "atom",
  states: {
    "closed (hover it; press Tab to see the focus ring★)": (
      <div style={row}>
        <SelectPill label="Range" options={RANGES} />
        <SelectPill label="Sort by" options={SORTS} />
      </div>
    ),
    "wraps a native select★ (click or press Space to open it)": (
      <div style={row}>
        <SelectPill label="Month" options={RANGES} defaultValue="month" />
      </div>
    ),
    "disabled★": (
      <div style={row}>
        <SelectPill label="Range" options={RANGES} disabled />
      </div>
    ),
    "long option label (ends in …)": (
      <div style={row}>
        <SelectPill
          label="Meal plan"
          options={[
            {
              value: "long",
              text: "High-protein vegetarian plan for the second half of October",
            },
            { value: "short", text: "Default plan" },
          ]}
        />
      </div>
    ),
  },
} satisfies Demo;
