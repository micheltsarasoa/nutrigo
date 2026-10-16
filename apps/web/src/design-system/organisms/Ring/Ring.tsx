import type { CSSProperties } from "react";
import { useNumber } from "../../../locale.tsx";
import styles from "./Ring.module.css";

// Calories ring from the Today sketch (sprint-3-today.html). Over target follows dataviz.html:
// full orange ring, and the caption says by how much (never colour alone).
const R = 80;
const C = 2 * Math.PI * R;

type Props = {
  kcal: number;
  /** Daily target in kcal; 0 or missing means no target. */
  target?: number;
  /** Draw the arc with no animation (the playground's reduced-motion state). */
  still?: boolean;
};

export function Ring({ kcal, target = 0, still = false }: Props) {
  const n = useNumber();
  const over = target > 0 && kcal > target;
  const drawn = target > 0 && kcal > 0 ? Math.min(1, kcal / target) : 0;
  const label = `${n(kcal)} kcal${target > 0 ? ` of ${n(target)}` : ", no target"}${over ? ", over target" : ""}`;
  const caption =
    target <= 0
      ? "no target"
      : over
        ? `+${n(kcal - target)} kcal over ▲`
        : `of ${n(target)} kcal`;
  const arc = [styles.arc, over && styles.over, still && styles.still]
    .filter(Boolean)
    .join(" ");
  return (
    <div role="img" aria-label={label} className={styles.ring}>
      <svg viewBox="0 0 184 184" className={styles.svg} aria-hidden="true">
        <circle cx="92" cy="92" r={R} className={styles.track} />
        {drawn > 0 && (
          <circle
            cx="92"
            cy="92"
            r={R}
            className={arc}
            strokeLinecap="round"
            strokeDasharray={`${(C * drawn).toFixed(2)} ${C.toFixed(2)}`}
            transform="rotate(-90 92 92)"
            style={{ "--circumference": C.toFixed(2) } as CSSProperties}
          />
        )}
      </svg>
      <div className={styles.label}>
        <div className={styles.value}>
          {n(kcal)} <small>kcal</small>
        </div>
        <div className={over ? styles.captionOver : styles.caption}>
          {caption}
        </div>
      </div>
    </div>
  );
}
