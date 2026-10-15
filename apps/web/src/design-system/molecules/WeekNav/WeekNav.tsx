import { Button } from "../../atoms/Button/index.ts";
import { IconButton } from "../../atoms/IconButton/index.ts";
import styles from "./WeekNav.module.css";

type Props = {
  /** From weekLabel(), e.g. "Oct 5 – 11, 2026". */
  label: string;
  isCurrentWeek: boolean;
  /** The week's plan is loading: busy, but the buttons stay usable so focus is not lost. */
  loading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

// .week-nav from Meal Plan; "This week" is added so a far-away week is one click from today.
export function WeekNav({
  label,
  isCurrentWeek,
  loading = false,
  onPrevious,
  onNext,
  onToday,
}: Props) {
  return (
    <div
      className={styles.nav}
      role="group"
      aria-label="Week"
      aria-busy={loading || undefined}
    >
      <IconButton icon="prev" label="Previous week" onClick={onPrevious} />
      <span
        className={`${styles.label} ${loading ? styles.loading : ""}`}
        aria-current={isCurrentWeek ? "date" : undefined}
      >
        {label}
      </span>
      <IconButton icon="next" label="Next week" onClick={onNext} />
      {!isCurrentWeek && (
        <Button variant="ghost" size="sm" onClick={onToday}>
          This week
        </Button>
      )}
    </div>
  );
}
