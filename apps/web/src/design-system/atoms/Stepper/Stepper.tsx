import type { KeyboardEvent } from "react";
import styles from "./Stepper.module.css";

type Props = {
  /** Names the spinbutton ("Servings") and its buttons ("Decrease Servings"). */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
};

// .stepper from design/source/nutrigo.css, as an APG spinbutton: the value is
// the one tab stop (arrows, Home, End); the − / + buttons are for pointers.
// aria-live announces the new value after a tap, while focus stays elsewhere.
export function Stepper({ label, value, min, max, step = 1, onChange }: Props) {
  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    if (clamped !== value) onChange(clamped);
  };
  const keys: Record<string, number> = {
    ArrowUp: value + step,
    ArrowDown: value - step,
    Home: min,
    End: max,
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    set(next);
  };
  return (
    <span className={styles.stepper}>
      <button
        type="button"
        tabIndex={-1}
        className={styles.button}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => set(value - step)}
      >
        −
      </button>
      <span
        role="spinbutton"
        tabIndex={0}
        className={styles.value}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-live="polite"
        onKeyDown={onKeyDown}
      >
        {value}
      </span>
      <button
        type="button"
        tabIndex={-1}
        className={styles.button}
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => set(value + step)}
      >
        +
      </button>
    </span>
  );
}
