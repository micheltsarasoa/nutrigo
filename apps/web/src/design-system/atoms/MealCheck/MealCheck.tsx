import type { InputHTMLAttributes } from "react";
import { Icon } from "../Icon/index.ts";
import styles from "./MealCheck.module.css";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Names the checkbox: "Mark <meal> as eaten". */
  meal: string;
  /** Outlines an unchecked box in orange. Display only: a checked box is done either way. */
  next?: boolean;
};

// .meal-check from design/source/nutrigo.css: a native checkbox, styled.
export function MealCheck({ meal, next = false, ...rest }: Props) {
  return (
    <label className={next ? `${styles.check} ${styles.next}` : styles.check}>
      <input
        {...rest}
        type="checkbox"
        className={styles.box}
        aria-label={`Mark ${meal} as eaten`}
      />
      <Icon name="check" size="xs" />
    </label>
  );
}
