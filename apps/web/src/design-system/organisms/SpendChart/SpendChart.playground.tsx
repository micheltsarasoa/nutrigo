import { useState } from "react";
import type { Demo } from "../../../playground/types.ts";
import { SpendChart, type SpendWeek } from "./SpendChart.tsx";

const weeks: SpendWeek[] = [
  [4820, 0],
  [5290, 0],
  [4410, 0],
  [7100, 0],
  [5530, 0],
  [6080, 0],
  [4960, 0],
  [5740, 1],
].map(([cents, est], i) => ({
  label: `W${33 + i}`,
  cents: cents!,
  estimated: est === 1,
}));

// Shows the last week's tooltip without a hover, by focusing its column once mounted.
function LastFocused() {
  const [done, setDone] = useState(false);
  return (
    <div
      ref={(el) => {
        if (el && !done) {
          setDone(true);
          el.querySelectorAll<SVGGElement>("[data-testid=column]")[7]?.focus();
        }
        return undefined;
      }}
    >
      <SpendChart weeks={weeks} locale="en-IE" />
    </div>
  );
}

function TableView() {
  return (
    <div
      ref={(el) => {
        el?.querySelectorAll("button")[1]?.click();
      }}
    >
      <SpendChart weeks={weeks} locale="en-IE" />
    </div>
  );
}

export default {
  title: "SpendChart",
  level: "organism",
  states: {
    "No lists yet": <SpendChart weeks={[]} locale="en-IE" />,
    "One week": <SpendChart weeks={weeks.slice(7)} locale="en-IE" />,
    "Eight weeks (tooltip on the estimate)": <LastFocused />,
    "Table view": <TableView />,
  },
} satisfies Demo;
