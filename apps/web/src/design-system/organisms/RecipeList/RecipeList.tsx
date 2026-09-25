import { Button } from "../../atoms/Button/index.ts";
import { FilterTabs } from "../../atoms/FilterTabs/index.ts";
import { SearchField } from "../../atoms/SearchField/index.ts";
import { Segmented } from "../../atoms/Segmented/index.ts";
import { SelectPill } from "../../atoms/SelectPill/index.ts";
import { MenuListItem } from "../../molecules/MenuListItem/index.ts";
import { PhotoOrPlaceholder } from "../../molecules/PhotoOrPlaceholder/index.ts";
import styles from "./RecipeList.module.css";

type MealType = "breakfast" | "lunch" | "snack" | "dinner";
type Sort = "name" | "kcal" | "health" | "time" | "rating";
type View = "list" | "grid";

export type RecipeListItem = {
  id: number;
  href: string;
  title: string;
  mealType: MealType;
  kcal: number;
  totalTime: string | null;
  healthScore: number;
  rating: number | null;
  photo: string | null;
  mosaic: string[];
};

const MEALS = [
  { value: "all", text: "All" },
  { value: "breakfast", text: "Breakfast" },
  { value: "lunch", text: "Lunch" },
  { value: "snack", text: "Snack" },
  { value: "dinner", text: "Dinner" },
] as const;
const MEAL_LABEL = Object.fromEntries(MEALS.map((m) => [m.value, m.text]));

// RecipeSort in packages/shared.
const SORTS: { value: Sort; text: string }[] = [
  { value: "name", text: "Name" },
  { value: "kcal", text: "Calories" },
  { value: "health", text: "Health score" },
  { value: "time", text: "Total time" },
  { value: "rating", text: "Rating" },
];

const VIEWS = [
  { value: "list", icon: "steps", label: "List view" },
  { value: "grid", icon: "dashboard", label: "Grid view" },
] as const;

type Props = {
  recipes: RecipeListItem[];
  loading?: boolean;
  query: string;
  mealType: "all" | MealType;
  sort: Sort;
  view: View;
  onQueryChange: (query: string) => void;
  onMealTypeChange: (mealType: "all" | MealType) => void;
  onSortChange: (sort: Sort) => void;
  onViewChange: (view: View) => void;
  onAdd: () => void;
};

// .menu-toolbar and .menu-list from Healthy Menu (Featured, Popular and Recommended
// removed, SPEC-002 §4). Props only: the page fetches, filters and sorts.
export function RecipeList({
  recipes,
  loading = false,
  query,
  mealType,
  sort,
  view,
  onQueryChange,
  onMealTypeChange,
  onSortChange,
  onViewChange,
  onAdd,
}: Props) {
  const filtered = query !== "" || mealType !== "all";

  let body;
  if (loading) {
    body = (
      <p role="status" className={styles.status}>
        Loading recipes…
      </p>
    );
  } else if (recipes.length === 0 && filtered) {
    body = (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No recipes match</p>
        <p>Try another search or meal type.</p>
      </div>
    );
  } else if (recipes.length === 0) {
    body = (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No recipes yet</p>
        <p>Add one to start planning your meals.</p>
        <Button icon="add" onClick={onAdd}>
          Add your first recipe
        </Button>
      </div>
    );
  } else {
    body = (
      <ul className={`${styles.items} ${styles[view]}`}>
        {recipes.map((r) => (
          <li key={r.id}>
            <MenuListItem
              href={r.href}
              media={
                <PhotoOrPlaceholder
                  photo={r.photo}
                  mosaic={r.mosaic}
                  mealType={r.mealType}
                  size="thumb"
                />
              }
              title={r.title}
              mealType={r.mealType}
              mealLabel={MEAL_LABEL[r.mealType] ?? r.mealType}
              kcal={r.kcal}
              totalTime={r.totalTime}
              healthScore={r.healthScore}
              rating={r.rating}
              variant={view}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    // Not a landmark: the page's <main> is one, and a page may show more than one list.
    <div className={styles.recipes}>
      <div className={styles.head}>
        <h2 className={styles.title}>All recipes</h2>
        <Button size="sm" icon="add" onClick={onAdd}>
          Add recipe
        </Button>
        <Segmented
          label="View"
          options={VIEWS}
          value={view}
          onChange={onViewChange}
        />
      </div>
      <div className={styles.toolbar}>
        <span className={styles.search}>
          <SearchField
            label="Search recipes"
            size="sm"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </span>
        <FilterTabs
          label="Meal type"
          options={MEALS}
          value={mealType}
          onChange={onMealTypeChange}
        />
        <span className={styles.sort}>
          <span aria-hidden="true">Sort by:</span>
          <SelectPill
            label="Sort by"
            options={SORTS}
            value={sort}
            // The options are SORTS, so the value is a Sort.
            onChange={(e) => onSortChange(e.target.value as Sort)}
          />
        </span>
      </div>
      {body}
    </div>
  );
}
