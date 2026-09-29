// SPEC-002 US-3 (AC-4, AC-5, AC-7, AC-10): browse, search, filter and sort
// recipes. The page fetches; RecipeList stays props-only.
import { type MealType, type RecipeSort, RecipeSummary } from "@nutrigo/shared";
import { useEffect, useState } from "react";
import { Button } from "../design-system/atoms/Button/index.ts";
import { RecipeList } from "../design-system/organisms/RecipeList/index.ts";
import { navigate } from "../router.ts";
import styles from "./RecipesPage.module.css";

const LIST_ERROR =
  "Couldn't load your recipes. Check the connection and try again.";
const VIEW_KEY = "nutrigo.recipes.view";

type View = "list" | "grid";

// AC-7: remembered on this device. Storage can be missing or blocked.
function storedView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

// 35 → "35 min", 75 → "1 h 15 min", 60 → "1 h".
export function formatMinutes(total: number | null | undefined) {
  if (!total) return null;
  const h = Math.floor(total / 60);
  const min = total % 60;
  return [h && `${h} h`, min && `${min} min`].filter(Boolean).join(" ");
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [mealType, setMealType] = useState<"all" | MealType>("all");
  const [sort, setSort] = useState<RecipeSort>("name");
  const [view, setView] = useState(storedView);

  // The API searches, filters and sorts. Each change aborts the request before
  // it; the previous results stay on screen until the new ones arrive.
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ sort });
    if (query.trim()) params.set("q", query.trim());
    if (mealType !== "all") params.set("mealType", mealType);
    setError(false);
    fetch(`/api/recipes?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setRecipes(RecipeSummary.array().parse(await res.json()));
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [query, mealType, sort, attempt]);

  function onViewChange(next: View) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Not remembered, but the view still switches.
    }
  }

  return (
    <main>
      <div className={styles.head}>
        <h1>Recipes</h1>
        <a href="/ingredients" className={styles.link}>
          Ingredients
        </a>
      </div>
      {error ? (
        <div role="alert" className={styles.alert}>
          <p>{LIST_ERROR}</p>
          <Button variant="ghost" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </Button>
        </div>
      ) : (
        <RecipeList
          recipes={(recipes ?? []).map((r) => ({
            id: r.id,
            href: `/recipes/${r.id}`,
            title: r.name,
            mealType: r.mealType,
            kcal: Math.round(r.kcalPerServing),
            totalTime: formatMinutes(r.totalMin),
            healthScore: r.healthScore,
            rating: r.rating,
            // ponytail: no photo route yet, so every card gets the meal-type
            // placeholder; map photoPath and the ingredient mosaic when photos land.
            photo: null,
            mosaic: [],
          }))}
          loading={recipes === null}
          query={query}
          mealType={mealType}
          sort={sort}
          view={view}
          onQueryChange={setQuery}
          onMealTypeChange={setMealType}
          onSortChange={setSort}
          onViewChange={onViewChange}
          onAdd={() => navigate("/recipes/new")}
        />
      )}
    </main>
  );
}
