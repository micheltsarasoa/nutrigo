import type { Demo } from "../../../playground/types.ts";
import { ChartTable } from "./ChartTable.tsx";

export default {
  title: "ChartTable",
  level: "organism",
  states: {
    "category table": (
      <ChartTable
        caption="Spend by category"
        columns={[
          { label: "Category" },
          { label: "€", numeric: true },
          { label: "%", numeric: true },
        ]}
        rows={[
          ["Produce", "18.40", "30"],
          ["Grains", "9.20", "15"],
          ["Dairy", "12.30", "20"],
          ["Pantry", "15.40", "25"],
          ["Other", "6.15", "10"],
        ]}
      />
    ),
    "weekly table": (
      <ChartTable
        caption="Weekly spend"
        columns={[
          { label: "Week" },
          { label: "Estimated €", numeric: true },
          { label: "Actual €", numeric: true },
        ]}
        rows={[
          ["W37", "49.20", "51.10"],
          ["W38", "52.80", "50.40"],
          ["W39", "55.90", "58.00"],
          ["W40", "58.40", "–"],
        ]}
      />
    ),
    empty: (
      <ChartTable
        caption="Spend by category"
        columns={[{ label: "Category" }, { label: "€", numeric: true }]}
        rows={[]}
        empty="No spending recorded"
      />
    ),
  },
} satisfies Demo;
