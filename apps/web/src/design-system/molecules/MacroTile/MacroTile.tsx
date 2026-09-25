import { Icon } from "../../atoms/Icon/index.ts";
import styles from "./MacroTile.module.css";

export const MACROS = ["kcal", "carbs", "protein", "fat"] as const;

type Props = {
  macro: (typeof MACROS)[number];
  label: string;
  // Already formatted for the locale by the page.
  value: string;
};

// .chip-block from Recipe Details: kcal green, carbs yellow, protein orange, fat grey.
export function MacroTile({ macro, label, value }: Props) {
  return (
    <div className={`${styles.tile} ${styles[macro]}`}>
      <span className={styles.icon} aria-hidden>
        <Icon name={macro} size="sm" />
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      <span className={styles.unit}>{macro === "kcal" ? "kcal" : "g"}</span>
    </div>
  );
}
