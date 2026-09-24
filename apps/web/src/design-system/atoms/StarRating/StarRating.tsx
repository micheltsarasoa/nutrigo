import { useId } from "react";
import styles from "./StarRating.module.css";

const STARS = [1, 2, 3, 4, 5] as const;

type Props = { value: number } & (
  | { onChange?: never; label?: never }
  | { onChange: (value: number) => void; label: string }
);

// The Icon set has no filled star, so the design's star path is drawn here.
function Star({ empty }: { empty: boolean }) {
  return (
    <svg
      className={`${styles.star} ${empty ? styles.empty : ""}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M12 2l3 6.5 7 .8-5.2 4.7 1.5 6.9L12 17.4 5.7 20.9l1.5-6.9L2 9.3l7-.8z" />
    </svg>
  );
}

// .star-rating from design/source/nutrigo.css. Read-only by default; pass onChange
// and label to make it a native radio group (arrow keys come from the browser).
export function StarRating({ value, onChange, label }: Props) {
  const name = useId();
  if (!onChange) {
    return (
      <span
        className={styles.rating}
        role="img"
        aria-label={`Rated ${value} out of 5`}
      >
        {STARS.map((n) => (
          <Star key={n} empty={n > value} />
        ))}
      </span>
    );
  }
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{label}</legend>
      <span className={`${styles.rating} ${styles.editable}`}>
        {STARS.map((n) => (
          <label key={n} className={styles.option}>
            <input
              className={styles.input}
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={n === 1 ? "1 star" : `${n} stars`}
            />
            <Star empty={n > value} />
          </label>
        ))}
      </span>
    </fieldset>
  );
}
