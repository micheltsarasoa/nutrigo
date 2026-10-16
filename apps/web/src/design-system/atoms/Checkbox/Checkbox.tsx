import type { InputHTMLAttributes } from "react";
import { Icon } from "../Icon/index.ts";
import styles from "./Checkbox.module.css";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Names the checkbox, e.g. "Mark oats as bought". */
  label: string;
};

// Sprint 4 sketch (grocery list): a square native checkbox, to tell it apart
// from the round MealCheck.
export function Checkbox({ label, ...rest }: Props) {
  return (
    <label className={styles.check}>
      <input
        {...rest}
        type="checkbox"
        className={styles.box}
        aria-label={label}
      />
      <Icon name="check" size="xs" />
    </label>
  );
}
