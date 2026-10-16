import type { Demo } from "../../../playground/types.ts";
import { StackedBar, type StackedWeek } from "./StackedBar.tsx";

const CATS = [
  { label: "Produce", color: "var(--food-category-veggies)" },
  { label: "Grains", color: "var(--food-category-grains)" },
  { label: "Dairy", color: "var(--food-category-dairy)" },
  { label: "Pantry", color: "var(--color-neutral-chip-grey)" },
  { label: "Other", color: "var(--food-category-others)" },
];
const WEEKS: StackedWeek[] = [
  { label: "W37", cents: [1200, 800, 900, 1000, 500] },
  { label: "W38", cents: [1400, 700, 1000, 1200, 400] },
  { label: "W39", cents: [1600, 900, 1100, 1300, 600] },
  { label: "W40", cents: [1800, 900, 1200, 1500, 600] },
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
      <StackedBar categories={CATS} weeks={WEEKS} locale="en-IE" />
    </div>
  );
}

export default {
  title: "StackedBar",
  level: "organism",
  states: {
    "four weeks": <StackedBar categories={CATS} weeks={WEEKS} locale="en-IE" />,
    "one week": (
      <StackedBar categories={CATS} weeks={WEEKS.slice(3)} locale="en-IE" />
    ),
    "no data": <StackedBar categories={CATS} weeks={[]} locale="en-IE" />,
    "table view": <TableView />,
  },
} satisfies Demo;
