import {
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import styles from "./Field.module.css";

type Common = {
  label: string;
  /** Shown under the control; also marks it invalid. */
  error?: string;
  /** Suffix such as g, kcal, min or €; read out as the control's description. */
  unit?: string;
};
type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id">;
type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;
type Props = Common &
  (
    ({ multiline?: false } & InputProps) | ({ multiline: true } & TextareaProps)
  );

// Derived (SPEC-002 §4): one atom for text, number with a unit, and multi-line input.
export function Field({ label, error, unit, multiline, ...rest }: Props) {
  const id = useId();
  const described = [unit && `${id}-unit`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");
  const a11y = {
    id,
    className: styles.control,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described || undefined,
  };
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={error ? `${styles.box} ${styles.invalid}` : styles.box}>
        {multiline ? (
          <textarea {...(rest as TextareaProps)} {...a11y} />
        ) : (
          <input
            {...(rest as InputProps)}
            {...((rest as InputProps).type === "number" && {
              inputMode: "decimal",
              step: "any",
            })}
            {...a11y}
          />
        )}
        {unit && (
          <span id={`${id}-unit`} className={styles.unit}>
            {unit}
          </span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
