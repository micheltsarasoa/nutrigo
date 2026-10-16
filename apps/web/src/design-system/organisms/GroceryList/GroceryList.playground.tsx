import { useState, type ComponentProps, type CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import type { GroceryTableItem } from "../GroceryTable/index.ts";
import { GroceryList } from "./GroceryList.tsx";

// The phone frame (ADR-0016): the list is designed for 390 px.
const phone: CSSProperties = { maxWidth: 390 };

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
    name: "Carrots",
    category: "Produce",
    quantity: 500,
    unit: "g",
    kcal: 205,
    estCents: 90,
    purchased: true,
  },
  {
    ...row,
    id: "2",
    name: "Spinach",
    category: "Produce",
    quantity: 250,
    unit: "g",
    kcal: 58,
    estCents: 150,
  },
  {
    ...row,
    id: "3",
    name: "Oats",
    category: "Grains",
    quantity: 180,
    unit: "g",
    kcal: 700,
    estCents: 120,
  },
  {
    ...row,
    id: "4",
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
    id: "5",
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
    id: "6",
    name: "Salmon",
    category: "Other",
    quantity: 300,
    unit: "g",
    kcal: 620,
    estCents: 450,
    purchased: true,
    noLongerInPlan: true,
  },
];

// Keeps its own state so ticking works in the demo.
function Live({
  initial,
  ...rest
}: { initial: GroceryTableItem[] } & Partial<
  ComponentProps<typeof GroceryList>
>) {
  const [items, setItems] = useState(initial);
  return (
    <div style={phone}>
      <GroceryList
        state="ready"
        weekLabel="week 40"
        locale="en-IE"
        items={items}
        onToggle={(id, purchased) =>
          setItems((all) =>
            all.map((i) => (i.id === id ? { ...i, purchased } : i)),
          )
        }
        onOpen={() => {}}
        onAdd={() => {}}
        onInsights={() => {}}
        {...rest}
      />
    </div>
  );
}

export default {
  title: "GroceryList",
  level: "organism",
  states: {
    generated: <Live initial={ITEMS} />,
    "all purchased": (
      <Live
        initial={ITEMS.map((i) => ({
          ...i,
          purchased: true,
          noLongerInPlan: false,
          actualCents: i.estCents,
        }))}
      />
    ),
    "empty (no plan)": (
      <div style={phone}>
        <GroceryList state="noPlan" weekLabel="week 40" onGoToPlan={() => {}} />
      </div>
    ),
    "offline with pending changes": (
      <Live
        initial={ITEMS.map((i, n) => ({
          ...i,
          pendingSync: n === 0 || n === 3,
        }))}
        sync={{ state: "offline", pending: 6 }}
      />
    ),
  },
} satisfies Demo;
