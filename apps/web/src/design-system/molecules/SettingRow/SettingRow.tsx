import { useId, type ReactNode } from "react";
import styles from "./SettingRow.module.css";

type ControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type Props = {
  label: string;
  help?: string;
  error?: string;
  // Spread these props onto the control so the label, help and error reach it.
  children: (control: ControlProps) => ReactNode;
};

// Derived (SPEC-008 §4): label and help on the left, the control on the right;
// they stack when the row is too narrow.
export function SettingRow({ label, help, error, children }: Props) {
  const id = useId();
  const described = [help && `${id}-help`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {help && (
          <p id={`${id}-help`} className={styles.help}>
            {help}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className={styles.error}>
            {error}
          </p>
        )}
      </div>
      <div className={styles.control}>
        {children({
          id,
          "aria-describedby": described || undefined,
          "aria-invalid": error ? true : undefined,
        })}
      </div>
    </div>
  );
}
