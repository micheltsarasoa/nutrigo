import { toGrams } from "./nutrition.ts";
import type { Category, Unit } from "./recipes.ts";

// SPEC-005 §7. Money is integer cents; quantities are never rounded here.
type Weighable = { gramsPerUnit?: number | null };
type PricedIngredient = Weighable & {
  priceCents?: number | null;
  pricePackQty?: number | null;
  pricePackUnit?: Unit | null;
};
type PlanLine = {
  ingredient: Weighable & { id: number; name: string; category: Category };
  quantity: number;
  unit: Unit;
};
export type BuiltItem = {
  ingredientId: number;
  label: string;
  category: Category;
  quantity: number;
  unit: Unit;
};

const grams = (q: number, unit: Unit, i: Weighable) =>
  toGrams(q, unit, {
    ...i,
    kcal100g: 0,
    carbs100g: 0,
    protein100g: 0,
    fat100g: 0,
  });
const canConvert = (unit: Unit, i: Weighable) =>
  unit !== "piece" || Boolean(i.gramsPerUnit);

export function buildList(
  entries: { recipeId: number; servings: number }[],
  recipes: { id: number; servings: number; lines: PlanLine[] }[],
): BuiltItem[] {
  const byIngredient = new Map<
    number,
    { line: PlanLine; perUnit: Map<Unit, number> }
  >();
  for (const { recipeId, servings } of entries) {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) continue;
    for (const line of recipe.lines) {
      const group = byIngredient.get(line.ingredient.id) ?? {
        line,
        perUnit: new Map(),
      };
      group.perUnit.set(
        line.unit,
        (group.perUnit.get(line.unit) ?? 0) +
          (line.quantity * servings) / recipe.servings,
      );
      byIngredient.set(line.ingredient.id, group);
    }
  }
  return [...byIngredient.values()].flatMap(
    ({ line: { ingredient: i }, perUnit }) => {
      const base = { ingredientId: i.id, label: i.name, category: i.category };
      const units = [...perUnit];
      if (units.length > 1 && units.every(([u]) => canConvert(u, i))) {
        const quantity = units.reduce((sum, [u, q]) => sum + grams(q, u, i), 0);
        return [{ ...base, quantity, unit: "g" as const }];
      }
      return units.map(([unit, quantity]) => ({ ...base, quantity, unit }));
    },
  );
}

/** Whole packs only (AC-3). Null when there is no price or the units cannot be converted (AC-4). */
export function estimateCost(
  quantity: number,
  unit: Unit,
  ingredient: PricedIngredient,
) {
  const { priceCents, pricePackQty, pricePackUnit } = ingredient;
  if (priceCents == null || !pricePackQty || !pricePackUnit) return null;
  if (!canConvert(unit, ingredient) || !canConvert(pricePackUnit, ingredient))
    return null;
  const inPackUnit =
    unit === pricePackUnit
      ? quantity
      : grams(quantity, unit, ingredient) / grams(1, pricePackUnit, ingredient);
  // The epsilon absorbs float noise from summed fractions, so 500.0000000001 g is one pack.
  return Math.ceil(inPackUnit / pricePackQty - 1e-9) * priceCents;
}
