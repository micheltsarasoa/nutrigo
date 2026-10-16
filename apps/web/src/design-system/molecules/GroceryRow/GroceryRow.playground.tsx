import { useState } from "react";
import type { Demo } from "../../../playground/types.ts";
import { GroceryRow, type GroceryItem } from "./GroceryRow.tsx";

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

// Holds the row's state so the demo can be ticked and edited.
function Live(props: Partial<GroceryItem>) {
  const [item, setItem] = useState({ ...base, ...props });
  const patch = (p: Partial<GroceryItem>) => setItem((i) => ({ ...i, ...p }));
  return (
    <GroceryRow
      item={item}
      locale="en-IE"
      onToggle={(purchased) => patch({ purchased })}
      onQuantity={(quantity) => patch({ quantity })}
      onActual={(actualCents) => patch({ actualCents })}
    />
  );
}

export default {
  title: "GroceryRow",
  level: "molecule",
  states: {
    "pending (tick it, change the quantity; Tab for focus★)": <Live />,
    "bought with actual price": (
      <Live
        name="Chickpeas"
        category="Pantry"
        quantity={400}
        kcal={1640}
        estCents={105}
        actualCents={110}
        purchased
      />
    ),
    "manual item": (
      <Live
        name="Kitchen paper"
        category="Other"
        quantity={1}
        unit={null}
        kcal={null}
        estCents={null}
        manual
      />
    ),
    "no longer in plan": (
      <Live
        name="Salmon"
        category="Other"
        quantity={300}
        kcal={620}
        estCents={450}
        purchased
        noLongerInPlan
      />
    ),
    "offline, waiting to sync": (
      <Live
        name="Lentils"
        category="Pantry"
        quantity={250}
        kcal={880}
        estCents={140}
        purchased
        pendingSync
      />
    ),
    "no price (–)": (
      <Live
        name="Salt"
        category="Pantry"
        quantity={20}
        kcal={0}
        estCents={null}
      />
    ),
  },
} satisfies Demo;
