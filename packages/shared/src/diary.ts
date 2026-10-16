import { z } from "zod";
import { weekDays } from "./plan.ts";
import { MealType } from "./recipes.ts";

// SPEC-004 §5 and §7. Values are never rounded here; rounding is for display only.
const macro = z.number().min(0).nullish();
export const Targets = z.object({
  kcal: z.number().int().positive(),
  carbs: macro,
  protein: macro,
  fat: macro,
});
export type Targets = z.infer<typeof Targets>;

type Macros = { kcal: number; carbs: number; protein: number; fat: number };
type Entry = {
  id?: number;
  date?: string;
  slot?: MealType;
  position?: number;
  recipeId: number;
  servings: number;
  eatenServings?: number | null;
  eatenAt?: string | null;
};
/** Per-serving nutrition by recipe id. */
type Recipes = Record<number, Macros>;

const zero = (): Macros => ({ kcal: 0, carbs: 0, protein: 0, fat: 0 });
const KEYS = ["kcal", "carbs", "protein", "fat"] as const;

function sum(entries: Entry[], recipes: Recipes, eaten: boolean) {
  const n = zero();
  for (const e of entries) {
    if (eaten && !e.eatenAt) continue;
    const r = recipes[e.recipeId];
    if (!r) continue;
    const servings = eaten ? (e.eatenServings ?? e.servings) : e.servings;
    for (const k of KEYS) n[k] += r[k] * servings;
  }
  return n;
}

/** The entries must all be of one day. `left` is negative when over the target. */
export function dayNutrition(
  entries: Entry[],
  recipes: Recipes,
  targets: Targets | null,
) {
  const planned = sum(entries, recipes, false);
  const eaten = sum(entries, recipes, true);
  return {
    target: targets?.kcal ?? null,
    planned,
    eaten,
    left: targets ? targets.kcal - eaten.kcal : null,
    macros: {
      carbs: { eaten: eaten.carbs, target: targets?.carbs ?? null },
      protein: { eaten: eaten.protein, target: targets?.protein ?? null },
      fat: { eaten: eaten.fat, target: targets?.fat ?? null },
    },
  };
}

// `now` is a local "YYYY-MM-DDTHH:MM" so the clock stays a parameter.
const slotAt = (time: string): MealType =>
  time < "10:30"
    ? "breakfast"
    : time < "15:00"
      ? "lunch"
      : time < "18:00"
        ? "snack"
        : "dinner";

/** First unticked entry of today, from the slot matching the time on. */
export function nextMealId(entries: Entry[], now: string) {
  const from = MealType.options.indexOf(slotAt(now.slice(11, 16)));
  const rank = (e: Entry) => MealType.options.indexOf(e.slot as MealType);
  const next = entries
    .filter((e) => e.date === now.slice(0, 10) && !e.eatenAt && rank(e) >= from)
    .sort(
      (a, b) => rank(a) - rank(b) || (a.position ?? 0) - (b.position ?? 0),
    )[0];
  return next?.id ?? null;
}

/** Past days (before `today`) count what was eaten, the others what is planned. */
export function weekNutrition(
  entries: Entry[],
  recipes: Recipes,
  isoWeek: string,
  today: string,
) {
  const total = zero();
  const days = weekDays(isoWeek).map((date) => {
    const day = entries.filter((e) => e.date === date);
    const planned = sum(day, recipes, false);
    const eaten = sum(day, recipes, true);
    const isPast = date < today;
    for (const k of KEYS) total[k] += isPast ? eaten[k] : planned[k];
    return { date, planned, eaten, isPast };
  });
  return { days, total };
}
