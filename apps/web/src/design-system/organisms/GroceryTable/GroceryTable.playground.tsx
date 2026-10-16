import { useState } from "react";
import type { Demo } from "../../../playground/types.ts";
import { GroceryTable, type GroceryTableItem } from "./GroceryTable.tsx";

const row = {
  manual: false,
  noLongerInPlan: false,
  pendingSync: false,
  purchased: false,
  actualCents: null,
};
const ITEMS: GroceryTableItem[] = [
  {
    ...row,
    id: "1",
    name: "Oats",
    category: "Grains",
    quantity: 180,
    unit: "g",
    kcal: 700,
    estCents: 120,
  },
  {
    ...row,
    id: "2",
    name: "Chickpeas",
    category: "Pantry",
    quantity: 400,
    unit: "g",
    kcal: 1640,
    estCents: 105,
    purchased: true,
    actualCents: 110,
  },
  {
    ...row,
    id: "3",
    name: "Kitchen paper",
    category: "Other",
    quantity: 1,
    unit: null,
    kcal: null,
    estCents: null,
    manual: true,
  },
  {
    ...row,
    id: "4",
    name: "Salmon",
    category: "Other",
    quantity: 300,
    unit: "g",
    kcal: 620,
    estCents: 450,
    purchased: true,
    noLongerInPlan: true,
  },
  {
    ...row,
    id: "5",
    name: "Lentils",
    category: "Pantry",
    quantity: 250,
    unit: "g",
    kcal: 880,
    estCents: 140,
    purchased: true,
    pendingSync: true,
  },
  {
    ...row,
    id: "6",
    name: "Carrots",
    category: "Produce",
    quantity: 500,
    unit: "g",
    kcal: 205,
    estCents: 90,
  },
  {
    ...row,
    id: "7",
    name: "Spinach",
    category: "Produce",
    quantity: 250,
    unit: "g",
    kcal: 58,
    estCents: 150,
  },
];
const KPIS = [
  {
    label: "Estimated cost",
    value: "~€58.40",
    delta: { direction: "up" as const, text: "+€4.20 vs last week" },
  },
  {
    label: "Total items",
    value: "7",
    delta: { direction: "down" as const, text: "−3 vs last week" },
  },
  { label: "Total kcal", value: "4 103", hint: "No previous list" },
];

// The demo keeps its own state so ticking, the stepper and the price box work.
function Live({ initial }: { initial: GroceryTableItem[] }) {
  const [items, setItems] = useState(initial);
  const patch = (id: string, p: Partial<GroceryTableItem>) =>
    setItems((all) => all.map((i) => (i.id === id ? { ...i, ...p } : i)));
  return (
    <GroceryTable
      state="ready"
      weekLabel="week 40"
      locale="en-IE"
      items={items}
      kpis={KPIS}
      onToggle={(id, purchased) => patch(id, { purchased })}
      onQuantity={(id, quantity) => patch(id, { quantity })}
      onActual={(id, actualCents) => patch(id, { actualCents })}
      onRegenerate={() => {}}
      onInsights={() => {}}
    />
  );
}

export default {
  title: "GroceryTable",
  level: "organism",
  states: {
    generated: <Live initial={ITEMS} />,
    "all purchased": (
      <Live
        initial={ITEMS.map((i) => ({
          ...i,
          purchased: true,
          noLongerInPlan: false,
          pendingSync: false,
          actualCents: i.estCents,
        }))}
      />
    ),
    "offline-pending rows": (
      <Live
        initial={ITEMS.map((i) => ({
          ...i,
          pendingSync: i.purchased,
          noLongerInPlan: false,
        }))}
      />
    ),
    "empty (no plan)": (
      <GroceryTable state="noPlan" weekLabel="week 40" onGoToPlan={() => {}} />
    ),
    "no list yet": (
      <GroceryTable state="noList" weekLabel="week 40" onGenerate={() => {}} />
    ),
  },
} satisfies Demo;
