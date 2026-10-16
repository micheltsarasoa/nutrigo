import type { Demo } from "../../../playground/types.ts";
import { Legend, type LegendItem } from "./Legend.tsx";

const FIVE: LegendItem[] = [
  {
    label: "Produce",
    color: "var(--food-category-veggies)",
    cents: 1840,
    percent: 30,
  },
  {
    label: "Grains",
    color: "var(--food-category-grains)",
    cents: 920,
    percent: 15,
  },
  {
    label: "Dairy",
    color: "var(--food-category-dairy)",
    cents: 1230,
    percent: 20,
  },
  {
    label: "Pantry",
    color: "var(--color-neutral-chip-grey)",
    cents: 1540,
    percent: 25,
  },
  {
    label: "Other",
    color: "var(--food-category-others)",
    cents: 615,
    percent: 10,
  },
];

export default {
  title: "Legend",
  level: "molecule",
  states: {
    "five categories": <Legend items={FIVE} label="Spend by category" />,
    "one category": (
      <Legend items={FIVE.slice(0, 1)} label="Spend by category" />
    ),
    "long label": (
      <div style={{ maxWidth: "calc(var(--size-badge-lg) * 6)" }}>
        <Legend
          label="Spend by category"
          items={[
            {
              label: "Fresh fruit, vegetables and herbs from the weekly market",
              color: "var(--food-category-veggies)",
              cents: 123456,
              percent: 100,
            },
          ]}
        />
      </div>
    ),
  },
} satisfies Demo;
