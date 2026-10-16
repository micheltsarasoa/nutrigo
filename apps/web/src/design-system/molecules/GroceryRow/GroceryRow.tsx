import { formatEUR } from "@nutrigo/shared";
import { Checkbox } from "../../atoms/Checkbox/index.ts";
import { MoneyField } from "../../atoms/MoneyField/index.ts";
import { Pill } from "../../atoms/Pill/index.ts";
import { Stepper } from "../../atoms/Stepper/index.ts";
import styles from "./GroceryRow.module.css";

export type GroceryItem = {
  name: string;
  category: string;
  /** null for a manual item with no amount. */
  quantity: number | null;
  unit: string | null;
  kcal: number | null;
  /** The estimate in cents, frozen at generation; null without a price. */
  estCents: number | null;
  actualCents: number | null;
  purchased: boolean;
  manual: boolean;
  /** Ticked, then dropped from the plan (SPEC-005 AC-8). */
  noLongerInPlan: boolean;
  /** Ticked offline, not yet sent. */
  pendingSync: boolean;
};

type Props = {
  item: GroceryItem;
  locale?: "fr-FR" | "en-IE";
  onToggle: (purchased: boolean) => void;
  onQuantity: (quantity: number) => void;
  onActual: (cents: number | null) => void;
};

const dash = "–";

// Sprint 4 sketch (grocery list, desktop): one table row. Props only; the
// organism owns the header, the data and the sync.
export function GroceryRow({
  item,
  locale = "fr-FR",
  onToggle,
  onQuantity,
  onActual,
}: Props) {
  const { name, quantity, unit, purchased } = item;
  const step = unit === "g" || unit === "ml" ? 10 : 1;
  const status = item.noLongerInPlan ? (
    <Pill variant="orange">No longer in plan</Pill>
  ) : item.pendingSync ? (
    <Pill variant="yellow">Waiting to sync</Pill>
  ) : purchased ? (
    <Pill variant="green">Bought</Pill>
  ) : (
    <Pill variant="grey">Pending</Pill>
  );
  const rowClass = [
    styles.row,
    purchased && styles.done,
    item.noLongerInPlan && styles.orphan,
    item.pendingSync && styles.sync,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClass}>
      <Checkbox
        label={`Mark ${name} as ${purchased ? "not bought" : "bought"}`}
        checked={purchased}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className={styles.name}>
        {name}
        {item.manual && <Pill variant="grey">manual</Pill>}
      </span>
      <span>{item.category}</span>
      <span className={styles.qty}>
        {quantity === null ? (
          dash
        ) : purchased ? (
          <span className={styles.num}>
            {quantity} {unit}
          </span>
        ) : (
          <>
            <Stepper
              label={`Quantity of ${name}`}
              value={quantity}
              min={step}
              max={99999}
              step={step}
              onChange={onQuantity}
            />
            {unit}
          </>
        )}
      </span>
      <span className={styles.num}>{item.kcal ?? dash}</span>
      <span className={styles.num}>
        {item.estCents === null ? dash : `~${formatEUR(item.estCents, locale)}`}
      </span>
      <span className={styles.status}>
        {purchased && (
          <span className={styles.actual}>
            <MoneyField
              label={`Actual price of ${name}`}
              value={item.actualCents}
              locale={locale}
              onChange={onActual}
            />
          </span>
        )}
        {status}
      </span>
    </div>
  );
}
