import { Pill } from "../../atoms/Pill/index.ts";
import styles from "./DayHead.module.css";

type Props = {
  /** Short weekday, e.g. "Mon". */
  dow: string;
  dayNumber: number;
  /** The day's planned kcal; 0 means no meals. */
  kcal: number;
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
};

// .plan__dayhead from Meal Plan, plus the planned-kcal caption (owner decision, 2026-09-29).
export function DayHead({
  dow,
  dayNumber,
  kcal,
  isToday,
  isSelected,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      className={`${styles.head} ${isSelected ? styles.selected : ""}`}
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      onClick={onSelect}
    >
      <span className={styles.dow}>{dow}</span>
      <span className={styles.num}>{dayNumber}</span>
      <Pill variant={kcal > 0 ? "green" : "outline"}>
        {kcal > 0 ? `${kcal.toLocaleString("en")} kcal` : "No meals"}
      </Pill>
    </button>
  );
}
