import { useId, type SelectHTMLAttributes } from "react";
import { Icon } from "../Icon/index.ts";
import styles from "./Select.module.css";

type Props = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "children" | "multiple"
> & {
  label: string;
  options: readonly { value: string; text: string }[];
  /** A first, unpickable option such as "Choose…" (pair it with defaultValue=""). */
  placeholder?: string;
  error?: string;
};

// Derived (SPEC-002 §4, SPEC-008 §4): a form select with a visible label, matching Field.
export function Select({ label, options, placeholder, error, ...rest }: Props) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <span className={styles.box}>
        <select
          {...rest}
          id={id}
          className={
            error ? `${styles.select} ${styles.invalid}` : styles.select
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.text}
            </option>
          ))}
        </select>
        <Icon name="chevron" size="xs" />
      </span>
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
