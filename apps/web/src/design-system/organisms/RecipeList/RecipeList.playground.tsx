import { useState, type ComponentProps, type CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { RecipeList, type RecipeListItem } from "./RecipeList.tsx";

// Stand-in images for the demo only: a soft two-tone gradient with a "plate".
const img = (from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="100" fill="url(#g)"/><circle cx="80" cy="50" r="30" fill="#fff" fill-opacity=".35"/></svg>`,
  )}`;
const tomato = img("#FF8A65", "#E64A19");
const rice = img("#F5F0E6", "#D7CCC8");
const greens = img("#AED581", "#558B2F");
const lemon = img("#FFF59D", "#FBC02D");

const base = { href: "#recipe", photo: null, mosaic: [] };
const RECIPES: RecipeListItem[] = [
  {
    ...base,
    id: 1,
    title: "Grilled turkey with brown rice and asparagus",
    mealType: "lunch",
    kcal: 540,
    totalTime: "35 min",
    healthScore: 9,
    rating: 4,
    photo: img("#C2E66E", "#FFA257"),
  },
  {
    ...base,
    id: 2,
    title: "Overnight oats with berries",
    mealType: "breakfast",
    kcal: 380,
    totalTime: "5 min",
    healthScore: 8,
    rating: 5,
    mosaic: [lemon, rice],
  },
  {
    ...base,
    id: 3,
    title: "Salmon poke bowl",
    mealType: "dinner",
    kcal: 610,
    totalTime: "20 min",
    healthScore: 8,
    rating: null,
    mosaic: [tomato, rice, greens, lemon],
  },
  {
    ...base,
    id: 4,
    title: "Apple and peanut butter",
    mealType: "snack",
    kcal: 210,
    totalTime: null,
    healthScore: 6,
    rating: 3,
  },
  {
    ...base,
    id: 5,
    title:
      "Slow-roasted Mediterranean vegetables with herbed quinoa, feta crumbles, toasted pine nuts and a lemon tahini dressing",
    mealType: "dinner",
    kcal: 1240,
    totalTime: "1 h 15 min",
    healthScore: 10,
    rating: 5,
    photo: greens,
  },
  {
    ...base,
    id: 6,
    title: "Chickpea and spinach curry",
    mealType: "lunch",
    kcal: 480,
    totalTime: "40 min",
    healthScore: 9,
    rating: 4,
  },
];

// Total time in minutes, for the demo's sort; missing values go last.
const MINUTES: Record<number, number> = { 1: 35, 2: 5, 3: 20, 5: 75, 6: 40 };

type Props = ComponentProps<typeof RecipeList>;

// Does what the page will do: filters and sorts the recipes it is given.
function Live({
  recipes,
  loading,
  start,
}: {
  recipes: RecipeListItem[];
  loading?: boolean;
  start?: Partial<Pick<Props, "query" | "mealType" | "sort" | "view">>;
}) {
  const [query, setQuery] = useState(start?.query ?? "");
  const [mealType, setMealType] = useState(start?.mealType ?? "all");
  const [sort, setSort] = useState(start?.sort ?? "name");
  const [view, setView] = useState(start?.view ?? "list");
  const key = {
    name: (r: RecipeListItem) => r.title,
    kcal: (r: RecipeListItem) => r.kcal,
    health: (r: RecipeListItem) => -r.healthScore,
    time: (r: RecipeListItem) => MINUTES[r.id] ?? Infinity,
    rating: (r: RecipeListItem) => -(r.rating ?? -1),
  }[sort];
  const shown = recipes
    .filter(
      (r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) &&
        (mealType === "all" || r.mealType === mealType),
    )
    .sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  return (
    <RecipeList
      recipes={shown}
      loading={loading}
      query={query}
      mealType={mealType}
      sort={sort}
      view={view}
      onQueryChange={setQuery}
      onMealTypeChange={setMealType}
      onSortChange={setSort}
      onViewChange={setView}
      onAdd={() => {}}
    />
  );
}

// A 320 px phone frame, and a 1280 px frame that scrolls on its own on a narrow screen.
const narrow: CSSProperties = {
  maxWidth: "calc(var(--size-aside) - var(--space-5))",
  boxShadow: "var(--shadow-hairline)",
};
const wideScroll: CSSProperties = { overflowX: "auto" };
const wide: CSSProperties = {
  minWidth: "calc(var(--breakpoint-desktop) + var(--space-10) * 2)",
};

export default {
  title: "RecipeList",
  level: "organism",
  states: {
    "many items, list view (search, filter, sort and switch view: it's live; press Tab for the focus rings★)":
      <Live recipes={RECIPES} />,
    "many items, grid view (2 columns from 768 px, 1 on a phone)": (
      <Live recipes={RECIPES} start={{ view: "grid" }} />
    ),
    "1 item": <Live recipes={RECIPES.slice(0, 1)} />,
    "empty library (with Add recipe)": <Live recipes={[]} />,
    "no search results": <Live recipes={RECIPES} start={{ query: "pizza" }} />,
    "no results for a meal type": (
      <Live recipes={RECIPES.slice(0, 2)} start={{ mealType: "snack" }} />
    ),
    loading: <Live recipes={[]} loading />,
    "320 px, list view": (
      <div style={narrow}>
        <Live recipes={RECIPES.slice(0, 3)} />
      </div>
    ),
    "1280 px, grid view (on a phone, scroll this frame sideways)": (
      <div style={wideScroll}>
        <div style={wide}>
          <Live recipes={RECIPES.slice(0, 4)} start={{ view: "grid" }} />
        </div>
      </div>
    ),
  },
} satisfies Demo;
