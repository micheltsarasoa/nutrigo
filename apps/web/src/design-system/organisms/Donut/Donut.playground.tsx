import type { Demo } from "../../../playground/types.ts";
import type { LegendItem } from "../../molecules/Legend/index.ts";
import { Donut } from "./Donut.tsx";

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

// Opens the table view without a click, by pressing its button once mounted.
function TableView() {
  return (
    <div
      ref={(el) => {
        el?.querySelectorAll("button")[1]?.click();
        return undefined;
      }}
    >
      <Donut slices={FIVE} locale="en-IE" caption="this week" />
    </div>
  );
}

export default {
  title: "Donut",
  level: "organism",
  states: {
    "five categories": (
      <Donut slices={FIVE} locale="en-IE" caption="this week" />
    ),
    "one category": (
      <Donut slices={FIVE.slice(0, 1)} locale="en-IE" caption="this week" />
    ),
    "no data": <Donut slices={[]} locale="en-IE" />,
    "table view": <TableView />,
  },
} satisfies Demo;
