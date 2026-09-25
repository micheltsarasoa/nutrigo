import { useState } from "react";
import type { Demo } from "../../../playground/types.ts";
import { FilterTabs } from "./FilterTabs.tsx";

const MEALS = [
  { value: "all", text: "All" },
  { value: "breakfast", text: "Breakfast" },
  { value: "lunch", text: "Lunch" },
  { value: "snack", text: "Snack" },
  { value: "dinner", text: "Dinner" },
] as const;
type Meal = (typeof MEALS)[number]["value"];

function Live({ start }: { start: Meal }) {
  const [meal, setMeal] = useState<Meal>(start);
  return (
    <FilterTabs
      label="Meal type"
      options={MEALS}
      value={meal}
      onChange={setMeal}
    />
  );
}

export default {
  title: "FilterTabs",
  level: "atom",
  states: {
    "All active (tap a tab; Tab then ← → for the keyboard★)": (
      <Live start="all" />
    ),
    "Breakfast active": <Live start="breakfast" />,
    "Lunch active": <Live start="lunch" />,
    "Snack active": <Live start="snack" />,
    "Dinner active (at 320 px the bar scrolls inside itself)": (
      <Live start="dinner" />
    ),
  },
} satisfies Demo;
