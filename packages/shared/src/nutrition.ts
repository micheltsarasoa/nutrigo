// SPEC-002 §7. Values are never rounded here; rounding is for display only.

type Unit = "g" | "ml" | "piece";
type Per100 = {
  kcal100g: number;
  carbs100g: number;
  protein100g: number;
  fat100g: number;
  fibre100g?: number | null;
  sugars100g?: number | null;
  sodiumMg100g?: number | null;
  gramsPerUnit?: number | null;
};
type Line = { quantity: number; unit: Unit };

export type Nutrition = {
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  fibre: number;
  sugars: number;
  sodiumMg: number;
};

export function toGrams(quantity: number, unit: Unit, ingredient: Per100) {
  if (unit === "g") return quantity;
  if (unit === "ml") return quantity * (ingredient.gramsPerUnit ?? 1);
  if (!ingredient.gramsPerUnit)
    throw new Error("A piece needs the ingredient's grams per unit");
  return quantity * ingredient.gramsPerUnit;
}

export function nutritionPerServing(recipe: {
  servings: number;
  ingredients: (Line & { ingredient: Per100 })[];
}): Nutrition {
  const n: Nutrition = {
    kcal: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    fibre: 0,
    sugars: 0,
    sodiumMg: 0,
  };
  for (const { quantity, unit, ingredient: i } of recipe.ingredients) {
    const f = toGrams(quantity, unit, i) / 100 / recipe.servings;
    n.kcal += i.kcal100g * f;
    n.carbs += i.carbs100g * f;
    n.protein += i.protein100g * f;
    n.fat += i.fat100g * f;
    n.fibre += (i.fibre100g ?? 0) * f;
    n.sugars += (i.sugars100g ?? 0) * f;
    n.sodiumMg += (i.sodiumMg100g ?? 0) * f;
  }
  return n;
}

export function scaleQuantities<L extends Line>(
  recipe: { servings: number; ingredients: L[] },
  servings: number,
): L[] {
  return recipe.ingredients.map((line) => ({
    ...line,
    quantity:
      Math.round((line.quantity * servings * 100) / recipe.servings) / 100,
  }));
}

export function totalTime(recipe: {
  prepMin?: number | null;
  cookMin?: number | null;
}) {
  if (recipe.prepMin == null && recipe.cookMin == null) return null;
  return (recipe.prepMin ?? 0) + (recipe.cookMin ?? 0);
}

/** 0–10 (PRD Q8). The bonuses and penalties can't leave that range, so there's no clamp. */
export function healthScore(n: Nutrition, categories: string[]) {
  let score = 5;
  if (n.protein >= 20) score += 2;
  if (n.fibre >= 5) score += 1;
  if (n.kcal >= 300 && n.kcal <= 700) score += 1;
  if (new Set(categories).size >= 3) score += 1;
  if (n.sugars > 15) score -= 1;
  if (n.sodiumMg > 800) score -= 1;
  if (n.kcal > 0 && (n.fat * 9) / n.kcal > 0.4) score -= 1;
  return score;
}
