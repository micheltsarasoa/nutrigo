import { useState } from "react";
import type { Demo } from "../../../playground/types.ts";
import { MealItem } from "./MealItem.tsx";

const base = {
  photo: null,
  mosaic: [],
  eaten: false,
  onToggle: () => {},
};

// Toggles for real, so Tab then Space can be tried.
function Live() {
  const [eaten, setEaten] = useState(false);
  return (
    <MealItem
      {...base}
      name="Lentil and carrot soup"
      mealType="lunch"
      kcal={540}
      servings={2}
      eaten={eaten}
      onToggle={setEaten}
    />
  );
}

export default {
  title: "MealItem",
  level: "molecule",
  states: {
    "planned (Tab to the check, Space toggles★)": <Live />,
    eaten: (
      <MealItem
        {...base}
        name="Overnight oats with berries"
        mealType="breakfast"
        kcal={380}
        servings={1}
        eaten
      />
    ),
    "eaten, different servings": (
      <MealItem
        {...base}
        name="Chickpea curry with rice"
        mealType="dinner"
        kcal={610}
        servings={2}
        eatenServings={1.5}
        eaten
      />
    ),
    "next meal": (
      <MealItem
        {...base}
        name="Quinoa bowl with roasted veg"
        mealType="lunch"
        kcal={520}
        servings={1}
        next
      />
    ),
    "disabled (future day)": (
      <MealItem
        {...base}
        name="Baked salmon and greens"
        mealType="dinner"
        kcal={650}
        servings={2}
        disabled
      />
    ),
    "long name (truncated)": (
      <MealItem
        {...base}
        name="Slow-roasted lemon and thyme chicken with charred greens and herbs"
        mealType="dinner"
        kcal={720}
        servings={1}
      />
    ),
  },
} satisfies Demo;
