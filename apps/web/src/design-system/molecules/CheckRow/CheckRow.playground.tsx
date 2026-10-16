import { useState, type CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import type { GroceryItem } from "../GroceryRow/index.ts";
import { CheckRow } from "./CheckRow.tsx";

const base: GroceryItem = {
  name: "Oats",
  category: "Grains",
  quantity: 180,
  unit: "g",
  kcal: 700,
  estCents: 120,
  actualCents: null,
  purchased: false,
  manual: false,
  noLongerInPlan: false,
  pendingSync: false,
};

// A phone-width list.
const phone: CSSProperties = { maxWidth: 390 };

// Holds the state so the demo can be ticked.
function Live(props: Partial<GroceryItem>) {
  const [item, setItem] = useState({ ...base, ...props });
  return (
    <div style={phone}>
      <CheckRow
        item={item}
        locale="en-IE"
        onToggle={(purchased) => setItem((i) => ({ ...i, purchased }))}
        onOpen={() => {}}
      />
    </div>
  );
}

export default {
  title: "CheckRow",
  level: "molecule",
  states: {
    "pending (tick it; Tab for focus★)": <Live />,
    purchased: (
      <Live name="Chickpeas" quantity={400} purchased actualCents={110} />
    ),
    "manual item": (
      <Live
        name="Kitchen paper"
        quantity={1}
        unit={null}
        estCents={null}
        manual
      />
    ),
    "no longer in plan": (
      <Live name="Salmon" quantity={300} purchased noLongerInPlan />
    ),
    "offline, waiting to sync": (
      <Live name="Lentils" quantity={250} purchased pendingSync />
    ),
  },
} satisfies Demo;
