import { useState, type CSSProperties } from "react";
import type { Demo } from "../../../playground/types.ts";
import { RecipeDetail, type RecipeDetailData } from "./RecipeDetail.tsx";

// Stand-in images for the demo only: a soft two-tone gradient with a "plate".
const img = (from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="100" fill="url(#g)"/><circle cx="80" cy="50" r="30" fill="#fff" fill-opacity=".35"/></svg>`,
  )}`;

// Quantities for the recipe's 2 servings; the demo scales them like the page will.
const BASE = 2;
const LINES = [
  { quantity: 250, unit: "g", name: "turkey breast" },
  { quantity: 100, unit: "g", name: "brown rice" },
  { quantity: 150, unit: "g", name: "asparagus" },
  { quantity: 10, unit: "ml", name: "olive oil" },
  { quantity: 1, unit: "piece", name: "lemon" },
];
const scaled = (servings: number) =>
  LINES.map((l) => ({
    quantity: `${Math.round((l.quantity * servings * 100) / BASE) / 100} ${l.unit}`,
    name: l.name,
  }));

const FULL: RecipeDetailData = {
  title: "Grilled turkey breast with steamed asparagus and brown rice",
  mealType: "lunch",
  description:
    "A lean and balanced meal for a post-workout lunch. The grilled turkey is a rich source of lean protein, while the asparagus and brown rice bring fibre, vitamins and minerals.",
  photo: img("#C2E66E", "#FFA257"),
  mosaic: [],
  prepTime: "10 min",
  cookTime: "15 min",
  difficulty: "Medium",
  healthScore: 9,
  rating: 4,
  macros: { kcal: "540", carbs: "61", protein: "42", fat: "14" },
  nutrition: [
    { label: "Carbs", value: "61 g" },
    { label: "Protein", value: "42 g" },
    { label: "Fat", value: "14 g" },
    { label: "Fibre", value: "6 g" },
    { label: "Sugars", value: "4 g" },
    { label: "Sodium", value: "620 mg" },
  ],
  ingredients: scaled(BASE),
  steps: [
    {
      title: "Prepare the turkey",
      body: "Season the turkey breast with olive oil, salt and pepper. Set aside.",
    },
    {
      title: "Cook the brown rice",
      body: "Simmer the rice in twice its volume of water for 15 minutes, until tender.",
    },
    {
      title: "Grill the turkey",
      body: "Grill for 6 to 7 minutes on each side, until cooked through.",
    },
    {
      title: "Steam the asparagus",
      body: "Steam for 5 minutes, until tender.",
    },
    {
      title: "Serve",
      body: "Plate the turkey, rice and asparagus, with a lemon wedge.",
    },
  ],
  tools: [
    "Grill pan",
    "Medium pot with a steamer basket",
    "Saucepan",
    "Tongs",
    "Cutting board",
    "Knife",
  ],
  notes: [
    "For more flavour, marinate the turkey in lemon juice and garlic for 30 minutes before grilling.",
    "You can swap the brown rice for quinoa or couscous.",
  ],
};

const MINIMAL: RecipeDetailData = {
  ...FULL,
  title: "Apple and peanut butter",
  mealType: "snack",
  description: null,
  photo: null,
  prepTime: "5 min",
  cookTime: null,
  difficulty: null,
  healthScore: 6,
  rating: null,
  macros: { kcal: "210", carbs: "24", protein: "6", fat: "11" },
  nutrition: [
    { label: "Fibre", value: "4 g" },
    { label: "Sugars", value: null },
    { label: "Sodium", value: null },
  ],
  ingredients: [],
  steps: [],
  tools: [],
  notes: [],
};

function Live({
  recipe = FULL,
  start = BASE,
}: {
  recipe?: RecipeDetailData;
  start?: number;
}) {
  const [servings, setServings] = useState(start);
  const ingredients =
    recipe === FULL
      ? scaled(servings)
      : [
          { quantity: "1 piece", name: "apple" },
          { quantity: "20 g", name: "peanut butter" },
        ];
  return (
    <RecipeDetail
      recipe={{ ...recipe, ingredients }}
      servings={servings}
      onServingsChange={setServings}
      onBack={() => {}}
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
  title: "RecipeDetail",
  level: "organism",
  states: {
    "full recipe (2 columns from 900 px; change the servings: ingredients scale, nutrition per serving doesn't; press Tab for the focus ring★)":
      <Live />,
    "minimal (no steps, tools or notes; no photo, description or rating)": (
      <Live recipe={MINIMAL} />
    ),
    "servings changed (3 of 2)": <Live start={3} />,
    loading: (
      <RecipeDetail
        recipe={null}
        loading
        servings={BASE}
        onServingsChange={() => {}}
        onBack={() => {}}
      />
    ),
    "not found": (
      <RecipeDetail
        recipe={null}
        servings={BASE}
        onServingsChange={() => {}}
        onBack={() => {}}
      />
    ),
    "320 px": (
      <div style={narrow}>
        <Live />
      </div>
    ),
    "1280 px (on a phone, scroll this frame sideways)": (
      <div style={wideScroll}>
        <div style={wide}>
          <Live />
        </div>
      </div>
    ),
  },
} satisfies Demo;
