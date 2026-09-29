import type { ComponentProps } from "react";
import { Button } from "../../atoms/Button/index.ts";
import { Card } from "../../atoms/Card/index.ts";
import { FilterTabs } from "../../atoms/FilterTabs/index.ts";
import { Pill } from "../../atoms/Pill/index.ts";
import { SearchField } from "../../atoms/SearchField/index.ts";
import { SelectPill } from "../../atoms/SelectPill/index.ts";
import styles from "./IngredientList.module.css";

// Category in packages/shared. The tones are the ones the Grocery List design gives them.
export type Category =
  "grains" | "veggies" | "protein" | "fruits" | "dairy" | "others";
type Sort = "name" | "kcal" | "protein";
type Tone = ComponentProps<typeof Pill>["variant"];

export type IngredientListItem = {
  id: number;
  href: string;
  name: string;
  category: Category;
  // Per 100 g.
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  // Shown as a chip beside the name; null for a manual entry, which is the norm.
  source: string | null;
};

const CATEGORIES: { value: Category; text: string; tone: Tone }[] = [
  { value: "grains", text: "Grains", tone: "green" },
  { value: "veggies", text: "Veggies", tone: "yellow" },
  { value: "protein", text: "Protein", tone: "orange" },
  { value: "fruits", text: "Fruits", tone: "orange" },
  { value: "dairy", text: "Dairy", tone: "yellow" },
  { value: "others", text: "Others", tone: "grey" },
];
const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

const SORTS: { value: Sort; text: string }[] = [
  { value: "name", text: "Name" },
  { value: "kcal", text: "Calories" },
  { value: "protein", text: "Protein" },
];

// The dot is the macro's colour: kcal green, carbs yellow, protein orange, fat grey.
const whole = (n: number) => String(Math.round(n));
const oneDecimal = (n: number) => n.toFixed(1);
const COLUMNS = [
  { key: "kcal", text: "kcal", dot: styles.kcal, show: whole },
  { key: "carbs", text: "Carbs g", dot: styles.carbs, show: oneDecimal },
  { key: "protein", text: "Protein g", dot: styles.protein, show: oneDecimal },
  { key: "fat", text: "Fat g", dot: styles.fat, show: oneDecimal },
] as const;

type Props = {
  // Already filtered and sorted by the page.
  ingredients: IngredientListItem[];
  // How many ingredients each tab holds, before the search and category filter.
  counts: Record<"all" | Category, number>;
  loading?: boolean;
  query: string;
  category: "all" | Category;
  sort: Sort;
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: "all" | Category) => void;
  onSortChange: (sort: Sort) => void;
  onAdd: () => void;
};

// The ingredients table of design "A · Table". Props only: the page fetches, filters and sorts.
export function IngredientList({
  ingredients,
  counts,
  loading = false,
  query,
  category,
  sort,
  onQueryChange,
  onCategoryChange,
  onSortChange,
  onAdd,
}: Props) {
  const filtered = query !== "" || category !== "all";
  const tabs = [{ value: "all", text: "All" }, ...CATEGORIES].map((c) => ({
    value: c.value as "all" | Category,
    text: `${c.text} ${counts[c.value as "all" | Category]}`,
  }));

  let body;
  if (loading) {
    body = (
      <p role="status" className={styles.status}>
        Loading ingredients…
      </p>
    );
  } else if (ingredients.length === 0 && filtered) {
    body = (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No ingredients match</p>
        <p>Try another search or category.</p>
      </div>
    );
  } else if (ingredients.length === 0) {
    body = (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No ingredients yet</p>
        <p>Add one to start building recipes.</p>
        <Button icon="add" onClick={onAdd}>
          Add your first ingredient
        </Button>
      </div>
    );
  } else {
    body = (
      <Card>
        <div className={styles.scroll}>
          <table
            className={styles.table}
            aria-label="Ingredients, nutrition per 100 g"
          >
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Category</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} scope="col" className={styles.num}>
                    <span className={`${styles.dot} ${c.dot}`} aria-hidden />
                    {c.text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredients.map((i) => (
                <tr key={i.id} className={styles.row}>
                  <th scope="row">
                    <a href={i.href} className={styles.link}>
                      {i.name}
                    </a>
                    {i.source && (
                      <span className={styles.source}>
                        <Pill variant="grey">{i.source}</Pill>
                      </span>
                    )}
                  </th>
                  <td>
                    <Pill variant={CATEGORY[i.category]?.tone ?? "grey"}>
                      {CATEGORY[i.category]?.text ?? i.category}
                    </Pill>
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className={styles.num}>
                      {c.show(i[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  return (
    // Not a landmark: the page's <main> is one.
    <div className={styles.ingredients}>
      <div className={styles.toolbar}>
        <span className={styles.search}>
          <SearchField
            label="Search ingredients"
            size="sm"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </span>
        <FilterTabs
          label="Category"
          options={tabs}
          value={category}
          onChange={onCategoryChange}
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
