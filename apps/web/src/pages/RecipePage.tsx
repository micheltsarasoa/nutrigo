// SPEC-002 US-4 and US-5 (AC-6, AC-10): open a recipe, scale its servings, see
// nutrition per serving and the health score. The page fetches; RecipeDetail
// stays props-only.
import { RecipeDetail, scaleQuantities } from "@nutrigo/shared";
import { useEffect, useState } from "react";
import { Button } from "../design-system/atoms/Button/index.ts";
import {
  RecipeDetail as Detail,
  type RecipeDetailData,
} from "../design-system/organisms/RecipeDetail/index.ts";
import { navigate } from "../router.ts";
import { formatMinutes } from "./RecipesPage.tsx";
import styles from "./RecipePage.module.css";

const LOAD_ERROR =
  "Couldn't load the recipe. Check the connection and try again.";
const DELETE_ERROR = "Couldn't delete the recipe. Try again.";
const DIFFICULTY = { easy: "Easy", medium: "Medium", hard: "Hard" };

// ponytail: numbers aren't formatted for the locale setting yet, as on
// RecipesPage; use formatNumber with the settings' locale once a page reads it.
const round = (n: number) => String(Math.round(n));

function toDetail(recipe: RecipeDetail, servings: number): RecipeDetailData {
  const n = recipe.nutritionPerServing;
  return {
    title: recipe.name,
    mealType: recipe.mealType,
    description: recipe.description ?? null,
    photo: recipe.photoPath,
    mosaic: [],
    prepTime: formatMinutes(recipe.prepMin),
    cookTime: formatMinutes(recipe.cookMin),
    difficulty: recipe.difficulty ? DIFFICULTY[recipe.difficulty] : null,
    healthScore: recipe.healthScore,
    rating: recipe.rating ?? null,
    macros: {
      kcal: round(n.kcal),
      carbs: round(n.carbs),
      protein: round(n.protein),
      fat: round(n.fat),
    },
    nutrition: [
      { label: "Carbs", value: `${round(n.carbs)} g` },
      { label: "Protein", value: `${round(n.protein)} g` },
      { label: "Fat", value: `${round(n.fat)} g` },
      { label: "Fibre", value: `${round(n.fibre)} g` },
      { label: "Sugars", value: `${round(n.sugars)} g` },
      { label: "Sodium", value: `${round(n.sodiumMg)} mg` },
    ],
    ingredients: scaleQuantities(recipe, servings).map((line) => ({
      quantity: `${line.quantity} ${line.unit}`,
      name: line.name,
    })),
    steps: recipe.steps,
    tools: recipe.tools.map((t) => t.name),
    // One note per non-empty line of the notes field.
    notes: (recipe.notes ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

export function RecipePage({ id }: { id: string }) {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [servings, setServings] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoadError(false);
    try {
      const res = await fetch(`/api/recipes/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error();
      const loaded = RecipeDetail.parse(await res.json());
      setServings(loaded.servings);
      setRecipe(loaded);
    } catch {
      setLoadError(true);
    }
  }

  // App keys this page by path, so `id` never changes for this instance.
  useEffect(() => {
    void load();
  }, []);

  async function onDelete() {
    if (!recipe || !confirm(`Delete ${recipe.name}?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      navigate("/recipes");
    } catch {
      setError(DELETE_ERROR);
    } finally {
      setDeleting(false);
    }
  }

  if (loadError) {
    return (
      <main>
        <div role="alert" className={styles.alert}>
          <p>{LOAD_ERROR}</p>
          <Button variant="ghost" onClick={load}>
            Retry
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main data-canvas="surface">
      {recipe && (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            icon="prev"
            onClick={() => navigate("/recipes")}
          >
            Recipes
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`/recipes/${id}/edit`)}
          >
            Edit
          </Button>
          <Button variant="ghost" loading={deleting} onClick={onDelete}>
            Delete
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className={styles.alert}>
          {error}
        </p>
      )}
      <Detail
        loading={!recipe && !notFound}
        recipe={recipe && toDetail(recipe, servings)}
        servings={servings}
        onServingsChange={setServings}
        onBack={() => navigate("/recipes")}
      />
    </main>
  );
}
