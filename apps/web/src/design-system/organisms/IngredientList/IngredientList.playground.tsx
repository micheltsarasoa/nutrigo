import { useState, type ComponentProps, type CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import {
  IngredientList,
  type Category,
  type IngredientListItem,
} from "./IngredientList.tsx";

// Per 100 g. Real ingredients from the owner's library, plus two imported ones for the source chip.
const item = (
  id: number,
  name: string,
  category: Category,
  kcal: number,
  carbs: number,
  protein: number,
  fat: number,
  source: string | null = null,
): IngredientListItem => ({
  id,
  href: "#ingredient",
  name,
  category,
  kcal,
  carbs,
  protein,
  fat,
  source,
});
const INGREDIENTS = [
  item(10, "Asparagus", "veggies", 20, 3.9, 2.2, 0.1),
  item(5, "Blueberries", "fruits", 57, 14.5, 0.7, 0.3),
  item(15, "Broccoli", "veggies", 34, 6.6, 2.8, 0.4),
  item(4, "Brown rice", "grains", 362, 76, 7.5, 2.7),
  item(7, "Chia seeds", "others", 486, 42, 17, 31),
  item(11, "Garlic", "veggies", 149, 33, 6.4, 0.5),
  item(8, "Greek yoghurt 0%", "dairy", 59, 3.6, 10, 0.4),
  item(12, "Honey", "others", 304, 82, 0.3, 0),
  item(16, "Lemon", "fruits", 29, 9.3, 1.1, 0.3),
  item(6, "Olive oil", "others", 884, 0, 0, 100),
  item(3, "Rolled oats", "grains", 379, 60, 13, 7),
  item(2, "Salmon fillet", "protein", 208, 0, 20, 13),
  item(13, "Semi-skimmed milk", "dairy", 46, 4.8, 3.4, 1.6),
  item(14, "Sweet potato", "veggies", 86, 20, 1.6, 0.1),
  item(1, "Turkey breast", "protein", 114, 0, 24, 1.5),
  item(20, "Kale", "veggies", 35.4, 4.4, 2.9, 0.7, "Ciqual"),
  item(
    21,
    "Semi-skimmed UHT milk, fortified with vitamin D and calcium",
    "dairy",
    47,
    4.8,
    3.3,
    1.6,
    "Open Food Facts",
  ),
];

type Props = ComponentProps<typeof IngredientList>;

// Does what the page will do: counts, filters and sorts the ingredients it is given.
function Live({
  ingredients,
  loading,
  start,
}: {
  ingredients: IngredientListItem[];
  loading?: boolean;
  start?: Partial<Pick<Props, "query" | "category" | "sort">>;
}) {
  const [query, setQuery] = useState(start?.query ?? "");
  const [category, setCategory] = useState(start?.category ?? "all");
  const [sort, setSort] = useState(start?.sort ?? "name");
  const counts = {
    all: ingredients.length,
    grains: 0,
    veggies: 0,
    protein: 0,
    fruits: 0,
    dairy: 0,
    others: 0,
  };
  for (const i of ingredients) counts[i.category]++;
  const shown = ingredients
    .filter(
      (i) =>
        i.name.toLowerCase().includes(query.toLowerCase()) &&
        (category === "all" || i.category === category),
    )
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : b[sort] - a[sort],
    );
  return (
    <IngredientList
      ingredients={shown}
      counts={counts}
      loading={loading}
      query={query}
      category={category}
      sort={sort}
      onQueryChange={setQuery}
      onCategoryChange={setCategory}
      onSortChange={setSort}
      onAdd={() => {}}
    />
  );
}

// A 390 px phone frame: the table scrolls inside its own box, the page doesn't.
const narrow: CSSProperties = {
  maxWidth: "calc(var(--size-aside) + var(--space-10) + var(--space-3))",
  boxShadow: "var(--shadow-hairline)",
};

export default {
  title: "IngredientList",
  level: "organism",
  states: {
    "many items (search, filter by category, sort: it's live; press Tab for the focus rings★)":
      <Live ingredients={INGREDIENTS} />,
    "sorted by protein, highest first": (
      <Live ingredients={INGREDIENTS} start={{ sort: "protein" }} />
    ),
    "imported ingredients show their source, manual ones don't": (
      <Live ingredients={INGREDIENTS.slice(-3)} />
    ),
    "1 item": <Live ingredients={INGREDIENTS.slice(0, 1)} />,
    "empty library (with Add your first ingredient)": <Live ingredients={[]} />,
    "no search results": (
      <Live ingredients={INGREDIENTS} start={{ query: "pizza" }} />
    ),
    "no results for a category": (
      <Live
        ingredients={INGREDIENTS.slice(0, 2)}
        start={{ category: "dairy" }}
      />
    ),
    loading: <Live ingredients={[]} loading />,
    "390 px (the table scrolls sideways inside its card)": (
      <div style={narrow}>
        <Live ingredients={INGREDIENTS.slice(0, 5)} />
      </div>
    ),
  },
} satisfies Demo;
