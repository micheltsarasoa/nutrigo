import { formatEUR } from "@nutrigo/shared";
import { Checkbox } from "../../atoms/Checkbox/index.ts";
import { Pill } from "../../atoms/Pill/index.ts";
import type { GroceryItem } from "../GroceryRow/index.ts";
import styles from "./CheckRow.module.css";

type Props = {
  item: GroceryItem;
  locale?: "fr-FR" | "en-IE";
  onToggle: (purchased: boolean) => void;
  /** Opens the item's detail, where the actual price is entered. */
  onOpen?: () => void;
};

// Sprint 4 sketch, derived mobile row (ADR-0016): the tick never opens a
// dialog; the body does, when onOpen is given.
export function CheckRow({ item, locale = "fr-FR", onToggle, onOpen }: Props) {
  const { name, purchased } = item;
  const price =
    purchased && item.actualCents !== null
      ? formatEUR(item.actualCents, locale)
      : item.estCents === null
        ? "–"
        : `~${formatEUR(item.estCents, locale)}`;
  const amount =
    item.quantity === null ? "–" : `${item.quantity} ${item.unit ?? ""}`.trim();
  const flag = item.noLongerInPlan ? (
    <Pill variant="orange">No longer in plan</Pill>
  ) : item.pendingSync ? (
    <Pill variant="yellow">Waiting to sync</Pill>
  ) : null;
  const rowClass = [
    styles.row,
    purchased && styles.done,
    item.noLongerInPlan && styles.orphan,
    item.pendingSync && styles.sync,
  ]
    .filter(Boolean)
    .join(" ");
  const body = (
    <>
      <span className={styles.name}>
        {name}
        {item.manual && <Pill variant="grey">manual</Pill>}
      </span>
      <span className={styles.meta}>
        {flag ? `${amount} · ` : `${amount} · ${price}`}
        {flag}
      </span>
    </>
  );

  return (
    <div className={rowClass}>
      <Checkbox
        label={`Mark ${name} as ${purchased ? "not bought" : "bought"}`}
        checked={purchased}
        onChange={(e) => onToggle(e.target.checked)}
      />
      {onOpen ? (
        <button type="button" className={styles.body} onClick={onOpen}>
          {body}
        </button>
      ) : (
        <div className={styles.body}>{body}</div>
      )}
    </div>
  );
}
