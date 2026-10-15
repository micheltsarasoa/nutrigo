import {
  type MealEntry,
  type MealType,
  type Plan,
  weekDays,
} from "@nutrigo/shared";
import type { Demo } from "../../../playground/types.ts";
import { MealPlanGrid } from "./MealPlanGrid.tsx";

const WEEK = "2026-W41";
const SLOTS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const NAMES: Record<MealType, string[]> = {
  breakfast: ["Oat Bowl", "Greek Yogurt with Berries", "Veggie Omelette"],
  lunch: ["Grilled Chicken Salad", "Quinoa and Kale Bowl", "Tuna Wrap"],
  snack: ["Apple with Peanut Butter", "Hummus with Carrot Sticks"],
  dinner: ["Grilled Salmon with Asparagus", "Roasted Veggie Bowl with Lentils"],
};
const KCAL: Record<MealType, number> = {
  breakfast: 300,
  lunch: 450,
  snack: 200,
  dinner: 500,
};

let nextId = 1;
const entry = (
  date: string,
  slot: MealType,
  name: string,
  servings = 1,
  position = 0,
): MealEntry => ({
  id: nextId++,
  date,
  slot,
  recipeId: 1,
  servings,
  isoWeek: WEEK,
  position,
  recipeName: name,
  kcalPerServing: KCAL[slot],
});

const planOf = (entries: MealEntry[]): Plan => ({
  isoWeek: WEEK,
  days: weekDays(WEEK).map((date) => ({
    date,
    slots: Object.fromEntries(
      SLOTS.map((s) => [
        s,
        entries.filter((e) => e.date === date && e.slot === s),
      ]),
    ) as Plan["days"][number]["slots"],
  })),
});

const days = weekDays(WEEK);
const full = days.flatMap((date, d) =>
  SLOTS.map((s) => entry(date, s, NAMES[s][d % NAMES[s].length]!)),
);
const partial = [
  entry(days[0]!, "breakfast", NAMES.breakfast[0]!),
  entry(days[0]!, "dinner", NAMES.dinner[0]!),
  entry(days[1]!, "lunch", NAMES.lunch[0]!, 2),
  entry(days[3]!, "snack", NAMES.snack[0]!),
];
const twoInASlot = [
  entry(days[1]!, "lunch", "Grilled Chicken Salad"),
  entry(days[1]!, "lunch", "Tomato Soup", 2, 1),
  entry(days[1]!, "breakfast", "Oat Bowl"),
];

const handlers = {
  today: days[2]!,
  selectedDate: days[1]!,
  onSelectDay: () => {},
  onAdd: () => {},
  onOpenEntry: () => {},
  onRetry: () => {},
};

export default {
  title: "MealPlanGrid",
  level: "organism",
  states: {
    "empty week (today Wed, selected Tue)": (
      <MealPlanGrid plan={planOf([])} {...handlers} />
    ),
    "full week": <MealPlanGrid plan={planOf(full)} {...handlers} />,
    "partially filled (kcal per slot is for the selected day)": (
      <MealPlanGrid plan={planOf(partial)} {...handlers} />
    ),
    "a slot with 2 recipes (stacked, slot kcal = sum)": (
      <MealPlanGrid plan={planOf(twoInASlot)} {...handlers} />
    ),
    loading: <MealPlanGrid plan={planOf([])} {...handlers} loading />,
    error: <MealPlanGrid plan={planOf([])} {...handlers} error />,
  },
} satisfies Demo;
