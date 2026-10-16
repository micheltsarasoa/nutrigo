import { useState, type ComponentProps } from "react";
import { formatEUR } from "@nutrigo/shared";
import { Button } from "../../atoms/Button/index.ts";
import { FilterTabs } from "../../atoms/FilterTabs/index.ts";
import { SearchField } from "../../atoms/SearchField/index.ts";
import { Select } from "../../atoms/Select/index.ts";
import {
  GroceryRow,
  type GroceryItem,
} from "../../molecules/GroceryRow/index.ts";
import { KpiCard } from "../../molecules/KpiCard/index.ts";
import styles from "./GroceryTable.module.css";

export type GroceryTableItem = GroceryItem & { id: string };

type Props = {
  /** `ready` shows the list; the other two are the empty states. */
  state: "ready" | "noPlan" | "noList";
  /** "week 40", used in the empty-state titles. */
  weekLabel: string;
  items?: GroceryTableItem[];
  /** Estimated cost, Total items, Total kcal; the caller formats value and delta. */
  kpis?: ComponentProps<typeof KpiCard>[];
  locale?: "fr-FR" | "en-IE";
  onToggle?: (id: string, purchased: boolean) => void;
  onQuantity?: (id: string, quantity: number) => void;
  onActual?: (id: string, cents: number | null) => void;
  onRegenerate?: () => void;
  onGenerate?: () => void;
  onGoToPlan?: () => void;
  onInsights?: () => void;
};

const ALL = "All";
const SORTS = [
  { value: "plan", text: "Plan order" },
  { value: "name", text: "Name" },
  { value: "cost", text: "Cost" },
];
const HEAD = ["", "Item", "Category", "Qty", "kcal", "Cost", "Actual · Status"];
const noop = () => {};

// Sprint 4 sketch (grocery list, desktop): KPI row, category tabs, search, sort, one scrolling table.
export function GroceryTable({
  state,
  weekLabel,
  items = [],
  kpis = [],
  locale = "fr-FR",
  onToggle = noop,
  onQuantity = noop,
  onActual = noop,
  onRegenerate,
  onGenerate,
  onGoToPlan,
  onInsights,
}: Props) {
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("plan");

  if (state === "noPlan") {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No plan for {weekLabel}</p>
        <p>Plan some meals first, then generate your list.</p>
        <Button onClick={onGoToPlan}>Go to meal plan</Button>
      </div>
    );
  }
  if (state === "noList") {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No list yet</p>
        <p>Build it from this week&apos;s plan.</p>
        <Button onClick={onGenerate}>Generate list</Button>
      </div>
    );
  }

  const categories = [...new Set(items.map((i) => i.category))];
  const count = (c: string) =>
    items.filter((i) => c === ALL || i.category === c).length;
  const q = query.trim().toLowerCase();
  const shown = items
    .filter((i) => category === ALL || i.category === category)
    .filter((i) => i.name.toLowerCase().includes(q));
  if (sort === "name") shown.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "cost")
    shown.sort((a, b) => (b.estCents ?? -1) - (a.estCents ?? -1));

  const allBought = items.length > 0 && items.every((i) => i.purchased);
  const sum = (pick: (i: GroceryTableItem) => number | null) =>
    items.reduce((t, i) => t + (pick(i) ?? 0), 0);

  return (
    <section className={styles.table} aria-label={`Grocery list, ${weekLabel}`}>
      <div className={styles.kpis}>
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {allBought && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>All {items.length} items bought</p>
          <p>
            Estimated{" "}
            {formatEUR(
              sum((i) => i.estCents),
              locale,
            )}{" "}
            · actual{" "}
            {formatEUR(
              sum((i) => i.actualCents),
              locale,
            )}
          </p>
          <Button variant="ghost" onClick={onInsights}>
            View insights
          </Button>
        </div>
      )}

      <div className={styles.toolbar}>
        <FilterTabs
          label="Category"
          value={category}
          onChange={setCategory}
          options={[ALL, ...categories].map((c) => ({
            value: c,
            text: `${c} ${count(c)}`,
          }))}
        />
        <SearchField
          label="Search items"
          size="sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          label="Sort by"
          options={SORTS}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        />
        {onRegenerate && (
          <Button variant="ghost" size="sm" onClick={onRegenerate}>
            Regenerate
          </Button>
        )}
      </div>

      <div className={styles.rows}>
        {/* Every control in a row names its item, so the visual header is skipped by screen readers. */}
        <div className={styles.head} aria-hidden>
          {HEAD.map((h, i) => (
            <span key={i}>{h}</span>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className={styles.none}>No items match</p>
        ) : (
          shown.map((i) => (
            <GroceryRow
              key={i.id}
              item={i}
              locale={locale}
              onToggle={(p) => onToggle(i.id, p)}
              onQuantity={(n) => onQuantity(i.id, n)}
              onActual={(c) => onActual(i.id, c)}
            />
          ))
        )}
      </div>
    </section>
  );
}
