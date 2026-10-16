import { formatEUR } from "@nutrigo/shared";
import styles from "./Legend.module.css";

export type LegendItem = {
  label: string;
  /** A CSS colour, normally a token: `var(--food-category-grains)`. */
  color: string;
  cents: number;
  /** Already rounded, 0–100. */
  percent: number;
};

type Props = {
  items: LegendItem[];
  locale?: "fr-FR" | "en-IE";
  /** Names the list for screen readers, e.g. "Spend by category". */
  label?: string;
};

// The chart's key: the label always carries the meaning, the swatch only repeats the colour.
export function Legend({ items, locale = "fr-FR", label }: Props) {
  return (
    <ul className={styles.legend} aria-label={label}>
      {items.map((i) => (
        <li key={i.label} className={styles.item}>
          <i
            className={styles.sw}
            style={{ background: i.color }}
            aria-hidden
          />
          <span className={styles.name}>{i.label}</span>
          <span className={styles.value}>
            {formatEUR(i.cents, locale)} · {i.percent}%
          </span>
        </li>
      ))}
    </ul>
  );
}
