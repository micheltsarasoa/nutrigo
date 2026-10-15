import styles from "./MacroBar.module.css";

type Props = {
  macro: "carbs" | "protein" | "fat";
  label: string;
  value: number;
  /** Missing or 0: no bar, the header says "no target". */
  target?: number;
};

// .mb from the Today sketch. Over target the bar stays full and the text says by how much.
export function MacroBar({ macro, label, value, target }: Props) {
  const hasTarget = !!target && target > 0;
  const percent = hasTarget
    ? Math.min(100, Math.round((value / target) * 100))
    : 0;
  return (
    <div className={`${styles.mb} ${styles[macro]}`}>
      <div className={styles.row}>
        <span className={styles.name}>
          <span className={styles.dot} aria-hidden />
          {label}
        </span>
        <span className={styles.val}>
          {hasTarget ? (
            <>
              <b>{value}</b> / {target} g
            </>
          ) : (
            <>
              <b>{value} g</b> · no target
            </>
          )}
        </span>
      </div>
      {hasTarget && (
        <>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={target}
          >
            <div className={styles.fill} style={{ width: `${percent}%` }} />
          </div>
          {value > target && (
            <div className={styles.over}>▲ +{value - target} g over</div>
          )}
        </>
      )}
    </div>
  );
}
