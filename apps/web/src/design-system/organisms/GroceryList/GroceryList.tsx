import { useId } from "react";
import { formatEUR } from "@nutrigo/shared";
import { Button } from "../../atoms/Button/index.ts";
import { Card } from "../../atoms/Card/index.ts";
import { ProgressBar } from "../../atoms/ProgressBar/index.ts";
import { CheckRow } from "../../molecules/CheckRow/index.ts";
import { OfflineBanner } from "../../molecules/OfflineBanner/index.ts";
import type { GroceryTableItem } from "../GroceryTable/index.ts";
import styles from "./GroceryList.module.css";

type Props = {
  /** `ready` shows the list; the other two are the empty states. */
  state: "ready" | "noPlan" | "noList";
  /** "week 40", used in the titles. */
  weekLabel: string;
  items?: GroceryTableItem[];
  /** Left out when online and in sync. */
  sync?: { state: "offline" | "syncing" | "error"; pending: number };
  locale?: "fr-FR" | "en-IE";
  onToggle?: (id: string, purchased: boolean) => void;
  onOpen?: (id: string) => void;
  onAdd?: () => void;
  onRetry?: () => void;
  onGenerate?: () => void;
  onGoToPlan?: () => void;
  onInsights?: () => void;
};

const noop = () => {};

function Category({
  name,
  rows,
  ...rest
}: {
  name: string;
  rows: GroceryTableItem[];
  locale: "fr-FR" | "en-IE";
  onToggle: (id: string, purchased: boolean) => void;
  onOpen?: (id: string) => void;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={styles.category}>
      <h3 id={id} className={styles.caption}>
        {name}
      </h3>
      <ul className={styles.rows}>
        {rows.map((i) => (
          <li key={i.id}>
            <CheckRow
              item={i}
              locale={rest.locale}
              onToggle={(p) => rest.onToggle(i.id, p)}
              onOpen={rest.onOpen && (() => rest.onOpen?.(i.id))}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

// Sprint 4 sketch, derived mobile list (ADR-0016, AC-11): summary with progress, one section per
// category, a sticky "Add item".
export function GroceryList({
  state,
  weekLabel,
  items = [],
  sync,
  locale = "fr-FR",
  onToggle = noop,
  onOpen,
  onAdd,
  onRetry,
  onGenerate,
  onGoToPlan,
  onInsights,
}: Props) {
  if (state !== "ready") {
    const none = state === "noPlan";
    return (
      <Card>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {none ? `No plan for ${weekLabel}` : "No list yet"}
          </p>
          <p>
            {none
              ? "Plan some meals first, then generate your list."
              : "Build it from this week's plan."}
          </p>
          <Button onClick={none ? onGoToPlan : onGenerate}>
            {none ? "Go to meal plan" : "Generate list"}
          </Button>
        </div>
      </Card>
    );
  }

  const bought = items.filter((i) => i.purchased).length;
  const allBought = items.length > 0 && bought === items.length;
  const sum = (pick: (i: GroceryTableItem) => number | null) =>
    items.reduce((t, i) => t + (pick(i) ?? 0), 0);
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className={styles.list}>
      {sync && <OfflineBanner {...sync} onRetry={onRetry} />}

      <Card>
        {allBought ? (
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
        ) : (
          <div className={styles.summary}>
            <div className={styles.head}>
              <b>{weekLabel.charAt(0).toUpperCase() + weekLabel.slice(1)}</b>
              <span className={styles.num}>
                {bought} of {items.length}
              </span>
            </div>
            <ProgressBar
              label="Items bought"
              value={bought}
              max={items.length}
            />
            <span className={styles.hint}>
              Estimated ~
              {formatEUR(
                sum((i) => i.estCents),
                locale,
              )}
            </span>
          </div>
        )}
      </Card>

      {categories.map((c) => (
        <Category
          key={c}
          name={c}
          rows={items.filter((i) => i.category === c)}
          locale={locale}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      ))}

      {onAdd && (
        <div className={styles.add}>
          <Button icon="add" block onClick={onAdd}>
            Add item
          </Button>
        </div>
      )}
    </div>
  );
}
