import { useState } from "react";
import type { Demo } from "../../../playground/types.ts";
import { ColumnChart, type ChartDay } from "./ColumnChart.tsx";

const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const week = (kcals: number[], eaten: number): ChartDay[] =>
  kcals.map((kcal, i) => ({
    day: names[i]!,
    kcal,
    status: kcal === 0 ? "none" : i < eaten ? "eaten" : "planned",
  }));
const empty = week([0, 0, 0, 0, 0, 0, 0], 0);
const mixed = week([1850, 1920, 1760, 2050, 1500, 1700, 1600], 3);
const over = week([1850, 2210, 2340, 1980, 1500, 1700, 1600], 4);

// Shows the Wed tooltip without a hover, by focusing its column once mounted.
function WedFocused() {
  const [done, setDone] = useState(false);
  return (
    <div
      ref={(el) => {
        if (el && !done) {
          setDone(true);
          el.querySelectorAll<SVGGElement>("[data-testid=column]")[2]?.focus();
        }
        return undefined;
      }}
    >
      <ColumnChart days={over} target={2000} />
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
      <ColumnChart days={over} target={2000} />
    </div>
  );
}

export default {
  title: "ColumnChart",
  level: "organism",
  states: {
    "Empty week": <ColumnChart days={empty} target={2000} />,
    "Mixed eaten and planned": <ColumnChart days={mixed} target={2000} />,
    "Over-target days (tooltip on Wed)": <WedFocused />,
    "Table view": <TableView />,
  },
} satisfies Demo;
