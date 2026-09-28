// SPEC-002 US-2 and US-5 (AC-3): create and edit a recipe. The page fetches and
// saves; RecipeEditor stays props-only.
import { Ingredient, Recipe, type RecipeInput } from "@nutrigo/shared";
import { useEffect, useState } from "react";
import { Button } from "../design-system/atoms/Button/index.ts";
import { RecipeEditor } from "../design-system/organisms/RecipeEditor/index.ts";
import { navigate } from "../router.ts";
import styles from "./RecipeEditPage.module.css";

const LOAD_ERROR =
  "Couldn't load the recipe editor. Check the connection and try again.";
const SAVE_ERROR = "Couldn't save the recipe. Your input is kept, try again.";

type Loaded = { ingredients: Ingredient[]; recipe?: Recipe };

/** `id`: the recipe to edit; leave it out for a new one. */
export function RecipeEditPage({ id }: { id?: string }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoadError(false);
    try {
      const [ingredientsRes, recipeRes] = await Promise.all([
        fetch("/api/ingredients"),
        id ? fetch(`/api/recipes/${id}`) : undefined,
      ]);
      if (recipeRes?.status === 404) {
        setNotFound(true);
        return;
      }
      if (!ingredientsRes.ok || (recipeRes && !recipeRes.ok)) throw new Error();
      setData({
        ingredients: Ingredient.array().parse(await ingredientsRes.json()),
        recipe: recipeRes && Recipe.parse(await recipeRes.json()),
      });
    } catch {
      setLoadError(true);
    }
  }

  // App keys this page by path, so `id` never changes for this instance.
  useEffect(() => {
    void load();
  }, []);

  async function onSave(input: RecipeInput) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(id ? `/api/recipes/${id}` : "/api/recipes", {
        method: id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const saved: Recipe = await res.json();
      navigate(`/recipes/${saved.id}`);
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <main>
        <h1>Recipe not found</h1>
        <p>
          <a href="/recipes">Back to recipes</a>
        </p>
      </main>
    );
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

  if (data === null) {
    return (
      <main>
        <p role="status">
          {id ? "Loading the recipe…" : "Loading your ingredients…"}
        </p>
      </main>
    );
  }

  // Mounted only once loaded: the editor reads `recipe` once, into its draft.
  return (
    <main>
      <RecipeEditor
        recipe={data.recipe}
        ingredients={data.ingredients}
        saving={saving}
        error={error}
        onSave={onSave}
        onCancel={() => navigate(id ? `/recipes/${id}` : "/recipes")}
      />
    </main>
  );
}
