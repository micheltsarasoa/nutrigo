import { useId } from "react";
import { Card } from "../../atoms/Card/index.ts";
import styles from "./KpiCard.module.css";

export type KpiDelta = {
  direction: "up" | "down";
  /** Already formatted and says what it compares with, e.g. "+€4.20 vs last week". */
  text: string;
};

type Props = {
  label: string;
  /** Already formatted (money, count, kcal). */
  value: string;
  /** Comparison with the previous week. Leave out for the first week. */
  delta?: KpiDelta;
  /** Quiet line when there is no delta: "No previous list", "Estimate excludes 3 items". */
  hint?: string;
};

export function KpiCard({ label, value, delta, hint }: Props) {
  const labelId = useId();
  return (
    <Card>
      <div role="group" aria-labelledby={labelId} className={styles.kpi}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        <span className={styles.value}>{value}</span>
        {delta && (
          <span className={`${styles.delta} ${styles[delta.direction]}`}>
            <span aria-hidden>{delta.direction === "up" ? "▲" : "▼"}</span>{" "}
            <span className={styles.sr}>
              {delta.direction === "up" ? "Up" : "Down"}
            </span>{" "}
            {delta.text}
          </span>
        )}
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
    </Card>
  );
}
