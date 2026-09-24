import styles from "./ProgressBar.module.css";

// .progress-bar from design/source/nutrigo.css. Over the max, it follows dataviz.html:
// the fill caps at 100 % and turns orange; the caller's label says by how much.
export const PROGRESS_BAR_VARIANTS = ["green", "yellow", "orange"] as const;

type Props = {
  /** Accessible name, e.g. "Carbohydrates". */
  label: string;
  value: number;
  max?: number;
  variant?: (typeof PROGRESS_BAR_VARIANTS)[number];
  thin?: boolean;
};

export function ProgressBar({
  label,
  value,
  max = 100,
  variant = "green",
  thin = false,
}: Props) {
  const over = value > max;
  const percent = Math.round((Math.max(value, 0) / max) * 100);
  const classes = [styles.bar, styles[variant]];
  if (thin) classes.push(styles.thin);
  if (over) classes.push(styles.over);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      aria-valuetext={over ? `${percent} %` : undefined}
      className={classes.join(" ")}
    >
      <div
        className={styles.fill}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
